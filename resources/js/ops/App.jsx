import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, NavLink, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './styles.css';

axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content ?? null;
if (csrf) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrf;
}

const API_BASE = '/ops/api';

const NAV_CONFIG = [
    { key: 'dashboard', icon: 'ri-dashboard-line', path: '/' },
    { key: 'missions', icon: 'ri-flag-2-line', path: '/missions' },
    { key: 'clients', icon: 'ri-user-3-line', path: '/clients' },
    { key: 'liners', icon: 'ri-team-line', path: '/liners' },
    { key: 'payments', icon: 'ri-bank-card-line', path: '/payments' },
    { key: 'support', icon: 'ri-customer-service-2-line', path: '/support' },
    { key: 'settings', icon: 'ri-settings-3-line', path: '/actions' },
];

const translations = {
    fr: {
        'brand.subtitle.admin': 'Accès administrateur',
        'brand.subtitle.guest': 'Invité',
        'nav.dashboard': 'Tableau de bord',
        'nav.missions': 'Missions',
        'nav.clients': 'Clients',
        'nav.liners': 'Liners',
        'nav.payments': 'Paiements',
        'nav.support': 'Support',
        'nav.settings': 'Actions rapides',
        'topbar.greeting': 'Bonjour {name}',
        'topbar.subtitle': 'Surveillez missions, paiements et incidents en live.',
        'actions.createTest': 'Mission test',
        'actions.broadcast': 'Flash info',
        'actions.refreshTables': 'Rafraîchir les tableaux',
        'stats.missions': 'Missions actives',
        'stats.queueSuffix': 'en file',
        'stats.payments': 'Paiements en cours',
        'stats.paymentsTrend': 'Autorisation en attente',
        'stats.volume': 'Volume semaine',
        'stats.volumeTrend': '+ mission premium',
        'panels.providers.title': 'Prestataires de paiement',
        'panels.providers.subtitle': 'Stripe, PayPal, Adyen, Apple Pay & Google Pay',
        'panels.missions.title': 'Missions en direct',
        'panels.missions.subtitle': 'Dernières 10 missions publiées',
        'panels.clients.title': 'Clients récents',
        'panels.clients.subtitle': 'Inscriptions (8 derniers)',
        'panels.liners.title': 'Liners récents',
        'panels.liners.subtitle': 'Candidatures validées',
        'panels.alerts.title': 'Centre d’alertes',
        'panels.alerts.subtitle': 'Derniers événements Ops',
        'button.refresh': 'Rafraîchir',
        'button.close': 'Fermer',
        'loading': 'Chargement...',
        'empty': 'Aucune donnée disponible.',
        'notifications.empty': 'Rien à signaler.',
        'notifications.title': 'Notifications Ops',
        'notifications.unread': '{count} non lues',
        'notifications.markAll': 'Tout marquer lu',
        'notifications.markRead': 'Marquer lu',
        'notifications.refresh': 'Actualiser',
        'notifications.close': 'Fermer',
        'notifications.openDrawer': 'Ouvrir le centre',
        'install.badge': 'LineUp Console',
        'install.cta': "Installer l’app web",
        'pager.prev': 'Précédent',
        'pager.next': 'Suivant',
        'pager.summary': 'Page {page} · {total} entrées',
        'language.toggle': 'EN',
        'status.open': 'Ouvertes',
        'status.assigned': 'Assignées',
        'status.inProgress': 'En cours',
        'status.done': 'Terminées',
        'status.active': 'Actif',
        'status.idle': 'Inactif',
        'status.vip': 'VIP',
        'status.pending': 'En attente',
        'status.verified': 'Vérifié',
        'status.rejected': 'Refusé',
        'filters.all': 'Tout afficher',
        'clients.filter.active': 'Actifs',
        'clients.filter.idle': 'Inactifs',
        'clients.filter.vip': 'VIP',
        'clients.filter.all': 'Tous',
        'liners.filter.pending': 'En cours',
        'liners.filter.verified': 'Validés',
        'liners.filter.rejected': 'Refusés',
        'liners.filter.all': 'Tous',
        'liners.minRating': 'Note min.',
        'liners.maxRating': 'Note max.',
        'search.generic': 'Rechercher…',
        'search.missions': 'Rechercher une mission…',
        'table.mission': 'Mission',
        'table.status': 'Statut',
        'table.budget': 'Budget',
        'table.applications': 'Candidats',
        'table.client': 'Client',
        'table.missions': 'Missions',
        'table.ltv': 'LTV',
        'table.lastMission': 'Dernière mission',
        'table.liner': 'Liner',
        'table.provider': 'Prestataire',
        'table.owner': 'Utilisateur',
        'table.updated': 'Mise à jour',
        'table.rating': 'Note',
        'table.kyc': 'KYC',
        'table.earnings': 'Revenus',
        'table.payout': 'Paiement',
        'table.payoutReady': 'Prêt',
        'table.payoutMissing': 'À configurer',
        'table.empty.missions': 'Aucune mission trouvée.',
        'table.empty.clients': 'Aucun client trouvé.',
        'table.empty.liners': 'Aucun liner trouvé.',
        'text.unknownClient': 'Client inconnu',
        'support.empty': 'Aucune alerte en cours.',
        'support.viewDrawer': 'Ouvrir le centre',
        'providers.enabled': 'Activé',
        'providers.disabled': 'Désactivé',
        'providers.lastWebhook': 'Dernier webhook',
        'providers.lastFailure': 'Dernière erreur',
        'providers.save': 'Sauvegarder',
        'providers.saving': 'Enregistrement…',
        'providers.status.healthy': 'Opérationnel',
        'providers.status.stale': 'Silencieux',
        'providers.status.failing': 'Incident',
        'providers.status.unknown': 'Inconnu',
        'providers.awaitingAdmin': 'Bientôt disponible (validation admin requise).',
        'providers.readyForOps': 'Validé admin · Ops peut activer.',
        'providers.live': 'Actif pour les clients et liners.',
        'payouts.title': 'Comptes de versement',
        'payouts.subtitle': 'Statut Stripe/PayPal pour les liners',
        'payouts.empty': 'Aucun compte Stripe/PayPal n’a encore été enregistré.',
        'payouts.search': 'Rechercher un liner ou prestataire',
        'toast.overviewError': 'Impossible de charger les indicateurs.',
        'toast.providersError': 'Impossible de charger les prestataires.',
        'toast.payoutsError': 'Impossible de charger les comptes de versement.',
        'toast.notificationsError': 'Impossible de charger les notifications.',
        'toast.missionsError': 'Impossible de charger les missions.',
        'toast.clientsError': 'Impossible de charger les clients.',
        'toast.linersError': 'Impossible de charger les liners.',
        'toast.createMissionSuccess': 'Mission test créée.',
        'toast.createMissionError': 'Impossible de créer la mission test.',
        'toast.broadcastSuccess': 'Flash info diffusé.',
        'toast.broadcastError': 'Impossible d’envoyer le flash info.',
        'toast.providerSaveSuccess': 'Configuration enregistrée.',
        'toast.providerSaveError': 'Impossible d’enregistrer ce prestataire.',
        'toast.notificationReadError': 'Lecture impossible.',
        'toast.notificationReadAllError': 'Action impossible.',
        'prompt.broadcastTitle': 'Titre du flash info :',
        'prompt.broadcastMessage': 'Message diffusé :',
    },
    en: {
        'brand.subtitle.admin': 'Admin access',
        'brand.subtitle.guest': 'Guest',
        'nav.dashboard': 'Dashboard',
        'nav.missions': 'Missions',
        'nav.clients': 'Clients',
        'nav.liners': 'Liners',
        'nav.payments': 'Payments',
        'nav.support': 'Support',
        'nav.settings': 'Quick actions',
        'topbar.greeting': 'Hello {name}',
        'topbar.subtitle': 'Monitor missions, payments and incidents in real time.',
        'actions.createTest': 'Test mission',
        'actions.broadcast': 'Broadcast alert',
        'actions.refreshTables': 'Refresh tables',
        'stats.missions': 'Active missions',
        'stats.queueSuffix': 'waiting',
        'stats.payments': 'Payments in progress',
        'stats.paymentsTrend': 'Authorization pending',
        'stats.volume': 'Weekly volume',
        'stats.volumeTrend': '+ premium mission',
        'panels.providers.title': 'Payment providers',
        'panels.providers.subtitle': 'Stripe, PayPal, Adyen, Apple Pay & Google Pay',
        'panels.missions.title': 'Live missions',
        'panels.missions.subtitle': 'Latest 10 published missions',
        'panels.clients.title': 'Recent clients',
        'panels.clients.subtitle': 'Last 8 signups',
        'panels.liners.title': 'Recent liners',
        'panels.liners.subtitle': 'Validated applications',
        'panels.alerts.title': 'Alert center',
        'panels.alerts.subtitle': 'Latest Ops events',
        'button.refresh': 'Refresh',
        'button.close': 'Close',
        'loading': 'Loading...',
        'empty': 'No data available.',
        'notifications.empty': 'Nothing to report.',
        'notifications.title': 'Ops notifications',
        'notifications.unread': '{count} unread',
        'notifications.markAll': 'Mark all read',
        'notifications.markRead': 'Mark read',
        'notifications.refresh': 'Refresh',
        'notifications.close': 'Close',
        'notifications.openDrawer': 'Open center',
        'install.badge': 'LineUp Console',
        'install.cta': 'Install web app',
        'pager.prev': 'Previous',
        'pager.next': 'Next',
        'pager.summary': 'Page {page} · {total} rows',
        'language.toggle': 'FR',
        'status.open': 'Open',
        'status.assigned': 'Assigned',
        'status.inProgress': 'In progress',
        'status.done': 'Completed',
        'status.active': 'Active',
        'status.idle': 'Dormant',
        'status.vip': 'VIP',
        'status.pending': 'Pending',
        'status.verified': 'Verified',
        'status.rejected': 'Rejected',
        'filters.all': 'Show all',
        'clients.filter.active': 'Active',
        'clients.filter.idle': 'Dormant',
        'clients.filter.vip': 'VIP',
        'clients.filter.all': 'All',
        'liners.filter.pending': 'In review',
        'liners.filter.verified': 'Approved',
        'liners.filter.rejected': 'Rejected',
        'liners.filter.all': 'All',
        'liners.minRating': 'Min rating',
        'liners.maxRating': 'Max rating',
        'search.generic': 'Search…',
        'search.missions': 'Search missions…',
        'table.mission': 'Mission',
        'table.status': 'Status',
        'table.budget': 'Budget',
        'table.applications': 'Applicants',
        'table.client': 'Client',
        'table.missions': 'Missions',
        'table.ltv': 'LTV',
        'table.lastMission': 'Last mission',
        'table.liner': 'Liner',
        'table.provider': 'Provider',
        'table.owner': 'User',
        'table.updated': 'Updated',
        'table.rating': 'Rating',
        'table.kyc': 'KYC',
        'table.earnings': 'Earnings',
        'table.payout': 'Payout',
        'table.payoutReady': 'Ready',
        'table.payoutMissing': 'Setup required',
        'table.empty.missions': 'No missions found.',
        'table.empty.clients': 'No clients found.',
        'table.empty.liners': 'No liners found.',
        'text.unknownClient': 'Unknown client',
        'support.empty': 'No alerts at the moment.',
        'support.viewDrawer': 'Open center',
        'providers.enabled': 'Enabled',
        'providers.disabled': 'Disabled',
        'providers.lastWebhook': 'Last webhook',
        'providers.lastFailure': 'Last error',
        'providers.save': 'Save',
        'providers.saving': 'Saving…',
        'providers.status.healthy': 'Healthy',
        'providers.status.stale': 'Quiet',
        'providers.status.failing': 'Failing',
        'providers.status.unknown': 'Unknown',
        'providers.awaitingAdmin': 'Coming soon (admin validation required).',
        'providers.readyForOps': 'Admin validated · Ops can enable.',
        'providers.live': 'Live for clients and liners.',
        'payouts.title': 'Payout accounts',
        'payouts.subtitle': 'Stripe/PayPal readiness per liner',
        'payouts.empty': 'No payout account has been registered yet.',
        'payouts.search': 'Search payout accounts',
        'toast.overviewError': 'Unable to load KPIs.',
        'toast.providersError': 'Unable to load providers.',
        'toast.payoutsError': 'Unable to load payout accounts.',
        'toast.notificationsError': 'Unable to load notifications.',
        'toast.missionsError': 'Unable to load missions.',
        'toast.clientsError': 'Unable to load clients.',
        'toast.linersError': 'Unable to load liners.',
        'toast.createMissionSuccess': 'Test mission created.',
        'toast.createMissionError': 'Unable to create the test mission.',
        'toast.broadcastSuccess': 'Broadcast sent.',
        'toast.broadcastError': 'Unable to send the broadcast.',
        'toast.providerSaveSuccess': 'Configuration saved.',
        'toast.providerSaveError': 'Unable to save this provider.',
        'toast.notificationReadError': 'Mark as read failed.',
        'toast.notificationReadAllError': 'Bulk action failed.',
        'prompt.broadcastTitle': 'Broadcast title:',
        'prompt.broadcastMessage': 'Broadcast message:',
    },
};

