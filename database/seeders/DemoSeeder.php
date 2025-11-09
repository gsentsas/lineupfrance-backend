<?php

namespace Database\Seeders;

use App\Models\ClientProfile;
use App\Models\LinerPreference;
use App\Models\LinerProfile;
use App\Models\Mission;
use App\Models\Notification;
use App\Models\PaymentMethod;
use App\Models\PayoutAccount;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $clara = User::updateOrCreate(
            ['email' => 'clara.dubois@email.com'],
            [
                'name' => 'Clara Dubois',
                'password' => bcrypt('password'),
                'role' => 'client',
                'phone' => '+33612345678',
                'avatar_url' => 'https://i.pravatar.cc/150?img=5',
            ]
        );

        $claraProfile = ClientProfile::updateOrCreate(
            ['user_id' => $clara->id],
            [
                'address' => '5 Bd du Temple, 75011 Paris',
                'preferred_communication' => 'push',
            ]
        );

        $visa = PaymentMethod::updateOrCreate(
            ['id' => 'pm-card-visa'],
            [
                'user_id' => $clara->id,
                'provider' => 'card',
                'label' => 'Visa •••• 4242',
                'status' => 'active',
                'is_default' => true,
                'meta' => [
                    'brand' => 'Visa',
                    'last4' => '4242',
                    'expiry' => '08/27',
                ],
            ]
        );

        $paypal = PaymentMethod::updateOrCreate(
            ['id' => 'pm-paypal'],
            [
                'user_id' => $clara->id,
                'provider' => 'paypal',
                'label' => 'PayPal — clara.dubois@email.com',
                'status' => 'active',
                'is_default' => false,
                'meta' => [
                    'email' => 'clara.dubois@email.com',
                ],
            ]
        );

        $stripe = PaymentMethod::updateOrCreate(
            ['id' => 'pm-stripe'],
            [
                'user_id' => $clara->id,
                'provider' => 'stripe',
                'label' => 'Stripe — Clara Entreprise',
                'status' => 'pending',
                'is_default' => false,
                'meta' => [
                    'accountId' => 'acct_1ABCDL34',
                ],
            ]
        );

        $claraProfile->default_payment_method_id = $visa->id;
        $claraProfile->save();

        $ops = User::updateOrCreate(
            ['email' => 'ops@lineupfrance.com'],
            [
                'name' => 'LineUp Ops',
                'password' => bcrypt('LineUp2025!'),
                'role' => 'admin',
                'team_role' => 'ops',
                'phone' => '+33102030405',
                'avatar_url' => 'https://i.pravatar.cc/150?img=47',
            ]
        );

        $samir = User::updateOrCreate(
            ['email' => 'samir.koulibaly@email.com'],
            [
                'name' => 'Samir Koulibaly',
                'password' => bcrypt('password'),
                'role' => 'liner',
                'phone' => '+33678563412',
                'avatar_url' => 'https://i.pravatar.cc/150?img=12',
            ]
        );

        $linerProfile = LinerProfile::updateOrCreate(
            ['user_id' => $samir->id],
            [
                'bio' => 'Liner expérimenté sur Paris depuis 2 ans. Disponible en journée et soirée.',
                'hourly_rate' => 18,
                'availability' => 'Lun - Dim • 7h - 22h',
                'rating' => 4.9,
                'missions_completed' => 128,
                'kyc_status' => 'review',
                'kyc_last_submitted' => now()->subDay(),
                'kyc_checklist' => [
                    ['id' => 'identity', 'label' => "Pièce d'identité", 'completed' => true],
                    ['id' => 'selfie', 'label' => 'Selfie de confirmation', 'completed' => true],
                    ['id' => 'background', 'label' => 'Extrait de casier judiciaire', 'completed' => false],
                    ['id' => 'address', 'label' => 'Justificatif de domicile', 'completed' => true],
                ],
            ]
        );

        $stripeConnect = PayoutAccount::updateOrCreate(
            ['id' => 'po-stripe'],
            [
                'user_id' => $samir->id,
                'provider' => 'stripe',
                'label' => 'Stripe Connect — **** 1020',
                'status' => 'active',
                'is_default' => true,
                'meta' => [
                    'bankName' => 'BNP Paribas',
                    'last4' => '1020',
                ],
            ]
        );

        PayoutAccount::updateOrCreate(
            ['id' => 'po-paypal'],
            [
                'user_id' => $samir->id,
                'provider' => 'paypal',
                'label' => 'PayPal — samir.koulibaly@email.com',
                'status' => 'active',
                'is_default' => false,
                'meta' => [
                    'email' => 'samir.koulibaly@email.com',
                ],
            ]
        );

        $linerProfile->payout_method_id = $stripeConnect->id;
        $linerProfile->save();

        LinerPreference::updateOrCreate(
            ['user_id' => $samir->id],
            [
                'night_missions' => false,
                'max_distance_km' => 8,
                'min_earning_euros' => 15,
                'auto_accept' => false,
            ]
        );

        // Missions
        Mission::updateOrCreate(
            ['id' => 'mission-coachella'],
            [
                'client_id' => $clara->id,
                'liner_id' => null,
                'title' => 'Attendre pour billetterie Coachella — Boutique Fnac République',
                'description' => 'Acheter les billets dès l\'ouverture de la billetterie.',
                'type' => 'evenement',
                'location_label' => '5 Bd du Temple, 75011 Paris',
                'distance_km' => 0.3,
                'scheduled_at' => now()->addDay()->setTime(10, 30),
                'duration_minutes' => 120,
                'budget_cents' => 1800,
                'commission_cents' => 270,
                'currency' => 'EUR',
                'status' => 'accepted',
                'progress_status' => 'pending',
                'booking_status' => 'confirmed',
                'payment_status' => 'authorized',
                'published_at' => now()->subDay(),
            ]
        );

        Mission::updateOrCreate(
            ['id' => 'mission-adidas'],
            [
                'client_id' => $clara->id,
                'liner_id' => null,
                'title' => 'Ticket ouverture boutique adidas — Boulevard Haussmann',
                'description' => 'Récupérer un ticket VIP pour la soirée de lancement.',
                'type' => 'magasin',
                'location_label' => '26 Bd Haussmann, 75009 Paris',
                'distance_km' => 1.5,
                'scheduled_at' => now()->addDays(2)->setTime(8, 0),
                'duration_minutes' => 90,
                'budget_cents' => 1500,
                'commission_cents' => 225,
                'currency' => 'EUR',
                'status' => 'in_progress',
                'progress_status' => 'en_route',
                'booking_status' => 'in_progress',
                'payment_status' => 'authorized',
                'published_at' => now()->subDays(2),
            ]
        );

        Mission::updateOrCreate(
            ['id' => 'mission-poste'],
            [
                'client_id' => $clara->id,
                'liner_id' => $samir->id,
                'title' => 'Récupérer un paquet chez La Poste — Rue du Faubourg Saint-Denis',
                'description' => 'Colis à récupérer avant 16h avec pièce d\'identité.',
                'type' => 'administration',
                'location_label' => '50 Rue du Faubourg Saint-Denis, 75010 Paris',
                'distance_km' => 1.2,
                'scheduled_at' => now()->addHours(3),
                'duration_minutes' => 40,
                'budget_cents' => 700,
                'currency' => 'EUR',
                'status' => 'published',
                'progress_status' => 'pending',
                'published_at' => now()->subHours(6),
            ]
        );

        // Notifications
        Notification::updateOrCreate(
            ['id' => Str::uuid()->toString()],
            [
                'user_id' => $clara->id,
                'title' => 'Mission acceptée',
                'message' => 'Samir K. a accepté votre mission “Ticket Adidas Champs-Élysées”.',
                'category' => 'mission',
                'created_at' => now()->subMinutes(15),
            ]
        );

        Notification::updateOrCreate(
            ['id' => Str::uuid()->toString()],
            [
                'user_id' => $clara->id,
                'title' => 'Suivi en direct',
                'message' => 'Samir est en route vers la FNAC République. ETA 12 min.',
                'category' => 'mission',
                'created_at' => now()->subMinutes(45),
            ]
        );

        Notification::updateOrCreate(
            ['id' => Str::uuid()->toString()],
            [
                'user_id' => $clara->id,
                'title' => 'Paiement réussi',
                'message' => 'Votre mission “Récupérer un colis à La Poste” a été réglée (18 €).',
                'category' => 'payment',
                'read_at' => now()->subHours(5),
                'created_at' => now()->subHours(5),
            ]
        );

        // Wallet transactions for Clara (debits)
        WalletTransaction::updateOrCreate(
            ['id' => 'txn-client-1'],
            [
                'user_id' => $clara->id,
                'type' => 'debit',
                'status' => 'completed',
                'amount_cents' => 1800,
                'currency' => 'EUR',
                'description' => 'Mission billetterie Fnac',
                'counterparty' => 'Samir K.',
                'method' => 'Carte Visa',
                'created_at' => now()->subHours(3),
            ]
        );

        WalletTransaction::updateOrCreate(
            ['id' => 'txn-client-2'],
            [
                'user_id' => $clara->id,
                'type' => 'debit',
                'status' => 'pending',
                'amount_cents' => 2200,
                'currency' => 'EUR',
                'description' => 'Mission Apple Store Champs-Élysées',
                'counterparty' => 'Samir K.',
                'method' => 'Stripe',
                'created_at' => now()->subHours(2),
            ]
        );

        // Wallet transactions for Samir (credits)
        WalletTransaction::updateOrCreate(
            ['id' => 'txn-liner-1'],
            [
                'user_id' => $samir->id,
                'type' => 'credit',
                'status' => 'pending',
                'amount_cents' => 2200,
                'currency' => 'EUR',
                'description' => 'Mission Apple Store Champs-Élysées',
                'counterparty' => 'Clara D.',
                'method' => 'Stripe Connect',
                'created_at' => now()->subMinutes(90),
            ]
        );

        WalletTransaction::updateOrCreate(
            ['id' => 'txn-liner-2'],
            [
                'user_id' => $samir->id,
                'type' => 'credit',
                'status' => 'completed',
                'amount_cents' => 700,
                'currency' => 'EUR',
                'description' => 'Récupération colis La Poste',
                'counterparty' => 'Clara D.',
                'method' => 'PayPal',
                'created_at' => now()->subHours(20),
            ]
        );
    }
}
