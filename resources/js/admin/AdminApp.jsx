import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import './styles.css';

axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

const API_BASE = '/api/admin';
const SETTINGS_API = `${API_BASE}/settings`;

const NAV_ITEMS = [
    { path: '/', key: 'dashboard', icon: 'ri-dashboard-2-line' },
    { path: '/missions', key: 'missions', icon: 'ri-flag-2-line' },
    { path: '/clients', key: 'clients', icon: 'ri-user-3-line' },
    { path: '/liners', key: 'liners', icon: 'ri-team-line' },
    { path: '/payments', key: 'payments', icon: 'ri-bank-card-line' },
    { path: '/settings', key: 'settings', icon: 'ri-settings-3-line' },
    { path: '/team', key: 'team', icon: 'ri-shield-user-line' },
    { path: '/roles', key: 'roles', icon: 'ri-key-2-line' },
];

const translations = {
    fr: {
        'brand.subtitle': 'Accès administrateur',
        'topbar.tagline': 'Pilotez missions, liners et paiements en temps réel.',
        'button.logout': 'Déconnexion',
        'button.opsLegacy': 'Console Ops legacy',
        'nav.dashboard': 'Tableau de bord',
        'nav.missions': 'Missions',
        'nav.clients': 'Clients',
        'nav.liners': 'Liners',
        'nav.payments': 'Paiements',
        'nav.settings': 'Paramètres',
        'nav.team': 'Équipe Ops',
        'nav.roles': 'Rôles & Permissions',
        'dashboard.providers.title': 'Prestataires de paiement',
        'dashboard.providers.subtitle': 'Stripe • PayPal • Adyen • Apple Pay • Google Pay',
        'dashboard.notifications.title': 'Notifications Ops',
        'dashboard.notifications.subtitle': 'Événements récents',
        loading: 'Chargement…',
        'notifications.empty': 'Aucune notification.',
        'missions.title': 'Missions',
        'missions.subtitle': 'Flux en temps réel',
        'clients.title': 'Clients',
        'clients.subtitle': 'Activité & LTV',
        'liners.title': 'Liners',
        'liners.subtitle': 'Performance & KYC',
        'payments.title': 'Prestataires',
        'payments.subtitle': 'Validation PSP',
        'payments.helper': 'L’administrateur valide les PSP, puis l’équipe Ops peut les activer.',
        'payments.field.admin': 'Validation admin',
        'payments.field.ops': 'Activation Ops',
        'payments.state.pending': 'Bientôt disponible : en attente de validation admin.',
        'payments.state.ready': 'Validé par l’admin. Ops peut activer depuis la console.',
        'payments.state.active': 'PSP actif : clients et liners peuvent l’utiliser.',
        'payouts.title': 'Comptes de versement',
        'payouts.subtitle': 'Statut Stripe/PayPal des liners',
        'payouts.empty': 'Aucun compte n’a encore été enregistré.',
        'payouts.default': 'Compte principal',
        'payouts.secondary': 'Secondaire',
        'settings.title': 'Contenus',
        'settings.subtitle': 'App Settings',
        'team.title': 'Équipe',
        'team.subtitle': 'Admins & Ops',
        'team.helper': 'Assignez un rôle pour définir les permissions d’accès.',
        'roles.title': 'Permissions',
        'roles.subtitle': 'Rôles et accès',
        'roles.helper': 'Créez des rôles Ops puis assignez-les aux membres de l’équipe.',
        'roles.new': '+ Nouveau rôle',
        'roles.update': 'Mettre à jour',
        'roles.create': 'Créer le rôle',
        'roles.delete': 'Supprimer',
        'roles.perms': '{count} permissions',
        'roles.slug': 'Nom (slug)',
        'roles.label': 'Libellé',
        'roles.description': 'Description',
        'roles.placeholder.slug': 'ops_manager',
        'roles.placeholder.label': 'Ops manager',
        'roles.placeholder.description': 'Décrivez le périmètre de ce rôle',
        'table.mission': 'Mission',
        'table.client': 'Client',
        'table.status': 'Statut',
        'table.budget': 'Budget',
        'table.missions': 'Missions',
        'table.ltv': 'LTV',
        'table.liner': 'Liner',
        'table.rating': 'Note',
        'table.kyc': 'KYC',
        'table.provider': 'Prestataire',
        'table.owner': 'Utilisateur',
        'table.updated': 'Mise à jour',
        'table.name': 'Nom',
        'table.email': 'Email',
        'table.role': 'Rôle',
        'text.refresh': 'Rafraîchir',
        'text.none': 'Aucune donnée.',
        'stat.missions': 'Missions actives',
        'stat.payments': 'Paiements en cours',
        'stat.volume': 'Volume semaine',
        'stat.queue': '{count} en file',
        'stat.paymentsTrend': 'Autorisation en attente',
        'stat.volumeTrend': '+ mission premium',
        'permissions.group.ops': 'Console Ops',
        'permissions.group.missions': 'Missions',
        'permissions.group.clients': 'Clients',
        'permissions.group.liners': 'Liners',
        'permissions.group.payments': 'Paiements',
        'permissions.group.team': 'Équipe',
        'permissions.group.settings': 'Paramètres & Flutter',
        'permissions.ops.access': 'Accès à la console Ops',
        'permissions.missions.view': 'Voir les missions',
        'permissions.missions.manage': 'Créer / modifier / annuler',
        'permissions.clients.view': 'Voir les clients',
        'permissions.clients.manage': 'Gérer les clients',
        'permissions.liners.view': 'Voir les liners',
        'permissions.liners.manage': 'Gérer les liners',
        'permissions.payments.view': 'Consulter',
        'permissions.payments.manage': 'Configurer / capturer',
        'permissions.team.view': 'Voir les membres',
        'permissions.team.manage': 'Assigner les rôles',
        'permissions.settings.view': 'Voir les réglages',
        'permissions.settings.manage': 'Modifier les réglages',
        'permissions.settings.flutter': 'Gérer les settings Flutter',
    },
    en: {
        'brand.subtitle': 'Administrator access',
        'topbar.tagline': 'Monitor missions, liners and payments in real time.',
        'button.logout': 'Logout',
        'button.opsLegacy': 'Legacy Ops console',
        'nav.dashboard': 'Dashboard',
        'nav.missions': 'Missions',
        'nav.clients': 'Clients',
        'nav.liners': 'Liners',
        'nav.payments': 'Payments',
        'nav.settings': 'Settings',
        'nav.team': 'Ops team',
        'nav.roles': 'Roles & Permissions',
        'dashboard.providers.title': 'Payment providers',
        'dashboard.providers.subtitle': 'Stripe • PayPal • Adyen • Apple Pay • Google Pay',
        'dashboard.notifications.title': 'Ops notifications',
        'dashboard.notifications.subtitle': 'Latest events',
        loading: 'Loading…',
        'notifications.empty': 'No notifications yet.',
        'missions.title': 'Missions',
        'missions.subtitle': 'Realtime feed',
        'clients.title': 'Clients',
        'clients.subtitle': 'Activity & LTV',
        'liners.title': 'Liners',
        'liners.subtitle': 'Performance & KYC',
        'payments.title': 'Providers',
        'payments.subtitle': 'PSP validation',
        'payments.helper': 'Admin validates PSPs first, then Ops can enable them.',
        'payments.field.admin': 'Admin approval',
        'payments.field.ops': 'Ops toggle',
        'payments.state.pending': 'Coming soon: pending admin validation.',
        'payments.state.ready': 'Admin approved. Ops can enable from the console.',
        'payments.state.active': 'Live: clients and liners can use it.',
        'payouts.title': 'Payout accounts',
        'payouts.subtitle': 'Stripe/PayPal readiness per liner',
        'payouts.empty': 'No payout account has been registered yet.',
        'payouts.default': 'Primary method',
        'payouts.secondary': 'Secondary',
        'settings.title': 'Content',
        'settings.subtitle': 'App settings',
        'team.title': 'Team',
        'team.subtitle': 'Admins & Ops',
        'team.helper': 'Assign a role to define access rights.',
        'roles.title': 'Permissions',
        'roles.subtitle': 'Roles & access',
        'roles.helper': 'Create Ops roles then assign them to teammates.',
        'roles.new': '+ New role',
        'roles.update': 'Update',
        'roles.create': 'Create role',
        'roles.delete': 'Delete',
        'roles.perms': '{count} permissions',
        'roles.slug': 'Name (slug)',
        'roles.label': 'Label',
        'roles.description': 'Description',
        'roles.placeholder.slug': 'ops_manager',
        'roles.placeholder.label': 'Ops manager',
        'roles.placeholder.description': 'Describe the scope of this role',
        'table.mission': 'Mission',
        'table.client': 'Client',
        'table.status': 'Status',
        'table.budget': 'Budget',
        'table.missions': 'Missions',
        'table.ltv': 'LTV',
        'table.liner': 'Liner',
        'table.rating': 'Rating',
        'table.kyc': 'KYC',
        'table.provider': 'Provider',
        'table.owner': 'User',
        'table.updated': 'Updated',
        'table.name': 'Name',
        'table.email': 'Email',
        'table.role': 'Role',
        'text.refresh': 'Refresh',
        'text.none': 'No data available.',
        'stat.missions': 'Active missions',
        'stat.payments': 'Payments in progress',
        'stat.volume': 'Weekly volume',
        'stat.queue': '{count} waiting',
        'stat.paymentsTrend': 'Authorization pending',
        'stat.volumeTrend': '+ premium mission',
        'permissions.group.ops': 'Ops console',
        'permissions.group.missions': 'Missions',
        'permissions.group.clients': 'Clients',
        'permissions.group.liners': 'Liners',
        'permissions.group.payments': 'Payments',
        'permissions.group.team': 'Team',
        'permissions.group.settings': 'Settings & Flutter',
        'permissions.ops.access': 'Access Ops console',
        'permissions.missions.view': 'View missions',
        'permissions.missions.manage': 'Create / edit / cancel',
        'permissions.clients.view': 'View clients',
        'permissions.clients.manage': 'Manage clients',
        'permissions.liners.view': 'View liners',
        'permissions.liners.manage': 'Manage liners',
        'permissions.payments.view': 'View',
        'permissions.payments.manage': 'Configure / capture',
        'permissions.team.view': 'View members',
        'permissions.team.manage': 'Assign roles',
        'permissions.settings.view': 'View settings',
        'permissions.settings.manage': 'Edit settings',
        'permissions.settings.flutter': 'Manage Flutter settings',
    },
};