function formatTemplate(template, params = {}) {
    if (typeof template !== 'string') {
        return template ?? '';
    }

    return Object.entries(params).reduce((text, [key, value]) => {
        return text.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }, template);
}

const missionStatusOptions = [
    { value: 'published', labelKey: 'status.open' },
    { value: 'accepted', labelKey: 'status.assigned' },
    { value: 'in_progress', labelKey: 'status.inProgress' },
    { value: 'completed', labelKey: 'status.done' },
];
const ALL_MISSION_STATUSES = missionStatusOptions.map(option => option.value);

const DEFAULT_META = {
    currentPage: 1,
    perPage: 10,
    total: 0,
    hasMore: false,
};

function getCurrentUser() {
    const payload = window.__PAYLOAD__ || {};
    return payload.user ?? { role: 'guest', name: 'Ops user' };
}

function useDebouncedValue(value, delay = 350) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);

    return debounced;
}

function normalizeMeta(meta) {
    if (!meta) return { ...DEFAULT_META };
    return {
        currentPage: meta.currentPage ?? meta.current_page ?? DEFAULT_META.currentPage,
        perPage: meta.perPage ?? meta.per_page ?? DEFAULT_META.perPage,
        total: meta.total ?? DEFAULT_META.total,
        hasMore: meta.hasMore ?? meta.has_more ?? DEFAULT_META.hasMore,
        filters: meta.filters ?? {},
    };
}

function euros(cents, locale = 'fr-FR') {
    if (typeof cents !== 'number') return '—';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
}

function formatDate(value, locale = 'fr-FR', options = {}) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString(locale, {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            ...options,
        });
    } catch (error) {
        return value;
    }
}

