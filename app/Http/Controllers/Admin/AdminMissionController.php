<?php

namespace App\Http\Controllers\Admin;

use App\Events\MissionUpdated;
use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\MissionApplication;
use App\Models\User;
use App\Models\ChatMessage;
use App\Services\Payments\MissionPaymentService;
use App\Services\Audit\AuditLogger;
use App\Services\Notifications\OpsDecisionNotifier;
use App\Models\AuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class AdminMissionController extends Controller
{
    public function __construct(
        private MissionPaymentService $paymentService,
        private AuditLogger $auditLogger,
        private OpsDecisionNotifier $opsNotifier,
    )
    {
    }

    public function index(Request $request): View
    {
        $status = $request->string('status')->trim();
        $search = $request->string('search')->trim();

        $missions = Mission::query()
            ->with(['client', 'liner'])
            ->when($status->isNotEmpty(), function ($query) use ($status) {
                $statuses = collect(explode(',', $status))
                    ->map(fn ($value) => trim($value))
                    ->filter();

                $query->whereIn('status', $statuses);
            })
            ->when($search->isNotEmpty(), function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('title', 'like', "%{$search}%")
                        ->orWhere('location_label', 'like', "%{$search}%")
                        ->orWhereHas('client', fn ($client) => $client->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('liner', fn ($liner) => $liner->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderByDesc('created_at')
            ->paginate(12)
            ->withQueryString();

        $statuses = [
            'published' => 'En ligne',
            'accepted' => 'Acceptée',
            'in_progress' => 'En cours',
            'completed' => 'Terminée',
            'cancelled' => 'Annulée',
        ];

        $clientOptions = User::query()
            ->where('role', 'client')
            ->orderBy('name')
            ->limit(50)
            ->get(['id', 'name', 'email']);

        return view('admin.missions', [
            'missions' => $missions,
            'statuses' => $statuses,
            'activeStatus' => $status->toString(),
            'search' => $search->toString(),
            'clientOptions' => $clientOptions,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'client_id' => ['required', 'integer', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['nullable', 'string', 'max:100'],
            'location_label' => ['nullable', 'string', 'max:255'],
            'scheduled_at' => ['nullable', 'date'],
            'duration_minutes' => ['nullable', 'integer', 'min:0'],
            'budget_euros' => ['nullable', 'numeric', 'min:0'],
        ]);

        $client = User::query()
            ->where('role', 'client')
            ->findOrFail($data['client_id']);

        $mission = Mission::create([
            'client_id' => $client->id,
            'title' => $data['title'],
            'description' => Arr::get($data, 'description'),
            'type' => Arr::get($data, 'type'),
            'location_label' => Arr::get($data, 'location_label'),
            'scheduled_at' => Arr::get($data, 'scheduled_at'),
            'duration_minutes' => Arr::get($data, 'duration_minutes'),
            'budget_cents' => isset($data['budget_euros']) ? (int) round($data['budget_euros'] * 100) : 0,
            'currency' => 'EUR',
            'status' => 'published',
            'progress_status' => 'pending',
            'published_at' => now(),
        ]);

        MissionUpdated::dispatch($mission->fresh());

        return redirect()
            ->route('admin.missions')
            ->with('mission_created', [
                'title' => $mission->title,
                'client' => $client->name,
            ]);
    }

    public function show(Mission $mission): View
    {
        $mission->load(['client', 'liner', 'applications.liner']);

        $statusLabels = [
            'published' => 'Publiée',
            'accepted' => 'Acceptée',
            'in_progress' => 'En cours',
            'completed' => 'Terminée',
            'cancelled' => 'Annulée',
        ];

        $progressLabels = [
            'pending' => 'En attente',
            'en_route' => 'En route',
            'arrived' => 'Arrivé',
            'queueing' => 'File commencée',
            'done' => 'Mission terminée',
            'cancelled' => 'Annulée',
        ];

        $linerOptions = User::query()
            ->where('role', 'liner')
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
        $auditLogs = AuditLog::query()
            ->where('mission_id', $mission->id)
            ->orderByDesc('created_at')
            ->limit(25)
            ->with('actor')
            ->get();
        $chatMessages = $mission->chatMessages()
            ->with('user')
            ->latest()
            ->limit(50)
            ->get()
            ->sortBy('created_at')
            ->values();

        return view('admin.mission-show', [
            'mission' => $mission,
            'statusLabels' => $statusLabels,
            'progressLabels' => $progressLabels,
            'liners' => $linerOptions,
            'frontendUrl' => $frontendUrl,
            'auditLogs' => $auditLogs,
            'chatMessages' => $chatMessages,
        ]);
    }

    public function assignLiner(Request $request, Mission $mission): RedirectResponse
    {
        $data = $request->validate([
            'liner_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        abort_if($mission->status === 'completed', 422, 'Mission terminée, ré-assignation impossible.');

        $assignedLinerName = null;

        if (! empty($data['liner_id'])) {
            $liner = User::query()
                ->where('role', 'liner')
                ->findOrFail($data['liner_id']);

            $mission->liner_id = $liner->id;
            $mission->status = 'accepted';
            $mission->progress_status = $mission->progress_status ?: 'pending';
            $mission->booking_status = 'confirmed';
            $mission->payment_status = $mission->payment_status ?: 'pending';
            $mission->save();
            $this->paymentService->authorize($mission->fresh());
            $assignedLinerName = $liner->name;
        } else {
            $mission->liner_id = null;
            $mission->status = 'published';
            $mission->progress_status = 'pending';
            $mission->booking_status = 'open';
            $mission->payment_status = 'pending';
            $mission->save();
        }

        MissionUpdated::dispatch($mission->fresh());

        $this->auditLogger->logMission(
            $mission,
            'mission.assignment',
            empty($data['liner_id'])
                ? 'Désaffectation de la mission.'
                : "Mission attribuée à {$assignedLinerName}.",
            [
                'liner_id' => $mission->liner_id,
            ]
        );

        return back()->with('mission_status', 'Affectation mise à jour.');
    }

    public function updateLifecycle(Request $request, Mission $mission): RedirectResponse
    {
        $previous = [
            'status' => $mission->status,
            'progress' => $mission->progress_status,
            'booking' => $mission->booking_status,
            'payment' => $mission->payment_status,
        ];

        $data = $request->validate([
            'status' => ['nullable', Rule::in(['published', 'accepted', 'in_progress', 'completed', 'cancelled'])],
            'progress_status' => ['nullable', Rule::in(['pending', 'en_route', 'arrived', 'queueing', 'done', 'cancelled'])],
        ]);

        if ($data['status'] ?? null) {
            $mission->status = $data['status'];
        }

        if ($data['progress_status'] ?? null) {
            $mission->progress_status = $data['progress_status'];
        }

        if ($mission->status === 'cancelled' || $mission->progress_status === 'cancelled') {
            $mission->status = 'cancelled';
            $mission->progress_status = 'cancelled';
            $mission->booking_status = 'cancelled';
            $mission->payment_status = $mission->payment_status === 'captured' ? 'captured' : 'cancelled';
        } elseif ($mission->progress_status === 'done' || $mission->status === 'completed') {
            $mission->status = 'completed';
            $mission->progress_status = 'done';
            $mission->booking_status = 'completed';
            $mission->completed_at = now();
            $this->paymentService->capture($mission);
        } elseif (in_array($mission->progress_status, ['en_route', 'arrived', 'queueing'], true)) {
            $mission->booking_status = 'in_progress';
            $mission->status = $mission->status === 'published' ? 'in_progress' : $mission->status;
        }

        $mission->save();

        MissionUpdated::dispatch($mission->fresh());

        $this->auditLogger->logMission(
            $mission,
            'mission.lifecycle',
            'Statuts de mission mis à jour.',
            [
                'before' => $previous,
                'after' => [
                    'status' => $mission->status,
                    'progress' => $mission->progress_status,
                    'booking' => $mission->booking_status,
                    'payment' => $mission->payment_status,
                ],
            ]
        );

        return back()->with('mission_status', 'Statut de mission mis à jour.');
    }

    public function handlePaymentAction(Request $request, Mission $mission): RedirectResponse
    {
        $data = $request->validate([
            'action' => ['required', Rule::in(['authorize', 'capture'])],
        ]);

        if ($data['action'] === 'authorize') {
            $this->paymentService->authorize($mission);
            $message = 'Pré-autorisation relancée.';
        } else {
            $this->paymentService->capture($mission);
            $message = 'Paiement capturé.';
        }

        MissionUpdated::dispatch($mission->fresh());

        $this->auditLogger->logMission(
            $mission,
            'mission.payment',
            $message,
            [
                'action' => $data['action'],
                'payment_status' => $mission->payment_status,
            ]
        );

        return back()->with('mission_status', $message);
    }

    public function refreshQr(Mission $mission): RedirectResponse
    {
        $mission->qr_token = (string) Str::uuid();
        $mission->save();

        MissionUpdated::dispatch($mission->fresh());

        $this->auditLogger->logMission(
            $mission,
            'mission.qr_refresh',
            'QR code régénéré par un membre Ops.',
            ['qr_token' => $mission->qr_token]
        );

        return back()->with('mission_status', 'QR code régénéré.');
    }

    public function decideApplication(Request $request, Mission $mission, MissionApplication $application): RedirectResponse
    {
        abort_if($application->mission_id !== $mission->id, 404);

        $data = $request->validate([
            'decision' => ['required', Rule::in(['accept', 'reject'])],
        ]);

        if ($data['decision'] === 'accept') {
            $mission->liner_id = $application->liner_id;
            $mission->status = 'accepted';
            $mission->progress_status = $mission->progress_status ?: 'pending';
            $mission->booking_status = 'confirmed';
            $mission->payment_status = $mission->payment_status ?: 'pending';
            $mission->save();

            $application->status = 'accepted';
            $application->accepted_at = now();
            $application->rejected_at = null;
            $application->save();

            $this->paymentService->authorize($mission->fresh());

            // Reject other pending applications so the liner is unique.
            MissionApplication::query()
                ->where('mission_id', $mission->id)
                ->where('id', '!=', $application->id)
                ->where('status', 'pending')
                ->update([
                    'status' => 'rejected',
                    'rejected_at' => now(),
                ]);

            $message = 'Candidature acceptée et mission attribuée.';
            $this->opsNotifier->applicationAccepted($mission->fresh('client'), $application->load('liner'));
        } else {
            $application->status = 'rejected';
            $application->rejected_at = now();
            $application->save();
            $message = 'Candidature refusée.';
            $this->opsNotifier->applicationRejected($mission->fresh('client'), $application->load('liner'));
        }

        MissionUpdated::dispatch($mission->fresh());

        $this->auditLogger->logMission(
            $mission,
            'mission.application.'.$data['decision'],
            $message,
            [
                'application_id' => $application->id,
                'liner_id' => $application->liner_id,
            ]
        );

        return back()->with('mission_status', $message);
    }

    public function postChatMessage(Request $request, Mission $mission): RedirectResponse
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $message = $mission->chatMessages()->create([
            'user_id' => $request->user()->id,
            'role' => 'ops',
            'body' => $data['body'],
        ]);

        MissionMessageCreated::dispatch($message->fresh('user'));

        $this->auditLogger->logMission(
            $mission,
            'mission.chat.ops',
            'Message envoyé par le support Ops.',
            ['message_id' => $message->id]
        );

        return back()->with('mission_status', 'Message envoyé dans le chat.');
    }
}