const PERMISSION_GROUPS = [
    {
        key: 'ops',
        labelKey: 'permissions.group.ops',
        label: 'Console Ops',
        permissions: [{ code: 'ops.access', labelKey: 'permissions.ops.access', label: 'Accès à la console Ops' }],
    },
    {
        key: 'missions',
        labelKey: 'permissions.group.missions',
        label: 'Missions',
        permissions: [
            { code: 'missions.view', labelKey: 'permissions.missions.view', label: 'Voir les missions' },
            { code: 'missions.manage', labelKey: 'permissions.missions.manage', label: 'Créer / modifier / annuler' },
        ],
    },
    {
        key: 'clients',
        labelKey: 'permissions.group.clients',
        label: 'Clients',
        permissions: [
            { code: 'clients.view', labelKey: 'permissions.clients.view', label: 'Voir les clients' },
            { code: 'clients.manage', labelKey: 'permissions.clients.manage', label: 'Gérer les clients' },
        ],
    },
    {
        key: 'liners',
        labelKey: 'permissions.group.liners',
        label: 'Liners',
        permissions: [
            { code: 'liners.view', labelKey: 'permissions.liners.view', label: 'Voir les liners' },
            { code: 'liners.manage', labelKey: 'permissions.liners.manage', label: 'Gérer les liners' },
        ],
    },
    {
        key: 'payments',
        labelKey: 'permissions.group.payments',
        label: 'Paiements',
        permissions: [
            { code: 'payments.view', labelKey: 'permissions.payments.view', label: 'Consulter' },
            { code: 'payments.manage', labelKey: 'permissions.payments.manage', label: 'Configurer / capturer' },
        ],
    },
    {
        key: 'team',
        labelKey: 'permissions.group.team',
        label: 'Équipe',
        permissions: [
            { code: 'team.view', labelKey: 'permissions.team.view', label: 'Voir les membres' },
            { code: 'team.manage', labelKey: 'permissions.team.manage', label: 'Assigner les rôles' },
        ],
    },
    {
        key: 'settings',
        labelKey: 'permissions.group.settings',
        label: 'Paramètres & Flutter',
        permissions: [
            { code: 'settings.view', labelKey: 'permissions.settings.view', label: 'Voir les réglages' },
            { code: 'settings.manage', labelKey: 'permissions.settings.manage', label: 'Modifier les réglages' },
            { code: 'settings.flutter', labelKey: 'permissions.settings.flutter', label: 'Gérer les settings Flutter' },
        ],
    },
];