function OpsShell() {
    const user = useMemo(() => getCurrentUser(), []);

    const [locale, setLocale] = useState('fr');
    const t = useCallback(
        (key, fallback) => translations[locale]?.[key] ?? translations.fr[key] ?? fallback ?? key,
        [locale],
    );
    const navItems = useMemo(
        () =>
            NAV_CONFIG.map(item => ({
                ...item,
                label: t(`nav.${item.key}`),
            })),
        [t],
    );
    const statusFilters = useMemo(
        () =>
            missionStatusOptions.map(option => ({
                ...option,
                label: t(option.labelKey),
            })),
        [t],
    );
    const statusLabels = useMemo(
        () => ({
            published: t('status.open'),
            accepted: t('status.assigned'),
            in_progress: t('status.inProgress'),
            completed: t('status.done'),
            active: t('status.active'),
            idle: t('status.idle'),
            vip: t('status.vip'),
            pending: t('status.pending'),
            verified: t('status.verified'),
            rejected: t('status.rejected'),
        }),
        [t],
    );
    const formatStatusLabel = useCallback(
        value => {
            if (!value) return '—';
            return statusLabels[value] ?? value;
        },
        [statusLabels],
    );
    const intlLocale = locale === 'fr' ? 'fr-FR' : 'en-US';

    const [providers, setProviders] = useState([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [savingProvider, setSavingProvider] = useState(null);
    const [payoutAccounts, setPayoutAccounts] = useState([]);
    const [loadingPayouts, setLoadingPayouts] = useState(true);
    const [payoutSearch, setPayoutSearch] = useState('');

    const [overview, setOverview] = useState(null);
    const [loadingOverview, setLoadingOverview] = useState(true);

    const [notifications, setNotifications] = useState([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(true);

    const [theme, setTheme] = useState('dark');
    const [toast, setToast] = useState(null);

    // Missions table state
    const [missionStatus, setMissionStatus] = useState(['published', 'accepted']);
    const [missionSearch, setMissionSearch] = useState('');
    const debouncedMissionSearch = useDebouncedValue(missionSearch);
    const [missionPage, setMissionPage] = useState(1);
    const [missionRows, setMissionRows] = useState([]);
    const [missionMeta, setMissionMeta] = useState({ ...DEFAULT_META });
    const [loadingMissions, setLoadingMissions] = useState(true);

    // Clients table state
    const [clientStatus, setClientStatus] = useState('active');
    const [clientSearch, setClientSearch] = useState('');
    const debouncedClientSearch = useDebouncedValue(clientSearch);
    const [clientPage, setClientPage] = useState(1);
    const [clientRows, setClientRows] = useState([]);
    const [clientMeta, setClientMeta] = useState({ ...DEFAULT_META });
    const [loadingClients, setLoadingClients] = useState(true);

    // Liners table state
    const [linerStatus, setLinerStatus] = useState('pending');
    const [linerRatingMin, setLinerRatingMin] = useState('');
    const [linerRatingMax, setLinerRatingMax] = useState('');
    const [linerPage, setLinerPage] = useState(1);
    const [linerRows, setLinerRows] = useState([]);
    const [linerMeta, setLinerMeta] = useState({ ...DEFAULT_META });
    const [loadingLiners, setLoadingLiners] = useState(true);

    useEffect(() => {
        axios.get('/sanctum/csrf-cookie');
    }, []);

    useEffect(() => {
        document.body.classList.toggle('ops-light', theme === 'light');
    }, [theme]);

    const location = useLocation();

    useEffect(() => {
        const match =
            [...NAV_CONFIG]
                .sort((a, b) => b.path.length - a.path.length)
                .find(item =>
                    item.path === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(item.path),
                ) ?? NAV_CONFIG[0];
        document.title = `${t(`nav.${match.key}`)} • LineUp Ops`;
    }, [location.pathname, t]);

    const showToast = useCallback((text, isError = false) => {
        setToast({ text, isError });
        setTimeout(() => setToast(null), 3500);
    }, []);

    const fetchOverview = useCallback(async (withLoader = true) => {
        if (withLoader) setLoadingOverview(true);
        try {
            const { data } = await axios.get(`${API_BASE}/overview`);
            setOverview(data.data ?? null);
        } catch (error) {
            showToast(t('toast.overviewError'), true);
        } finally {
            if (withLoader) setLoadingOverview(false);
        }
    }, [showToast, t]);

    const fetchProviders = useCallback(async () => {
        setLoadingProviders(true);
        try {
            const { data } = await axios.get(`${API_BASE}/payment-providers`);
            setProviders(data.data ?? []);
        } catch (error) {
            showToast(t('toast.providersError'), true);
        } finally {
            setLoadingProviders(false);
        }
    }, [showToast, t]);

    const fetchPayoutAccounts = useCallback(async () => {
        setLoadingPayouts(true);
        try {
            const { data } = await axios.get(`${API_BASE}/payout-accounts`);
            setPayoutAccounts(data.data ?? []);
        } catch (error) {
            showToast(t('toast.payoutsError'), true);
        } finally {
            setLoadingPayouts(false);
        }
    }, [showToast, t]);

    const fetchNotifications = useCallback(async (withLoader = true) => {
        if (withLoader) setLoadingNotifications(true);
        try {
            const { data } = await axios.get(`${API_BASE}/notifications`);
            setNotifications(normalizeNotifications(data.data ?? []));
        } catch (error) {
            showToast(t('toast.notificationsError'), true);
        } finally {
            if (withLoader) setLoadingNotifications(false);
        }
    }, [showToast, t]);

    const fetchMissions = useCallback(
        async (withLoader = true) => {
            if (withLoader) setLoadingMissions(true);
            try {
                const params = {
                    page: missionPage,
                    perPage: 8,
                    search: debouncedMissionSearch || undefined,
                    status: missionStatus.length ? missionStatus.join(',') : undefined,
                };
                const { data } = await axios.get(`${API_BASE}/missions`, { params });
                setMissionRows(data.data ?? []);
                setMissionMeta(normalizeMeta(data.meta));
            } catch (error) {
                showToast(t('toast.missionsError'), true);
            } finally {
                if (withLoader) setLoadingMissions(false);
            }
        },
        [debouncedMissionSearch, missionPage, missionStatus, showToast, t],
    );

    const fetchClients = useCallback(
        async (withLoader = true) => {
            if (withLoader) setLoadingClients(true);
            try {
                const params = {
                    page: clientPage,
                    perPage: 6,
                    status: clientStatus !== 'all' ? clientStatus : undefined,
                    search: debouncedClientSearch || undefined,
                };
                const { data } = await axios.get(`${API_BASE}/clients`, { params });
                setClientRows(data.data ?? []);
                setClientMeta(normalizeMeta(data.meta));
            } catch (error) {
                showToast(t('toast.clientsError'), true);
            } finally {
                if (withLoader) setLoadingClients(false);
            }
        },
        [clientPage, clientStatus, debouncedClientSearch, showToast, t],
    );

    const fetchLiners = useCallback(
        async (withLoader = true) => {
            if (withLoader) setLoadingLiners(true);
            try {
                const params = {
                    page: linerPage,
                    perPage: 6,
                    status: linerStatus !== 'all' ? linerStatus : undefined,
                    ratingMin: linerRatingMin ? Number(linerRatingMin) : undefined,
                    ratingMax: linerRatingMax ? Number(linerRatingMax) : undefined,
                };
                const { data } = await axios.get(`${API_BASE}/liners`, { params });
                setLinerRows(data.data ?? []);
                setLinerMeta(normalizeMeta(data.meta));
            } catch (error) {
                showToast(t('toast.linersError'), true);
            } finally {
                if (withLoader) setLoadingLiners(false);
            }
        },
        [linerPage, linerStatus, linerRatingMin, linerRatingMax, showToast, t],
    );

    useEffect(() => {
        fetchOverview();
        fetchProviders();
        fetchPayoutAccounts();
        fetchNotifications();
        fetchMissions();
        fetchClients();
        fetchLiners();
    }, [
        fetchClients,
        fetchLiners,
        fetchMissions,
        fetchNotifications,
        fetchOverview,
        fetchPayoutAccounts,
        fetchProviders,
    ]);

    useEffect(() => {
        const id = setInterval(() => {
            fetchOverview(false);
            fetchNotifications(false);
            fetchMissions(false);
            fetchClients(false);
            fetchLiners(false);
            fetchPayoutAccounts();
        }, 60_000);
        return () => clearInterval(id);
    }, [fetchClients, fetchLiners, fetchMissions, fetchNotifications, fetchOverview, fetchPayoutAccounts]);

    useEffect(() => {
        const supportsStreams = typeof window !== 'undefined' && 'ReadableStream' in window && typeof window.fetch === 'function';
        if (!supportsStreams) return undefined;

        let aborted = false;
        let abortController = null;
        let retryTimeout = null;

        const connect = async () => {
            if (abortController) {
                abortController.abort();
            }
            abortController = new AbortController();
            try {
                const response = await fetch('/ops/api/notifications/stream', {
                    method: 'GET',
                    headers: {
                        Accept: 'text/event-stream',
                    },
                    credentials: 'same-origin',
                    signal: abortController.signal,
                });
                if (!response.ok || !response.body) {
                    throw new Error('stream_failed');
                }
                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let buffer = '';
                while (!aborted) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    buffer = consumeSseBuffer(buffer, payload => {
                        if (payload.type === 'notifications' && Array.isArray(payload.items)) {
                            setNotifications(current => mergeNotificationLists(current, payload.items));
                            setLoadingNotifications(false);
                        }
                    });
                }
            } catch (error) {
                if (!aborted) {
                    retryTimeout = setTimeout(connect, 4000);
                }
            }
        };

        connect();

        return () => {
            aborted = true;
            if (abortController) {
                abortController.abort();
            }
            if (retryTimeout) {
                clearTimeout(retryTimeout);
            }
        };
    }, []);

    function handleMissionStatusToggle(value) {
        setMissionStatus(current => {
            const exists = current.includes(value);
            if (exists) {
                const next = current.filter(item => item !== value);
                setMissionPage(1);
                return next;
            }
            setMissionPage(1);
            return [...current, value];
        });
    }

    const handleMissionFiltersReset = useCallback(() => {
        setMissionStatus(ALL_MISSION_STATUSES);
        setMissionPage(1);
    }, []);

    function handleClientsStatusChange(value) {
        setClientStatus(value);
        setClientPage(1);
    }

    function handleLinerStatusChange(value) {
        setLinerStatus(value);
        setLinerPage(1);
    }

    const handleCreateMission = useCallback(async () => {
        try {
            await axios.post(`${API_BASE}/quick-actions/test-mission`);
            showToast(t('toast.createMissionSuccess'));
            fetchMissions(false);
            fetchOverview(false);
        } catch (error) {
            showToast(t('toast.createMissionError'), true);
        }
    }, [fetchMissions, fetchOverview, showToast, t]);

    const handleBroadcast = useCallback(async () => {
        const title = window.prompt(t('prompt.broadcastTitle'));
        if (!title) return;
        const message = window.prompt(t('prompt.broadcastMessage'));
        if (!message) return;
        try {
            await axios.post(`${API_BASE}/quick-actions/broadcast`, { title, message });
            showToast(t('toast.broadcastSuccess'));
            fetchNotifications(false);
        } catch (error) {
            showToast(t('toast.broadcastError'), true);
        }
    }, [fetchNotifications, showToast, t]);

    const handleRefreshTables = useCallback(() => {
        fetchMissions();
        fetchClients();
        fetchLiners();
    }, [fetchClients, fetchLiners, fetchMissions]);

    const handleSaveProvider = useCallback(
        async (provider, payload) => {
            setSavingProvider(provider);
            try {
                const { data } = await axios.put(`${API_BASE}/payment-providers/${provider}`, payload);
                setProviders(prev => prev.map(item => (item.provider === provider ? data.data : item)));
                showToast(t('toast.providerSaveSuccess'));
            } catch (error) {
                showToast(t('toast.providerSaveError'), true);
            } finally {
                setSavingProvider(null);
            }
        },
        [showToast, t],
    );

    const handleLogout = useCallback(async () => {
        try {
            await axios.post('/admin/logout');
        } finally {
            window.location.href = '/admin/login';
        }
    }, []);

    const handleNotificationRead = useCallback(
        async notificationId => {
            try {
                await axios.post(`${API_BASE}/notifications/${notificationId}/read`);
                setNotifications(prev =>
                    prev.map(item =>
                        item.id === notificationId
                            ? { ...item, readAt: new Date().toISOString() }
                            : item,
                    ),
                );
            } catch (error) {
                showToast(t('toast.notificationReadError'), true);
            }
        },
        [showToast, t],
    );

    const handleNotificationReadAll = useCallback(async () => {
        try {
            await axios.post(`${API_BASE}/notifications/read-all`);
            setNotifications(prev => prev.map(item => ({ ...item, readAt: new Date().toISOString() })));
        } catch (error) {
            showToast(t('toast.notificationReadAllError'), true);
        }
    }, [showToast, t]);

    const quickActions = [
        {
            label: t('actions.createTest'),
            icon: 'ri-rocket-2-line',
            onClick: handleCreateMission,
        },
        {
            label: t('actions.broadcast'),
            icon: 'ri-broadcast-line',
            onClick: handleBroadcast,
        },
        {
            label: t('actions.refreshTables'),
            icon: 'ri-loop-right-line',
            onClick: handleRefreshTables,
        },
    ];

    return (
        <div className={`ops-shell ${theme === 'light' ? 'ops-shell--light' : ''}`}>
            <aside className="ops-sidebar">
                <div className="ops-brand">
                    <img src="/assets/images/IMG_0065.PNG" alt="LineUp" className="ops-brand__logo" />
                    <div>
                        <p className="ops-brand__title">LineUp Ops</p>
                        <p className="ops-brand__subtitle">
                            {user.role === 'admin' ? t('brand.subtitle.admin') : t('brand.subtitle.guest')}
                        </p>
                    </div>
                </div>
                <nav className="ops-nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.key}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) =>
                                `ops-nav__item ${isActive ? 'ops-nav__item--active' : ''}`
                            }
                        >
                            <i className={item.icon} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="ops-footer">
                    <img src="/assets/images/IMG_0571.PNG" alt="LineUp" className="ops-footer__logo" />
                    <p>© {new Date().getFullYear()} LineUp France</p>
                </div>
            </aside>
            <main className="ops-main">
                <header className="ops-topbar">
                    <div>
                        <p className="ops-greeting">
                            {formatTemplate(t('topbar.greeting'), { name: user.name.split(' ')[0] })}
                        </p>
                        <p className="ops-greeting__subtitle">{t('topbar.subtitle')}</p>
                    </div>
                    <div className="ops-topbar__actions">
                        <InstallAppBanner badge={t('install.badge')} cta={t('install.cta')} />
                        <div className="ops-topbar__actions-group">
                            <button
                                type="button"
                                className="ops-icon-button"
                                onClick={() => setLocale(current => (current === 'fr' ? 'en' : 'fr'))}
                                aria-label="Toggle language"
                            >
                                {t('language.toggle')}
                            </button>
                            <button
                                type="button"
                                className="ops-icon-button"
                                onClick={() => setTheme(current => (current === 'dark' ? 'light' : 'dark'))}
                                aria-label="Toggle theme"
                            >
                                <i className={theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'} />
                            </button>
                            <button
                                type="button"
                                className="ops-icon-button"
                                onClick={() => setNotificationsOpen(current => !current)}
                                aria-label="Toggle notifications"
                            >
                                <i className="ri-notification-3-line" />
                                {notifications.some(item => !item.readAt) && <span className="ops-dot" />}
                            </button>
                            <div className="ops-avatar" title={user.name}>
                                <span>{user.name.slice(0, 2).toUpperCase()}</span>
                            </div>
                            <button type="button" className="ops-icon-button" onClick={handleLogout} aria-label="Logout">
                                <i className="ri-logout-box-r-line" />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="ops-page">
                    <Routes>
                        <Route
                            path="/"
                            element={<DashboardPage overview={overview} loadingOverview={loadingOverview} t={t} />}
                        />
                        <Route
                            path="/missions"
                            element={
                                <MissionsPage
                                    t={t}
                                    locale={locale}
                                    intlLocale={intlLocale}
                                    statusFilters={statusFilters}
                                    missionStatus={missionStatus}
                                    missionSearch={missionSearch}
                                    setMissionSearch={setMissionSearch}
                                    loadingMissions={loadingMissions}
                                    missionRows={missionRows}
                                    missionMeta={missionMeta}
                                    setMissionPage={setMissionPage}
                                    fetchMissions={fetchMissions}
                                    handleMissionStatusToggle={handleMissionStatusToggle}
                                    resetMissionFilters={handleMissionFiltersReset}
                                    formatStatusLabel={formatStatusLabel}
                                />
                            }
                        />
                        <Route
                            path="/clients"
                            element={
                                <ClientsPage
                                    t={t}
                                    locale={locale}
                                    intlLocale={intlLocale}
                                    clientStatus={clientStatus}
                                    handleClientsStatusChange={handleClientsStatusChange}
                                    clientSearch={clientSearch}
                                    setClientSearch={setClientSearch}
                                    clientRows={clientRows}
                                    loadingClients={loadingClients}
                                    clientMeta={clientMeta}
                                    setClientPage={setClientPage}
                                    fetchClients={fetchClients}
                                    formatStatusLabel={formatStatusLabel}
                                />
                            }
                        />
                        <Route
                            path="/liners"
                            element={
                                <LinersPage
                                    t={t}
                                    locale={locale}
                                    intlLocale={intlLocale}
                                    linerStatus={linerStatus}
                                    handleLinerStatusChange={handleLinerStatusChange}
                                    linerRatingMin={linerRatingMin}
                                    linerRatingMax={linerRatingMax}
                                    setLinerRatingMin={setLinerRatingMin}
                                    setLinerRatingMax={setLinerRatingMax}
                                    linerRows={linerRows}
                                    loadingLiners={loadingLiners}
                                    linerMeta={linerMeta}
                                    setLinerPage={setLinerPage}
                                    fetchLiners={fetchLiners}
                                    formatStatusLabel={formatStatusLabel}
                                />
                            }
                        />
                        <Route
                            path="/payments"
                            element={
                                <PaymentsPage
                                    t={t}
                                    intlLocale={intlLocale}
                                    providers={providers}
                                    loadingProviders={loadingProviders}
                                    savingProvider={savingProvider}
                                    fetchProviders={fetchProviders}
                                    handleSaveProvider={handleSaveProvider}
                                    payoutAccounts={payoutAccounts}
                                    loadingPayouts={loadingPayouts}
                                    fetchPayoutAccounts={fetchPayoutAccounts}
                                    formatStatusLabel={formatStatusLabel}
                                    payoutSearch={payoutSearch}
                                    setPayoutSearch={setPayoutSearch}
                                />
                            }
                        />
                        <Route
                            path="/support"
                            element={
                                <SupportPage
                                    t={t}
                                    intlLocale={intlLocale}
                                    notifications={notifications}
                                    loadingNotifications={loadingNotifications}
                                    fetchNotifications={fetchNotifications}
                                    onOpenDrawer={() => setNotificationsOpen(true)}
                                />
                            }
                        />
                        <Route path="/actions" element={<QuickActionsPage quickActions={quickActions} />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>

            </main>

            <NotificationDrawer
                open={notificationsOpen}
                notifications={notifications}
                loading={loadingNotifications}
                onClose={() => setNotificationsOpen(false)}
                onRefresh={() => fetchNotifications()}
                onMarkRead={handleNotificationRead}
                onMarkAll={handleNotificationReadAll}
                locale={intlLocale}
                t={t}
            />

            {toast && (
                <div className={`ops-toast ${toast.isError ? 'ops-toast--error' : ''}`}>{toast.text}</div>
            )}
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter basename="/ops">
            <OpsShell />
        </BrowserRouter>
    );
}

function DashboardPage({ overview, loadingOverview, t }) {
    return (
        <section className="ops-grid ops-grid--page">
            {statCards(overview, t).map(card => (
                <article key={card.label} className="ops-stat-card" style={{ borderColor: card.color }}>
                    <p className="ops-stat-card__label">{card.label}</p>
                    <p className="ops-stat-card__value">{loadingOverview ? '…' : card.value}</p>
                    <p className="ops-stat-card__trend">{card.trend}</p>
                </article>
            ))}
        </section>
    );
}

function QuickActionsPage({ quickActions }) {
    return (
        <section className="ops-actions ops-actions--page">
            {quickActions.map(action => (
                <button key={action.label} type="button" className="ops-action" onClick={action.onClick}>
                    <i className={action.icon} />
                    <span>{action.label}</span>
                </button>
            ))}
        </section>
    );
}

function MissionsPage({
    t,
    locale,
    intlLocale,
    statusFilters,
    missionStatus,
    missionSearch,
    setMissionSearch,
    loadingMissions,
    missionRows,
    missionMeta,
    setMissionPage,
    fetchMissions,
    handleMissionStatusToggle,
    resetMissionFilters,
    formatStatusLabel,
}) {
    return (
        <section className="ops-content-grid">
            <article className="ops-panel ops-panel--wide">
                <header className="ops-panel__header">
                    <div>
                        <p className="ops-panel__title">{t('panels.missions.title')}</p>
                        <p className="ops-panel__subtitle">{t('panels.missions.subtitle')}</p>
                    </div>
                    <div className="ops-panel__actions">
                        <button type="button" className="ops-button ops-button--ghost" onClick={resetMissionFilters}>
                            {t('filters.all')}
                        </button>
                        <button type="button" className="ops-button" onClick={() => fetchMissions()} disabled={loadingMissions}>
                            <i className="ri-refresh-line" />
                            {t('button.refresh')}
                        </button>
                    </div>
                </header>
                <div className="ops-table-toolbar">
                    <div className="ops-filter-group">
                        {statusFilters.map(option => (
                            <button
                                key={option.value}
                                type="button"
                                className={`ops-pill ${missionStatus.includes(option.value) ? 'ops-pill--active' : ''}`}
                                onClick={() => handleMissionStatusToggle(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <input
                        type="search"
                        className="ops-input"
                        placeholder={t('search.missions')}
                        value={missionSearch}
                        onChange={event => {
                            setMissionSearch(event.target.value);
                            setMissionPage(1);
                        }}
                    />
                </div>
                <DataTable
                    loading={loadingMissions}
                    data={missionRows}
                    messages={{ loading: t('loading'), empty: t('table.empty.missions') }}
                    columns={[
                        {
                            label: t('table.mission'),
                            key: 'title',
                            render: (value, row) => (
                                <div className="ops-cell">
                                    <strong>{value}</strong>
                                    <span>
                                        {row.client?.name ?? t('text.unknownClient')} · {formatDate(row.scheduledAt, intlLocale)}
                                    </span>
                                </div>
                            ),
                        },
                        {
                            label: t('table.status'),
                            key: 'status',
                            render: (_, row) => (
                                <div className="ops-chip-stack">
                                    <span className={`chip chip--${row.status}`}>{formatStatusLabel(row.status)}</span>
                                    <span className="chip chip--ghost">{formatStatusLabel(row.progressStatus)}</span>
                                </div>
                            ),
                        },
                        {
                            label: t('table.budget'),
                            key: 'budgetCents',
                            render: value => euros(value, intlLocale),
                        },
                        {
                            label: t('table.applications'),
                            key: 'applicationsCount',
                            render: value => `${value ?? 0}`,
                        },
                    ]}
                />
                <TablePagination meta={missionMeta} loading={loadingMissions} onChange={setMissionPage} locale={locale} t={t} />
            </article>
        </section>
    );
}

function ClientsPage({
    t,
    locale,
    intlLocale,
    clientStatus,
    handleClientsStatusChange,
    clientSearch,
    setClientSearch,
    clientRows,
    loadingClients,
    clientMeta,
    setClientPage,
    fetchClients,
    formatStatusLabel,
}) {
    return (
        <section className="ops-content-grid">
            <article className="ops-panel">
                <header className="ops-panel__header">
                    <div>
                        <p className="ops-panel__title">{t('panels.clients.title')}</p>
                        <p className="ops-panel__subtitle">{t('panels.clients.subtitle')}</p>
                    </div>
                    <div className="ops-panel__actions">
                        <select className="ops-select" value={clientStatus} onChange={event => handleClientsStatusChange(event.target.value)}>
                            <option value="active">{t('clients.filter.active')}</option>
                            <option value="idle">{t('clients.filter.idle')}</option>
                            <option value="vip">{t('clients.filter.vip')}</option>
                            <option value="all">{t('clients.filter.all')}</option>
                        </select>
                        <input
                            type="search"
                            className="ops-input ops-input--small"
                            placeholder={t('search.generic')}
                            value={clientSearch}
                            onChange={event => {
                                setClientSearch(event.target.value);
                                setClientPage(1);
                            }}
                        />
                    </div>
                </header>
                <DataTable
                    loading={loadingClients}
                    data={clientRows}
                    messages={{ loading: t('loading'), empty: t('table.empty.clients') }}
                    columns={[
                        {
                            label: t('table.client'),
                            key: 'name',
                            render: (value, row) => (
                                <div className="ops-cell">
                                    <strong>{value}</strong>
                                    <span>{row.email}</span>
                                </div>
                            ),
                        },
                        {
                            label: t('table.missions'),
                            key: 'missionsTotal',
                            render: (_, row) => `${row.missionsActive ?? 0}/${row.missionsTotal ?? 0}`,
                        },
                        {
                            label: t('table.ltv'),
                            key: 'lifetimeValueEuros',
                            render: value => euros(value, intlLocale),
                        },
                        {
                            label: t('table.lastMission'),
                            key: 'lastMissionAt',
                            render: value => formatDate(value, intlLocale, { day: '2-digit', month: '2-digit' }),
                        },
                        {
                            label: t('table.status'),
                            key: 'status',
                            render: value => <span className={`chip chip--${value}`}>{formatStatusLabel(value)}</span>,
                        },
                    ]}
                />
                <TablePagination meta={clientMeta} loading={loadingClients} onChange={setClientPage} locale={locale} t={t} />
                <div className="ops-panel__actions ops-panel__actions--footer">
                    <button type="button" className="ops-button ops-button--ghost" onClick={() => fetchClients()} disabled={loadingClients}>
                        <i className="ri-refresh-line" />
                        {t('button.refresh')}
                    </button>
                </div>
            </article>
        </section>
    );
}

function LinersPage({
    t,
    locale,
    intlLocale,
    linerStatus,
    handleLinerStatusChange,
    linerRatingMin,
    linerRatingMax,
    setLinerRatingMin,
    setLinerRatingMax,
    linerRows,
    loadingLiners,
    linerMeta,
    setLinerPage,
    fetchLiners,
    formatStatusLabel,
}) {
    return (
        <section className="ops-content-grid">
            <article className="ops-panel">
                <header className="ops-panel__header">
                    <div>
                        <p className="ops-panel__title">{t('panels.liners.title')}</p>
                        <p className="ops-panel__subtitle">{t('panels.liners.subtitle')}</p>
                    </div>
                    <div className="ops-panel__actions ops-panel__actions--wrap">
                        <select className="ops-select" value={linerStatus} onChange={event => handleLinerStatusChange(event.target.value)}>
                            <option value="pending">{t('liners.filter.pending')}</option>
                            <option value="verified">{t('liners.filter.verified')}</option>
                            <option value="rejected">{t('liners.filter.rejected')}</option>
                            <option value="all">{t('liners.filter.all')}</option>
                        </select>
                        <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            className="ops-input ops-input--xs"
                            placeholder={t('liners.minRating')}
                            value={linerRatingMin}
                            onChange={event => {
                                setLinerRatingMin(event.target.value);
                                setLinerPage(1);
                            }}
                        />
                        <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            className="ops-input ops-input--xs"
                            placeholder={t('liners.maxRating')}
                            value={linerRatingMax}
                            onChange={event => {
                                setLinerRatingMax(event.target.value);
                                setLinerPage(1);
                            }}
                        />
                        <button type="button" className="ops-button ops-button--ghost" onClick={() => fetchLiners()} disabled={loadingLiners}>
                            <i className="ri-refresh-line" />
                        </button>
                    </div>
                </header>
                <DataTable
                    loading={loadingLiners}
                    data={linerRows}
                    messages={{ loading: t('loading'), empty: t('table.empty.liners') }}
                    columns={[
                        {
                            label: t('table.liner'),
                            key: 'name',
                            render: (value, row) => (
                                <div className="ops-cell">
                                    <strong>{value}</strong>
                                    <span>{row.email}</span>
                                </div>
                            ),
                        },
                        {
                            label: t('table.missions'),
                            key: 'missionsTotal',
                            render: (_, row) => `${row.missionsCompleted ?? 0}`,
                        },
                        {
                            label: t('table.rating'),
                            key: 'rating',
                            render: value => (value ? `${value.toFixed(1)}★` : '—'),
                        },
                        {
                            label: t('table.kyc'),
                            key: 'kycStatus',
                            render: value => <span className={`chip chip--${value}`}>{formatStatusLabel(value)}</span>,
                        },
                        {
                            label: t('table.earnings'),
                            key: 'earningsEuros',
                            render: value => euros(value, intlLocale),
                        },
                        {
                            label: t('table.payout'),
                            key: 'payoutReady',
                            render: value => (value ? t('table.payoutReady') : t('table.payoutMissing')),
                        },
                    ]}
                />
                <TablePagination meta={linerMeta} loading={loadingLiners} onChange={setLinerPage} locale={locale} t={t} />
            </article>
        </section>
    );
}

function PaymentsPage({
    t,
    intlLocale,
    providers,
    loadingProviders,
    savingProvider,
    fetchProviders,
    handleSaveProvider,
    payoutAccounts,
    loadingPayouts,
    fetchPayoutAccounts,
    formatStatusLabel,
    payoutSearch,
    setPayoutSearch,
}) {
    const filteredAccounts = useMemo(() => {
        if (!payoutSearch.trim()) return payoutAccounts;
        const term = payoutSearch.trim().toLowerCase();
        return payoutAccounts.filter(account => {
            return (
                (account.label ?? '').toLowerCase().includes(term) ||
                (account.provider ?? '').toLowerCase().includes(term) ||
                (account.user?.name ?? '').toLowerCase().includes(term) ||
                (account.user?.email ?? '').toLowerCase().includes(term)
            );
        });
    }, [payoutAccounts, payoutSearch]);
    return (
        <section className="ops-content-grid">
            <article className="ops-panel">
                <header className="ops-panel__header">
                    <div>
                        <p className="ops-panel__title">{t('panels.providers.title')}</p>
                        <p className="ops-panel__subtitle">{t('panels.providers.subtitle')}</p>
                    </div>
                    <button type="button" className="ops-button ops-button--ghost" onClick={fetchProviders} disabled={loadingProviders}>
                        <i className="ri-refresh-line" /> {t('button.refresh')}
                    </button>
                </header>
                {loadingProviders ? (
                    <p className="ops-loading">{t('loading')}</p>
                ) : (
                    <div className="ops-provider-grid">
                        {providers.map(provider => (
                            <ProviderCard
                                key={provider.provider}
                                config={provider}
                                saving={savingProvider === provider.provider}
                                onSave={payload => handleSaveProvider(provider.provider, payload)}
                                locale={intlLocale}
                                t={t}
                            />
                        ))}
                    </div>
                )}
            </article>
            <article className="ops-panel ops-panel--wide">
                <header className="ops-panel__header">
                    <div>
                        <p className="ops-panel__title">{t('payouts.title')}</p>
                        <p className="ops-panel__subtitle">{t('payouts.subtitle')}</p>
                    </div>
                    <div className="ops-panel__actions">
                        <input
                            type="search"
                            value={payoutSearch}
                            onChange={event => setPayoutSearch(event.target.value)}
                            placeholder={t('payouts.search')}
                            className="ops-input"
                        />
                        <button
                            type="button"
                            className="ops-button ops-button--ghost"
                            onClick={fetchPayoutAccounts}
                            disabled={loadingPayouts}
                        >
                            <i className="ri-refresh-line" /> {t('button.refresh')}
                        </button>
                    </div>
                </header>
                {loadingPayouts ? (
                    <p className="ops-loading">{t('loading')}</p>
                ) : filteredAccounts.length === 0 ? (
                    <p className="ops-empty">{t('payouts.empty')}</p>
                ) : (
                    <table className="ops-table">
                        <thead>
                            <tr>
                                <th>{t('table.provider')}</th>
                                <th>{t('table.owner')}</th>
                                <th>{t('table.status')}</th>
                                <th>{t('table.updated')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAccounts.map(account => (
                                <tr key={account.id}>
                                    <td>
                                        <div className="ops-cell">
                                            <strong>{account.label ?? account.provider}</strong>
                                            <span>{account.provider}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="ops-cell">
                                            <strong>{account.user?.name ?? '—'}</strong>
                                            <span>{account.user?.email ?? ''}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`chip chip--${account.status}`}>
                                            {formatStatusLabel(account.status)}
                                        </span>
                                        {account.isDefault && <small>{t('table.payoutReady')}</small>}
                                    </td>
                                    <td>{account.updatedAt ? formatDate(account.updatedAt, intlLocale, { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </article>
        </section>
    );
}

function SupportPage({ t, intlLocale, notifications, loadingNotifications, fetchNotifications, onOpenDrawer }) {
    return (
        <section className="ops-content-grid">
            <article className="ops-panel ops-panel--wide">
                <header className="ops-panel__header">
                    <div>
                        <p className="ops-panel__title">{t('panels.alerts.title')}</p>
                        <p className="ops-panel__subtitle">{t('panels.alerts.subtitle')}</p>
                    </div>
                    <div className="ops-panel__actions">
                        <button type="button" className="ops-button ops-button--ghost" onClick={() => fetchNotifications()} disabled={loadingNotifications}>
                            <i className="ri-refresh-line" /> {t('button.refresh')}
                        </button>
                        <button type="button" className="ops-button" onClick={onOpenDrawer}>
                            <i className="ri-notification-3-line" /> {t('support.viewDrawer')}
                        </button>
                    </div>
                </header>
                {loadingNotifications ? (
                    <p className="ops-loading">{t('loading')}</p>
                ) : notifications.length === 0 ? (
                    <p className="ops-empty">{t('support.empty')}</p>
                ) : (
                    <div className="ops-alert-feed">
                        {notifications.slice(0, 6).map(item => (
                            <div key={item.id} className={`ops-alert ${item.readAt ? '' : 'ops-alert--unread'}`}>
                                <div>
                                    <p className="ops-alert__title">{item.title}</p>
                                    <p className="ops-alert__message">{item.message}</p>
                                </div>
                                <div className="ops-alert__meta">
                                    <span>{(item.category ?? 'ops').toUpperCase()}</span>
                                    <time>{formatDate(item.createdAt, intlLocale, { hour: '2-digit', minute: '2-digit' })}</time>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </article>
        </section>
    );
}

function normalizeNotifications(list = []) {
    return [...list].sort((a, b) => {
        const dateA = new Date(a.createdAt ?? a.created_at ?? 0).getTime();
        const dateB = new Date(b.createdAt ?? b.created_at ?? 0).getTime();
        return dateB - dateA;
    });
}

function mergeNotificationLists(current, incoming) {
    const map = new Map();
    current.forEach(item => map.set(item.id, item));
    (incoming ?? []).forEach(item => map.set(item.id, item));
    return normalizeNotifications(Array.from(map.values()));
}

function consumeSseBuffer(buffer, onPayload) {
    let remaining = buffer;
    let boundary;
    while ((boundary = remaining.indexOf('\n\n')) !== -1) {
        const chunk = remaining.slice(0, boundary).trim();
        remaining = remaining.slice(boundary + 2);
        if (chunk.startsWith('data:')) {
            const payload = chunk.slice(5).trim();
            if (!payload) continue;
            try {
                onPayload(JSON.parse(payload));
            } catch (error) {
                // ignore malformed payloads
            }
        }
    }
    return remaining;
}

function statCards(overview, t) {
    if (!overview) return [];
    return [
        {
            label: t('stats.missions'),
            value: overview.stats?.missions_active ?? '--',
            trend: `${overview.stats?.missions_queueing ?? 0} ${t('stats.queueSuffix')}`,
            color: '#7C3AED',
        },
        {
            label: t('stats.payments'),
            value: `€${(overview.payments?.pending_payouts ?? 0).toFixed(1)}k`,
            trend: t('stats.paymentsTrend'),
            color: '#0EA5E9',
        },
        {
            label: t('stats.volume'),
            value: `€${(overview.payments?.volume_week ?? 0).toFixed(1)}k`,
            trend: t('stats.volumeTrend'),
            color: '#EC4899',
        },
    ];
}

function ProviderCard({ config, onSave, saving, locale, t }) {
    const [enabled, setEnabled] = useState(config.enabled);
    const [credentials, setCredentials] = useState(config.credentials ?? {});
    const opsAllowed = config.adminApproved;

    useEffect(() => {
        setEnabled(config.enabled);
        setCredentials(config.credentials ?? {});
    }, [config]);

    function handleChange(field, value) {
        setCredentials(prev => ({ ...prev, [field]: value }));
    }

    function handleSubmit(event) {
        event.preventDefault();
        onSave({ enabled, credentials });
    }

    const health = config.health ?? {};
    const healthStatus = health.status ?? config.healthStatus ?? 'unknown';
    const badgeLabel = t(`providers.status.${healthStatus}`, healthStatus);
    const opsStatusLabel = !config.adminApproved
        ? t('providers.awaitingAdmin')
        : config.enabled
            ? t('providers.live')
            : t('providers.readyForOps');

    return (
        <form className="ops-provider-card" onSubmit={handleSubmit}>
            <div className="ops-provider-card__header">
                <div>
                    <p className="ops-provider-card__title">{config.label}</p>
                    <p className="ops-provider-card__subtitle">
                        {enabled ? t('providers.enabled') : t('providers.disabled')}
                    </p>
                    {health.message && <p className="ops-provider-card__meta">{health.message}</p>}
                    {health.lastWebhookAt && (
                        <p className="ops-provider-card__meta">
                            {t('providers.lastWebhook')} · {formatDate(health.lastWebhookAt, locale)}
                        </p>
                    )}
                    {health.lastFailureAt && (
                        <p className="ops-provider-card__meta ops-provider-card__meta--warning">
                            {t('providers.lastFailure')} · {formatDate(health.lastFailureAt, locale)}
                        </p>
                    )}
                </div>
                <div className={`ops-provider-card__badge ops-provider-card__badge--${healthStatus}`}>
                    <span className="ops-dot" />
                    {badgeLabel}
                </div>
                <label className="ops-switch">
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={event => setEnabled(event.target.checked)}
                        disabled={!opsAllowed}
                    />
                    <span />
                </label>
            </div>
            <p className="ops-provider-status">{opsStatusLabel}</p>
            <div className="ops-provider-card__fields">
                {config.fields.map(field => (
                    <label key={field.key}>
                        <span>{field.label}</span>
                        <input
                            type={field.type === 'secret' ? 'password' : 'text'}
                            value={credentials[field.key] ?? ''}
                            onChange={event => handleChange(field.key, event.target.value)}
                            placeholder={field.type === 'secret' ? '••••••••' : field.label}
                            disabled={!opsAllowed}
                        />
                    </label>
                ))}
            </div>
            <button type="submit" disabled={saving || !opsAllowed}>
                {saving ? t('providers.saving') : t('providers.save')}
            </button>
        </form>
    );
}

function InstallAppBanner({ badge, cta }) {
    const [promptEvent, setPromptEvent] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        function handleBeforeInstallPrompt(event) {
            event.preventDefault();
            setPromptEvent(event);
            setReady(true);
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    if (!ready) {
        return (
            <div className="ops-install">
                <i className="ri-apps-line" />
                <span>{badge ?? 'LineUp Console'}</span>
            </div>
        );
    }

    async function install() {
        promptEvent?.prompt();
        await promptEvent?.userChoice;
        setPromptEvent(null);
        setReady(false);
    }

    return (
        <button type="button" className="ops-install ops-install--cta" onClick={install}>
            <i className="ri-download-2-line" />
            <span>{cta ?? "Installer l’app web"}</span>
        </button>
    );
}

function DataTable({ data, columns, loading, messages = {} }) {
    const loadingText = messages.loading ?? 'Chargement…';
    const emptyText = messages.empty ?? 'Aucune donnée disponible.';
    if (loading) {
        return <p className="ops-loading">{loadingText}</p>;
    }
    if (!data.length) {
        return <p className="ops-empty">{emptyText}</p>;
    }
    return (
        <div className="ops-table-wrapper">
            <table className="ops-table">
                <thead>
                    <tr>
                        {columns.map(col => (
                            <th key={col.label}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map(row => (
                        <tr key={row.id ?? row.title}>
                            {columns.map(col => (
                                <td key={col.label}>
                                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function TablePagination({ meta, loading, onChange, locale = 'fr', t }) {
    const canPrev = meta.currentPage > 1;
    const canNext = meta.hasMore;

    if (meta.total <= meta.perPage && !meta.hasMore) {
        return null;
    }

    const prevLabel = t ? t('pager.prev') : locale === 'fr' ? 'Précédent' : 'Previous';
    const nextLabel = t ? t('pager.next') : locale === 'fr' ? 'Suivant' : 'Next';
    const summary = t
        ? formatTemplate(t('pager.summary'), { page: meta.currentPage, total: meta.total })
        : locale === 'fr'
            ? `Page ${meta.currentPage} · ${meta.total} entrées`
            : `Page ${meta.currentPage} · ${meta.total} rows`;

    return (
        <div className="ops-pagination">
            <button type="button" onClick={() => onChange(meta.currentPage - 1)} disabled={!canPrev || loading}>
                {prevLabel}
            </button>
            <p>{summary}</p>
            <button type="button" onClick={() => onChange(meta.currentPage + 1)} disabled={!canNext || loading}>
                {nextLabel}
            </button>
        </div>
    );
}

function NotificationDrawer({
    open,
    notifications,
    loading,
    onClose,
    onRefresh,
    onMarkRead,
    onMarkAll,
    locale = 'fr-FR',
    t = key => key,
}) {
    if (!open) return null;

    const unreadCount = notifications.filter(item => !item.readAt).length;
    const unreadLabel = formatTemplate(t('notifications.unread'), { count: unreadCount });

    return (
        <div className="ops-notifications">
            <div className="ops-notifications__header">
                <div>
                    <p>{t('notifications.title')}</p>
                    <span>{unreadLabel}</span>
                </div>
                <div className="ops-notifications__actions">
                    <button type="button" onClick={onRefresh} title={t('notifications.refresh')}>
                        <i className="ri-refresh-line" />
                    </button>
                    <button type="button" onClick={onMarkAll} title={t('notifications.markAll')}>
                        <i className="ri-check-double-line" />
                    </button>
                    <button type="button" onClick={onClose} title={t('notifications.close')}>
                        <i className="ri-close-line" />
                    </button>
                </div>
            </div>
            <div className="ops-notifications__list">
                {loading ? (
                    <p className="ops-loading">{t('loading')}</p>
                ) : notifications.length === 0 ? (
                    <p className="ops-empty">{t('notifications.empty')}</p>
                ) : (
                    notifications.map(item => (
                        <div
                            key={item.id}
                            className={`ops-notification ${item.readAt ? '' : 'ops-notification--unread'}`}
                        >
                            <div>
                                <p>{item.title}</p>
                                <p>{item.message}</p>
                            </div>
                            <div className="ops-notification__meta">
                                <span>{formatDate(item.createdAt, locale, { hour: '2-digit', minute: '2-digit' })}</span>
                                {!item.readAt && (
                                    <button type="button" onClick={() => onMarkRead(item.id)}>
                                        {t('notifications.markRead')}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