export default function AdminApp({ data }) {
    const user = useMemo(
        () => ({
            name: data?.user?.name ?? 'Ops user',
            role: data?.user?.role ?? 'admin',
        }),
        [data],
    );
    const [locale, setLocale] = useState('fr');
    const t = useCallback(
        (key, fallback) => translations[locale]?.[key] ?? translations.fr[key] ?? fallback ?? key,
        [locale],
    );
    const navItems = useMemo(
        () => NAV_ITEMS.map(item => ({ ...item, label: t(`nav.${item.key}`) })),
        [t],
    );
    const greeting = locale === 'fr' ? 'Bonjour' : 'Hello';

    return (
        <BrowserRouter basename="/admin">
            <div className="admin-shell">
                <aside className="admin-sidebar">
                    <div className="admin-brand">
                        <img src="/assets/images/IMG_0065.PNG" alt="LineUp" />
                        <div>
                            <p>LineUp Ops</p>
                            <span>{t('brand.subtitle')}</span>
                        </div>
                    </div>
                    <nav>
                        {navItems.map(item => (
                            <NavLink key={item.path} to={item.path} end={item.path === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <i className={item.icon}></i>
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                    <button type="button" className="logout" onClick={handleLogout}>
                        <i className="ri-logout-box-line"></i>
                        {t('button.logout')}
                    </button>
                </aside>
                <main className="admin-main">
                    <header className="admin-topbar">
                        <div>
                            <p>
                                {greeting} {user.name.split(' ')[0]}
                            </p>
                            <span>{t('topbar.tagline')}</span>
                        </div>
                        <div className="admin-topbar__actions">
                            <button type="button" className="ops-link" onClick={() => window.location.assign('/ops')}>
                                {t('button.opsLegacy')}
                            </button>
                            <button type="button" className="ops-link" onClick={() => setLocale(current => (current === 'fr' ? 'en' : 'fr'))}>
                                {locale === 'fr' ? 'EN' : 'FR'}
                            </button>
                        </div>
                    </header>
                    <div className="admin-content">
                        <Routes>
                            <Route path="/" element={<DashboardPage t={t} locale={locale} />} />
                            <Route path="/missions" element={<MissionsPage t={t} />} />
                            <Route path="/clients" element={<ClientsPage t={t} />} />
                            <Route path="/liners" element={<LinersPage t={t} />} />
                            <Route path="/payments" element={<PaymentsPage t={t} locale={locale} />} />
                            <Route path="/settings" element={<SettingsPage t={t} user={user} />} />
                            <Route path="/team" element={<TeamPage t={t} />} />
                            <Route path="/roles" element={<RolesPage t={t} />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </div>
                </main>
            </div>
        </BrowserRouter>
    );
}

async function handleLogout() {
    try {
        await axios.post('/admin/logout');
    } finally {
        window.location.href = '/admin/login';
    }
}

function DashboardPage({ t, locale }) {
    const [overview, setOverview] = useState(null);
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        async function load() {
            setLoading(true);
            try {
                const [overviewRes, providerRes] = await Promise.all([
                    axios.get(`${API_BASE}/overview`),
                    axios.get(`${API_BASE}/payment-providers`),
                ]);
                if (!active) return;
                setOverview(overviewRes.data.data ?? null);
                setProviders(providerRes.data.data ?? []);
            } finally {
                if (active) setLoading(false);
            }
        }
        load();
        const interval = setInterval(load, 60_000);
        return () => {
            active = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="dashboard">
            <div className="stat-grid">
                {statCards(overview, t).map(card => (
                    <article key={card.label} className="stat-card" style={{ borderColor: card.color }}>
                        <p>{card.label}</p>
                        <h3>{loading ? '…' : card.value}</h3>
                        <span>{card.trend}</span>
                    </article>
                ))}
            </div>
            <section className="panel">
                <header>
                    <div>
                        <p>{t('dashboard.providers.title')}</p>
                        <h2>{t('dashboard.providers.subtitle')}</h2>
                    </div>
                    <button type="button" onClick={() => window.location.reload()} className="ghost">
                        <i className="ri-refresh-line"></i>
                        {t('text.refresh')}
                    </button>
                </header>
                <div className="provider-grid">
                    {providers.map(provider => (
                        <article key={provider.provider} className="provider-card">
                            <div>
                                <p>{provider.label}</p>
                                <span>{provider.health?.status ?? 'unknown'}</span>
                            </div>
                            <div>
                                <strong>{provider.enabled ? 'Activé' : 'Désactivé'}</strong>
                                <p>{provider.health?.message ?? 'En attente d’activité'}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
            <section className="panel">
                <header>
                    <div>
                        <p>{t('dashboard.notifications.title')}</p>
                        <h2>{t('dashboard.notifications.subtitle')}</h2>
                    </div>
                </header>
                <NotificationsFeed t={t} locale={locale} />
            </section>
        </div>
    );
}

function NotificationsFeed({ t, locale }) {
    const [items, setItems] = useState([]);
    const eventSourceRef = useRef(null);
    const retryTimerRef = useRef(null);

    useEffect(() => {
        let mounted = true;
        axios.get(`${API_BASE}/notifications`).then(res => {
            if (!mounted) return;
            setItems(normalizeNotifications(res.data.data ?? []));
        });
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        const connect = () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            const source = new EventSource('/admin/api/notifications/stream');
            eventSourceRef.current = source;

            source.onmessage = event => {
                if (!event?.data) return;
                try {
                    const payload = JSON.parse(event.data);
                    if (payload.type === 'notifications' && Array.isArray(payload.items)) {
                        setItems(current => mergeNotificationLists(current, payload.items));
                    }
                } catch (error) {
                    // ignore malformed payloads
                }
            };

            source.onerror = () => {
                source.close();
                if (retryTimerRef.current) {
                    clearTimeout(retryTimerRef.current);
                }
                retryTimerRef.current = setTimeout(connect, 4000);
            };
        };

        connect();

        return () => {
            if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current);
                retryTimerRef.current = null;
            }
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, []);

    if (!items.length) {
        return <p className="muted">{t('notifications.empty')}</p>;
    }

    return (
        <div className="timeline">
            {items.map(item => (
                <article key={item.id}>
                    <div>
                        <strong>{item.title}</strong>
                        <span>{item.message}</span>
                    </div>
                    <time>{item.createdAt ? new Date(item.createdAt).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US') : ''}</time>
                </article>
            ))}
        </div>
    );
}

function MissionsPage({ t }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API_BASE}/missions`).then(res => {
            setRows(res.data.data ?? []);
            setLoading(false);
        });
    }, []);

    return (
        <section className="panel">
            <header>
                <div>
                    <p>{t('missions.title')}</p>
                    <h2>{t('missions.subtitle')}</h2>
                </div>
            </header>
            {loading ? (
                <p className="muted">{t('loading')}</p>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('table.mission')}</th>
                            <th>{t('table.client')}</th>
                            <th>{t('table.status')}</th>
                            <th>{t('table.budget')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => (
                            <tr key={row.id}>
                                <td>{row.title}</td>
                                <td>{row.client?.name ?? '—'}</td>
                                <td>
                                    <span className={`chip chip--${row.status}`}>{row.status}</span>
                                </td>
                                <td>{formatEuro(row.budgetCents)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}

function ClientsPage({ t }) {
    const [rows, setRows] = useState([]);

    useEffect(() => {
        axios.get(`${API_BASE}/clients`).then(res => setRows(res.data.data ?? []));
    }, []);

    return (
        <section className="panel">
            <header>
                <div>
                    <p>{t('clients.title')}</p>
                    <h2>{t('clients.subtitle')}</h2>
                </div>
            </header>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>{t('table.client')}</th>
                        <th>{t('table.missions')}</th>
                        <th>{t('table.ltv')}</th>
                        <th>{t('table.status')}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => (
                        <tr key={row.id}>
                            <td>
                                <div className="cell">
                                    <strong>{row.name}</strong>
                                    <span>{row.email}</span>
                                </div>
                            </td>
                            <td>{row.missionsTotal}</td>
                            <td>{row.lifetimeValueEuros?.toFixed(2)} €</td>
                            <td>
                                <span className={`chip chip--${row.status}`}>{row.status}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}

function LinersPage({ t }) {
    const [rows, setRows] = useState([]);

    useEffect(() => {
        axios.get(`${API_BASE}/liners`).then(res => setRows(res.data.data ?? []));
    }, []);

    return (
        <section className="panel">
            <header>
                <div>
                    <p>{t('liners.title')}</p>
                    <h2>{t('liners.subtitle')}</h2>
                </div>
            </header>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>{t('table.liner')}</th>
                        <th>{t('table.missions')}</th>
                        <th>{t('table.rating')}</th>
                        <th>{t('table.kyc')}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => (
                        <tr key={row.id}>
                            <td>
                                <div className="cell">
                                    <strong>{row.name}</strong>
                                    <span>{row.email}</span>
                                </div>
                            </td>
                            <td>{row.missionsTotal}</td>
                            <td>{row.rating ? `${row.rating} ★` : '—'}</td>
                            <td>
                                <span className={`chip chip--${row.kycStatus}`}>{row.kycStatus}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}

function PaymentsPage({ t, locale }) {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_BASE}/payment-providers`);
            setProviders(data.data ?? []);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadAccounts = useCallback(async () => {
        setLoadingAccounts(true);
        try {
            const { data } = await axios.get(`${API_BASE}/payout-accounts`);
            setAccounts(data.data ?? []);
        } finally {
            setLoadingAccounts(false);
        }
    }, []);

    useEffect(() => {
        load();
        loadAccounts();
    }, [load, loadAccounts]);

    const toggleAdmin = async (provider, value) => {
        setSavingKey(`${provider}-admin`);
        try {
            await axios.put(`${API_BASE}/payment-providers/${provider}`, {
                adminApproved: value,
            });
            await load();
        } finally {
            setSavingKey(null);
        }
    };

    const toggleOps = async (provider, value) => {
        setSavingKey(`${provider}-ops`);
        try {
            await axios.put(`${API_BASE}/payment-providers/${provider}`, {
                enabled: value,
            });
            await load();
        } finally {
            setSavingKey(null);
        }
    };

    return (
        <>
            <section className="panel">
                <header>
                    <div>
                        <p>{t('payments.title')}</p>
                        <h2>{t('payments.subtitle')}</h2>
                    </div>
                    <p className="muted">{t('payments.helper')}</p>
                </header>
                {loading ? (
                    <p className="muted">{t('loading')}</p>
                ) : (
                    <div className="provider-grid">
                        {providers.map(provider => (
                            <article key={provider.provider} className="provider-card provider-card--admin">
                                <div>
                                    <p>{provider.label}</p>
                                    <span>{provider.health?.status ?? 'unknown'}</span>
                                </div>
                                <div className="approval-switches">
                                    <label>
                                        <span>{t('payments.field.admin')}</span>
                                        <input
                                            type="checkbox"
                                            checked={provider.adminApproved}
                                            onChange={event => toggleAdmin(provider.provider, event.target.checked)}
                                            disabled={savingKey === `${provider.provider}-admin`}
                                        />
                                    </label>
                                    <label>
                                        <span>{t('payments.field.ops')}</span>
                                        <input
                                            type="checkbox"
                                            checked={provider.enabled}
                                            onChange={event => toggleOps(provider.provider, event.target.checked)}
                                            disabled={!provider.adminApproved || savingKey === `${provider.provider}-ops`}
                                        />
                                    </label>
                                </div>
                                <p className="muted">
                                    {!provider.adminApproved
                                        ? t('payments.state.pending')
                                        : provider.enabled
                                            ? t('payments.state.active')
                                            : t('payments.state.ready')}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </section>
            <section className="panel">
                <header>
                    <div>
                        <p>{t('payouts.title')}</p>
                        <h2>{t('payouts.subtitle')}</h2>
                    </div>
                    <button type="button" className="ghost" onClick={loadAccounts} disabled={loadingAccounts}>
                        <i className="ri-refresh-line"></i> {t('text.refresh')}
                    </button>
                </header>
                {loadingAccounts ? (
                    <p className="muted">{t('loading')}</p>
                ) : accounts.length === 0 ? (
                    <p className="muted">{t('payouts.empty')}</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('table.provider')}</th>
                                    <th>{t('table.owner')}</th>
                                    <th>{t('table.status')}</th>
                                    <th>{t('table.updated')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map(account => (
                                    <tr key={account.id}>
                                        <td>
                                            <div className="cell">
                                                <strong>{account.label ?? account.provider}</strong>
                                                <span>{account.provider}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="cell">
                                                <strong>{account.user?.name ?? '—'}</strong>
                                                <span>{account.user?.email ?? ''}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`chip chip--${account.status}`}>{account.status ?? '—'}</span>
                                            {account.isDefault && <small>{t('payouts.default')}</small>}
                                        </td>
                                        <td>{account.updatedAt ? formatDateTime(account.updatedAt, locale) : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </>
    );
}

function SettingsPage({ t, user }) {
    const [settings, setSettings] = useState([]);
    const [savingKey, setSavingKey] = useState(null);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (!toast) return undefined;
        const timer = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(timer);
    }, [toast]);

    const load = useCallback(async () => {
        if (!isAdmin) {
            setSettings([]);
            return;
        }
        setError('');
        try {
            const { data } = await axios.get(SETTINGS_API);
            setSettings(data.data ?? []);
        } catch (err) {
            setError('Impossible de charger les paramètres.');
        }
    }, [isAdmin]);

    useEffect(() => {
        load();
    }, [load]);

    const findSetting = key => settings.find(item => item.key === key);

    const updateSetting = async (key, value) => {
        if (!isAdmin) {
            setError('Seul un administrateur peut modifier ces paramètres.');
            setToast({ text: 'Accès refusé : rôle admin requis.', isError: true });
            return;
        }
        const record = findSetting(key);
        if (!record) return;
        setSavingKey(key);
        setError('');
        try {
            await axios.put(`${SETTINGS_API}/${record.id}`, { value });
            await load();
            setToast({ text: 'Paramètres enregistrés.', isError: false });
        } catch (err) {
            setError('Enregistrement impossible, vérifiez les valeurs saisies.');
            setToast({ text: 'Erreur lors de l’enregistrement.', isError: true });
        } finally {
            setSavingKey(null);
        }
    };

    const handleReload = async () => {
        if (!isAdmin) {
            setToast({ text: 'Accès refusé : rôle admin requis.', isError: true });
            return;
        }
        setSavingKey('reload');
        setError('');
        try {
            await axios.post(`${API_BASE}/settings/reload`);
            await load();
            setToast({ text: 'Valeurs rechargées depuis .env', isError: false });
        } catch (err) {
            setError('Impossible de recharger les valeurs.');
            setToast({ text: 'Erreur pendant le rechargement.', isError: true });
        } finally {
            setSavingKey(null);
        }
    };

    const google = findSetting('auth_google')?.value ?? {};
    const apple = findSetting('auth_apple')?.value ?? {};
    const firebase = findSetting('firebase_frontend')?.value ?? {};

    return (
        <section className="panel">
            <header className="panel__header">
                <div>
                    <p>{t('settings.title')}</p>
                    <h2>{t('settings.subtitle')}</h2>
                </div>
                {isAdmin && (
                    <button type="button" className="btn-ghost" onClick={handleReload} disabled={savingKey === 'reload'}>
                        {savingKey === 'reload' ? 'Rechargement…' : 'Recharger depuis .env'}
                    </button>
                )}
            </header>
            {error && <p className="alert">{error}</p>}
            {!isAdmin && (
                <p className="alert">
                    Accès réservé aux administrateurs. Contactez un administrateur pour modifier ces identifiants.
                </p>
            )}
            <div className="settings-grid">
                <AuthProviderCard
                    title="Google Sign-In"
                    description="Client IDs utilisés par le web et l’app mobile."
                    fields={[
                        { key: 'webClientId', label: 'Web client ID' },
                        { key: 'iosClientId', label: 'iOS client ID' },
                        { key: 'androidClientId', label: 'Android client ID' },
                        { key: 'serverClientId', label: 'Server client ID' },
                        { key: 'clientSecret', label: 'Client secret', type: 'password' },
                    ]}
                    value={google}
                    saving={savingKey === 'auth_google'}
                    onSave={value => updateSetting('auth_google', value)}
                    disabled={!isAdmin}
                />
                <AuthProviderCard
                    title="Apple Sign-In"
                    description="Identifiants Apple (service, team, clé)."
                    fields={[
                        { key: 'serviceId', label: 'Service ID' },
                        { key: 'teamId', label: 'Team ID' },
                        { key: 'keyId', label: 'Key ID' },
                        { key: 'privateKey', label: 'Private key', type: 'textarea' },
                        { key: 'redirectUri', label: 'Redirect URI' },
                    ]}
                    value={apple}
                    saving={savingKey === 'auth_apple'}
                    onSave={value => updateSetting('auth_apple', value)}
                    disabled={!isAdmin}
                />
                <AuthProviderCard
                    title="Firebase (Web & Mobile)"
                    description="Clés publiques nécessaires à Firebase Auth, FCM et ReCAPTCHA."
                    fields={[
                        { key: 'apiKey', label: 'API Key' },
                        { key: 'authDomain', label: 'Auth domain' },
                        { key: 'projectId', label: 'Project ID' },
                        { key: 'storageBucket', label: 'Storage bucket' },
                        { key: 'messagingSenderId', label: 'Messaging sender ID' },
                        { key: 'appId', label: 'App ID' },
                        { key: 'measurementId', label: 'Measurement ID' },
                        { key: 'vapidKey', label: 'VAPID key' },
                    ]}
                    value={firebase}
                    saving={savingKey === 'firebase_frontend'}
                    onSave={value => updateSetting('firebase_frontend', value)}
                    disabled={!isAdmin}
                />
            </div>
            {toast && (
                <div className={`admin-toast ${toast.isError ? 'admin-toast--error' : ''}`}>
                    {toast.text}
                </div>
            )}
        </section>
    );
}

function AuthProviderCard({ title, description, fields, value, onSave, saving, disabled = false }) {
    const initial = useMemo(
        () =>
            fields.reduce(
                (acc, field) => ({
                    ...acc,
                    [field.key]: value?.[field.key] ?? '',
                }),
                {},
            ),
        [fields, value],
    );
    const [form, setForm] = useState(initial);

    useEffect(() => {
        setForm(initial);
    }, [initial]);

    const handleChange = (key, val) => {
        setForm(current => ({
            ...current,
            [key]: val,
        }));
    };

    return (
        <article className="settings-card">
            <div>
                <p className="settings-card__title">{title}</p>
                <p className="settings-card__subtitle">{description}</p>
            </div>
            <div className="settings-card__fields">
                {fields.map(field => (
                    <label key={field.key}>
                        <span>{field.label}</span>
                        {field.type === 'textarea' ? (
                            <textarea
                                value={form[field.key] ?? ''}
                                onChange={event => handleChange(field.key, event.target.value)}
                                disabled={disabled}
                                rows={4}
                            />
                        ) : (
                            <input
                                type={field.type ?? 'text'}
                                value={form[field.key] ?? ''}
                                onChange={event => handleChange(field.key, event.target.value)}
                                disabled={disabled}
                                placeholder={field.placeholder ?? ''}
                            />
                        )}
                    </label>
                ))}
            </div>
            <button type="button" className="btn-primary" disabled={saving || disabled} onClick={() => onSave(form)}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
        </article>
    );
}

function TeamPage({ t }) {
    const [members, setMembers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [teamRes, roleRes] = await Promise.all([
                axios.get(`${API_BASE}/team`),
                axios.get(`${API_BASE}/team-roles`),
            ]);
            setMembers(teamRes.data.data ?? []);
            setRoles(roleRes.data.data ?? []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    function labelFor(roleName) {
        return roles.find(role => role.name === roleName)?.label ?? roleName;
    }

    async function handleChange(memberId, roleName) {
        setSavingId(memberId);
        try {
            await axios.put(`${API_BASE}/team/${memberId}`, { teamRole: roleName });
            await load();
        } finally {
            setSavingId(null);
        }
    }

    return (
        <section className="panel">
            <header>
                <div>
                    <p>{t('team.title')}</p>
                    <h2>{t('team.subtitle')}</h2>
                </div>
                <p className="muted">{t('team.helper')}</p>
            </header>
            {loading ? (
                <p className="muted">{t('loading')}</p>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('table.name')}</th>
                            <th>{t('table.email')}</th>
                            <th>{t('table.role')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map(member => (
                            <tr key={member.id}>
                                <td>{member.name}</td>
                                <td>{member.email}</td>
                                <td>
                                    <select
                                        className="role-select"
                                        value={member.role}
                                        onChange={event => handleChange(member.id, event.target.value)}
                                        disabled={savingId === member.id}
                                    >
                                        {roles.map(role => (
                                            <option key={role.name} value={role.name}>
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>
                                    <small>{labelFor(member.role)}</small>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}

function RolesPage({ t }) {
    const [roles, setRoles] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState({ name: '', label: '', description: '', permissions: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_BASE}/team-roles`);
            setRoles(data.data ?? []);
            if (selectedId) {
                const refreshed = data.data?.find(role => role.id === selectedId);
                if (refreshed) {
                    setForm({ ...refreshed, permissions: refreshed.permissions ?? [] });
                }
            }
        } finally {
            setLoading(false);
        }
    }, [selectedId]);

    useEffect(() => {
        load();
    }, [load]);

    const selectedRole = roles.find(role => role.id === selectedId) ?? null;
    const isEditing = Boolean(selectedRole);
    const protectedRole = selectedRole && ['admin'].includes(selectedRole.name);

    function resetForm(role = null) {
        if (!role) {
            setSelectedId(null);
            setForm({ name: '', label: '', description: '', permissions: [] });
            return;
        }
        setSelectedId(role.id);
        setForm({
            name: role.name,
            label: role.label,
            description: role.description ?? '',
            permissions: role.permissions ?? [],
        });
    }

    function handlePermissionToggle(code) {
        setForm(current => {
            const has = current.permissions.includes(code);
            const permissions = has
                ? current.permissions.filter(item => item !== code)
                : [...current.permissions, code];
            return { ...current, permissions };
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        try {
            if (isEditing) {
                await axios.put(`${API_BASE}/team-roles/${selectedRole.id}`, form);
            } else {
                await axios.post(`${API_BASE}/team-roles`, form);
                setSelectedId(null);
                setForm({ name: '', label: '', description: '', permissions: [] });
            }
            await load();
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!selectedRole || protectedRole) {
            return;
        }
        setSaving(true);
        try {
            await axios.delete(`${API_BASE}/team-roles/${selectedRole.id}`);
            setSelectedId(null);
            setForm({ name: '', label: '', description: '', permissions: [] });
            await load();
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="panel">
            <header>
                <div>
                    <p>{t('roles.title')}</p>
                    <h2>{t('roles.subtitle')}</h2>
                </div>
                <p className="muted">{t('roles.helper')}</p>
            </header>
            {loading ? (
                <p className="muted">{t('loading')}</p>
            ) : (
                <div className="roles-layout">
                    <div className="roles-list">
                        <button type="button" className={!isEditing ? 'active' : ''} onClick={() => resetForm(null)}>
                            {t('roles.new')}
                        </button>
                        {roles.map(role => (
                            <button
                                type="button"
                                key={role.id}
                                className={selectedId === role.id ? 'active' : ''}
                                onClick={() => resetForm(role)}
                            >
                                <strong>{role.label}</strong>
                                <span>
                                    {formatTemplate(t('roles.perms'), { count: role.permissions?.length ?? 0 })}
                                </span>
                            </button>
                        ))}
                    </div>
                    <form className="roles-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <label>
                                {t('roles.slug')}
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
                                    placeholder={t('roles.placeholder.slug')}
                                    required
                                    disabled={protectedRole}
                                />
                            </label>
                            <label>
                                {t('roles.label')}
                                <input
                                    type="text"
                                    value={form.label}
                                    onChange={event => setForm(current => ({ ...current, label: event.target.value }))}
                                    placeholder={t('roles.placeholder.label')}
                                    required
                                />
                            </label>
                        </div>
                        <label>
                            {t('roles.description')}
                            <textarea
                                rows={3}
                                value={form.description}
                                onChange={event => setForm(current => ({ ...current, description: event.target.value }))}
                                placeholder={t('roles.placeholder.description')}
                            />
                        </label>
                        <div className="permissions-grid">
                            {PERMISSION_GROUPS.map(group => (
                                <article key={group.key}>
                                    <strong>{t(group.labelKey, group.label)}</strong>
                                    <div className="perm-items">
                                        {group.permissions.map(permission => (
                                            <label key={permission.code} className="perm-item">
                                                <input
                                                    type="checkbox"
                                                    checked={form.permissions.includes(permission.code)}
                                                    onChange={() => handlePermissionToggle(permission.code)}
                                                />
                                                <span>{t(permission.labelKey, permission.label)}</span>
                                            </label>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn-primary" disabled={saving}>
                                {isEditing ? t('roles.update') : t('roles.create')}
                            </button>
                            {isEditing && (
                                <button type="button" className="btn-ghost" onClick={handleDelete} disabled={saving || protectedRole}>
                                    {t('roles.delete')}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}
        </section>
    );
}

function statCards(overview, t) {
    if (!overview) {
        return [
            { label: t('stat.missions'), value: '—', trend: t('loading'), color: '#7C3AED' },
            { label: t('stat.payments'), value: '—', trend: t('loading'), color: '#0EA5E9' },
            { label: t('stat.volume'), value: '—', trend: t('loading'), color: '#EC4899' },
        ];
    }

    return [
        {
            label: t('stat.missions'),
            value: overview.stats?.missions_active ?? '--',
            trend: formatTemplate(t('stat.queue'), { count: overview.stats?.missions_queueing ?? 0 }),
            color: '#7C3AED',
        },
        {
            label: t('stat.payments'),
            value: `€${(overview.payments?.pending_payouts ?? 0).toFixed(1)}k`,
            trend: t('stat.paymentsTrend'),
            color: '#0EA5E9',
        },
        {
            label: t('stat.volume'),
            value: `€${(overview.payments?.volume_week ?? 0).toFixed(1)}k`,
            trend: t('stat.volumeTrend'),
            color: '#EC4899',
        },
    ];
}

function formatEuro(cents) {
    if (typeof cents !== 'number') return '—';
    return `${(cents / 100).toFixed(2)} €`;
}

function formatDateTime(value, locale = 'fr') {
    if (!value) return '—';
    try {
        const lang = locale === 'fr' ? 'fr-FR' : 'en-US';
        return new Date(value).toLocaleString(lang, {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (error) {
        return value;
    }
}

function formatTemplate(template, params = {}) {
    if (typeof template !== 'string') {
        return template ?? '';
    }
    return Object.entries(params).reduce((text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), value), template);
}

function normalizeNotifications(list = []) {
    return [...list].sort((a, b) => {
        const dateA = new Date(a.createdAt ?? a.created_at ?? 0).getTime();
        const dateB = new Date(b.createdAt ?? b.created_at ?? 0).getTime();
        return dateB - dateA;
    });
}

function mergeNotificationLists(current, incoming = []) {
    const map = new Map();
    current.forEach(item => map.set(item.id, item));
    incoming.forEach(item => map.set(item.id, item));
    return normalizeNotifications(Array.from(map.values()));
}
