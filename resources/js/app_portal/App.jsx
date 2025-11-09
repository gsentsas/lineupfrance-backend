import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link, useParams, useLocation } from 'react-router-dom';
import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { AuthProvider, useAuth } from './AuthProvider';
import { getMessagingToken } from './firebaseClient';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import tokens from '../../../shared/design/tokens';
import { translations, createTranslator, formatTemplate } from './translations';
import './styles.css';

const AppContext = createContext({
    config: null,
    loading: true,
    userRole: null,
    setUserRole: () => {},
    locale: 'fr',
    setLocale: () => {},
    t: () => {},
});

axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

export default function AppShell() {
    const [firebaseConfig, setFirebaseConfig] = useState(null);
    const [configLoading, setConfigLoading] = useState(true);

    useEffect(() => {
        let active = true;
        async function loadFirebaseConfig() {
            try {
                const { data } = await axios.get('/api/settings');
                if (!active) return;
                setFirebaseConfig(data.data?.firebase_frontend ?? null);
            } finally {
                if (active) setConfigLoading(false);
            }
        }
        loadFirebaseConfig();
        return () => {
            active = false;
        };
    }, []);

    if (configLoading) {
        return null;
    }

    return (
        <AuthProvider config={firebaseConfig}>
            <AppContent />
        </AuthProvider>
    );
}

function AppContent() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRoleState] = useState(localStorage.getItem('lineup_role') || null);
    const [locale, setLocale] = useState('fr');
    const t = useMemo(() => createTranslator(locale), [locale]);
    const { apiToken } = useAuth();

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--gradient-start', tokens.colors.primary);
        root.style.setProperty('--gradient-mid', tokens.colors.tertiary);
        root.style.setProperty('--gradient-end', tokens.colors.secondary);
    }, []);

    useEffect(() => {
        let active = true;
        async function load() {
            setLoading(true);
            try {
                const { data } = await axios.get('/api/settings');
                if (!active) return;
                setConfig(data.data ?? {});
            } finally {
                if (active) setLoading(false);
            }
        }
        load();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        async function registerPush() {
            if (!apiToken || !config?.firebase_frontend?.vapidKey) return;
            const token = await getMessagingToken(config.firebase_frontend.vapidKey);
            if (!token) return;
            try {
                await axios.post('/api/push/register', {
                    token,
                    platform: 'web-react',
                });
            } catch (error) {
                console.warn('Push registration failed', error);
            }
        }
        registerPush();
    }, [apiToken, config?.firebase_frontend?.vapidKey]);

    const setUserRole = role => {
        setUserRoleState(role);
        if (role) {
            localStorage.setItem('lineup_role', role);
        } else {
            localStorage.removeItem('lineup_role');
        }
    };

    const contextValue = useMemo(
        () => ({ config, loading, userRole, setUserRole, locale, setLocale, t }),
        [config, loading, userRole, locale, t],
    );

    return (
        <AppContext.Provider value={contextValue}>
            <BrowserRouter basename="/app/react">
                <LanguageToggle />
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/bonjour-lineup" element={<Landing variant="bonjour" />} />
                    <Route path="/creer-mission" element={<Landing variant="mission" />} />
                    <Route path="/role-choice" element={<RoleChoice />} />
                    <Route path="/connexion" element={<AuthGateway />} />
                    <Route path="/client/onboarding" element={<ClientOnboarding />} />
                    <Route path="/client/home" element={<ClientDashboard />} />
                    <Route path="/client/missions" element={<ClientMissionList />} />
                    <Route path="/client/missions/:missionId" element={<MissionDetail role="client" />} />
                    <Route path="/client/wallet" element={<WalletPanel role="client" />} />
                    <Route path="/liner/onboarding" element={<LinerOnboarding />} />
                    <Route path="/liner/home" element={<LinerDashboard />} />
                    <Route path="/liner/missions" element={<LinerMissions />} />
                    <Route path="/liner/missions/:missionId" element={<MissionDetail role="liner" />} />
                    <Route path="/liner/kyc" element={<KycPanel />} />
                    <Route path="/liner/tutorial" element={<TutorialPanel />} />
                    <Route path="/liner/wallet" element={<WalletPanel role="liner" />} />
                    <Route path="/notifications" element={<NotificationsCenter />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AppContext.Provider>
    );
}

function Landing({ variant = 'home' }) {
    const { config, loading, userRole, t, locale } = useApp();
    const { apiToken } = useAuth();
    const landingCopy = t('landing', translations.fr.landing);
    const navigate = useNavigate();
    const highlights = config?.onboarding_highlights ?? [];
    const badges = config?.timeline ?? [];
    const location = useLocation();

    useEffect(() => {
        if (variant === 'bonjour' || location.pathname.includes('bonjour')) {
            document.getElementById('bonjour-lineup')?.scrollIntoView({ behavior: 'smooth' });
        }
        if (variant === 'mission') {
            document.getElementById('cta-mission')?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [variant, location.pathname]);

    const handleCreateMission = () => {
        if (userRole !== 'client') {
            navigate('/role-choice');
            return;
        }
        if (!apiToken) {
            navigate('/connexion');
            return;
        }
        navigate('/client/missions?create=1');
    };

    return (
        <div>
            <section className="app-hero">
                <div className="app-hero__copy">
                    <p className="app-hero__eyebrow">{landingCopy.heroEyebrow}</p>
                    <h1>
                        {((config?.hero?.title && config.hero.title.split('\n')) || landingCopy.heroTitleLines).map(line => (
                            <span key={line}>{line}</span>
                        ))}
                    </h1>
                    <p className="app-hero__subtitle">{config?.hero?.subtitle ?? landingCopy.heroSubtitle}</p>
                    <div className="app-hero__cta" id="cta-mission">
                        <button className="btn-primary" onClick={() => navigate('/role-choice')}>
                            {landingCopy.ctas.role}
                        </button>
                        <button className="btn-ghost" onClick={() => navigate('/connexion')}>
                            {landingCopy.ctas.login}
                        </button>
                        <button className="btn-outline" onClick={handleCreateMission}>
                            {landingCopy.ctas.mission}
                        </button>
                    </div>
                    <ul className="app-hero__tags">
                        {(landingCopy.tags ?? []).map(tag => (
                            <li key={tag}>{tag}</li>
                        ))}
                    </ul>
                </div>
                <div className="app-hero__panel">
                    {loading ? (
                        <p className="muted">{t('general.loading')}</p>
                    ) : (
                        <div className="app-preview">
                            <p>{t('landing.previewTitle')}</p>
                            <ul>
                                {(badges.length ? badges : landingCopy.timelineFallback).map(item => (
                                    <li key={`${item.label}-${item.time}`}>
                                        <strong>{item.time}</strong>
                                        <div>
                                            <span>{item.label}</span>
                                            <small>{item.status}</small>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </section>

            <section className="app-actions">
                {(landingCopy.actions ?? []).map((action, index) => (
                    <article key={action.title}>
                        <h3>{action.title}</h3>
                        <p>{action.description}</p>
                        <button
                            type="button"
                            onClick={() => {
                                if (index === 0) {
                                    navigate('/connexion');
                                } else if (index === 1) {
                                    handleCreateMission();
                                } else {
                                    navigate('/role-choice');
                                }
                            }}
                        >
                            {action.button}
                        </button>
                    </article>
                ))}
            </section>

            <section className="app-hello" id="bonjour-lineup">
                <div>
                    <p className="muted">{landingCopy.bonjour.eyebrow}</p>
                    <h2>{landingCopy.bonjour.title}</h2>
                    <p>{landingCopy.bonjour.description}</p>
                    <div className="form-actions">
                        <button className="btn-primary" onClick={handleCreateMission}>
                            {landingCopy.bonjour.primary}
                        </button>
                        <button className="btn-ghost" onClick={() => navigate('/liner/tutorial')}>
                            {landingCopy.bonjour.secondary}
                        </button>
                    </div>
                </div>
                <ul>
                    {(highlights.length ? highlights : landingCopy.highlights).map(item => (
                        <li key={item.title}>
                            <strong>{item.title}</strong>
                            <span>{item.description}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}

function RoleChoice() {
    const { setUserRole, t } = useApp();
    const copy = t('roleChoice', translations.fr.roleChoice);
    const navigate = useNavigate();

    const handleSelect = role => {
        setUserRole(role);
        if (role === 'client') {
            navigate('/client/onboarding');
        } else {
            navigate('/liner/onboarding');
        }
    };

    return (
        <section className="app-shell">
            <header className="app-shell__header">
                <p>{copy.step}</p>
                <h2>{copy.title}</h2>
                <p className="muted">{copy.description}</p>
            </header>
            <div className="role-grid">
                <article className="role-card">
                    <h3>{copy.client.title}</h3>
                    <p>{copy.client.description}</p>
                    <ul>
                        {copy.client.bullets.map(item => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                    <button className="btn-primary" onClick={() => handleSelect('client')}>
                        {copy.client.button}
                    </button>
                </article>
                <article className="role-card">
                    <h3>{copy.liner.title}</h3>
                    <p>{copy.liner.description}</p>
                    <ul>
                        {copy.liner.bullets.map(item => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                    <button className="btn-ghost" onClick={() => handleSelect('liner')}>
                        {copy.liner.button}
                    </button>
                </article>
            </div>
        </section>
    );
}

function AuthGateway() {
    const navigate = useNavigate();
    const { userRole, t } = useApp();
    const { loginWithEmail, loginWithProvider, loginWithPhone } = useAuth();
    const copy = t('auth', translations.fr.auth);
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({ email: '', password: '' });
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneCode, setPhoneCode] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const role = userRole ?? 'client';

    const handleEmail = async event => {
        event.preventDefault();
        setStatus('loading');
        setError('');
        try {
            await loginWithEmail({ email: form.email, password: form.password, mode, role });
            navigate(role === 'client' ? '/client/home' : '/liner/home');
        } catch (err) {
            setError(copy.errorCredentials);
        } finally {
            setStatus('idle');
        }
    };

    const handleProvider = async provider => {
        setStatus('loading');
        setError('');
        try {
            await loginWithProvider({ provider, role });
            navigate(role === 'client' ? '/client/home' : '/liner/home');
        } catch (err) {
            setError(copy.errorProvider);
        } finally {
            setStatus('idle');
        }
    };

    const handlePhone = async event => {
        event.preventDefault();
        setError('');
        if (!confirmationResult) {
            try {
                const confirmation = await loginWithPhone({ phoneNumber, recaptchaContainer: 'recaptcha-container', role });
                setConfirmationResult(confirmation);
                setStatus('code');
            } catch (err) {
                setError(copy.errorSms);
            }
            return;
        }
        try {
            setStatus('loading');
            await loginWithPhone({ confirmationResult, code: phoneCode, role });
            navigate(role === 'client' ? '/client/home' : '/liner/home');
        } catch (err) {
            setError(copy.errorCode);
        } finally {
            setStatus('idle');
        }
    };

    return (
        <section className="app-shell">
            <header className="app-shell__header">
                <p>{copy.eyebrow}</p>
                <h2>{copy.title}</h2>
            </header>
            <div className="auth-card">
                <form className="auth-form" onSubmit={handleEmail}>
                    <label>
                        {copy.email}
                        <input type="email" value={form.email} onChange={event => setForm(prev => ({ ...prev, email: event.target.value }))} required />
                    </label>
                    <label>
                        {copy.password}
                        <input
                            type="password"
                            value={form.password}
                            onChange={event => setForm(prev => ({ ...prev, password: event.target.value }))}
                            required
                        />
                    </label>
                    <div className="form-actions">
                        <button className="btn-primary" disabled={status === 'loading'}>
                            {mode === 'login' ? copy.login : copy.register}
                        </button>
                        <button type="button" className="btn-ghost" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                            {mode === 'login' ? copy.toggleToRegister : copy.toggleToLogin}
                        </button>
                    </div>
                </form>
                <div className="divider">{copy.divider}</div>
                <div className="provider-grid">
                    <button type="button" onClick={() => handleProvider('google')}>
                        {copy.continueGoogle}
                    </button>
                    <button type="button" onClick={() => handleProvider('apple')}>
                        {copy.continueApple}
                    </button>
                </div>
                <form className="phone-form" onSubmit={handlePhone}>
                    <label>
                        {copy.phoneLabel}
                        <input type="tel" value={phoneNumber} onChange={event => setPhoneNumber(event.target.value)} required />
                    </label>
                    {confirmationResult && (
                        <label>
                            {copy.smsLabel}
                            <input type="text" value={phoneCode} onChange={event => setPhoneCode(event.target.value)} />
                        </label>
                    )}
                    <button className="btn-primary" disabled={status === 'loading'}>
                        {confirmationResult ? copy.confirmCode : copy.sendCode}
                    </button>
                    <div id="recaptcha-container" />
                </form>
                {error && <p className="alert">{error}</p>}
                <p className="muted">{copy.note}</p>
            </div>
        </section>
    );
}

function ClientOnboarding() {
    const navigate = useNavigate();
    const { t } = useApp();
    const copy = t('clientOnboarding', translations.fr.clientOnboarding);
    return (
        <section className="app-shell">
            <header className="app-shell__header">
                <p>{copy.title}</p>
                <h2>{copy.subtitle}</h2>
            </header>
            <ol className="steps">
                {copy.steps.map(step => (
                    <li key={step.title}>
                        <strong>{step.title}</strong>
                        <span>{step.description}</span>
                    </li>
                ))}
            </ol>
            <div className="form-actions">
                <button className="btn-primary" onClick={() => navigate('/client/home')}>
                    {copy.buttons.dashboard}
                </button>
                <button className="btn-ghost" onClick={() => navigate('/role-choice')}>
                    {copy.buttons.back}
                </button>
            </div>
        </section>
    );
}

function ClientDashboard() {
    const { userRole, t } = useApp();
    const copy = t('clientDashboard', translations.fr.clientDashboard);
    return (
        <DashboardShell title={copy.title} subtitle={copy.subtitle}>
            {userRole !== 'client' && <p className="alert">{copy.alert}</p>}
            <div className="form-actions">
                <Link className="btn-primary" to="/client/missions">
                    {copy.buttons.missions}
                </Link>
                <Link className="btn-ghost" to="/client/wallet">
                    {copy.buttons.wallet}
                </Link>
                <Link className="btn-ghost" to="/notifications">
                    {copy.buttons.notifications}
                </Link>
            </div>
            <ClientMissionForm />
            <ChatPanel role="client" />
        </DashboardShell>
    );
}

function ClientMissionForm() {
    const { apiToken } = useAuth();
    const { userRole, t } = useApp();
    const copy = t('clientMissionForm', translations.fr.clientMissionForm);
    const [form, setForm] = useState({ title: '', description: '', location: '', scheduledAt: '', durationMinutes: 60, budgetCents: 1800 });
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
    const [profileReady, setProfileReady] = useState(false);

    useEffect(() => {
        if (!apiToken || userRole !== 'client') return;
        let active = true;
        async function load() {
            try {
                const [meRes, methodsRes] = await Promise.all([
                    axios.get('/api/me'),
                    axios.get('/api/payments/methods'),
                ]);
                if (!active) return;
                setProfileReady(Boolean(meRes.data?.data?.clientProfile));
                setHasPaymentMethod((methodsRes.data?.data ?? []).length > 0);
            } catch (error) {
                // ignore
            }
        }
        load();
        return () => {
            active = false;
        };
    }, [apiToken, userRole]);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async event => {
        event.preventDefault();
        setStatus('loading');
        setMessage('');
        try {
            await axios.post('/api/missions', {
                title: form.title,
                description: form.description,
                location: { label: form.location },
                scheduledAt: form.scheduledAt || null,
                durationMinutes: Number(form.durationMinutes) || null,
                budgetCents: Math.round(Number(form.budgetCents) || 0),
            });
            setMessage(copy.messageSuccess);
            setForm({ title: '', description: '', location: '', scheduledAt: '', durationMinutes: 60, budgetCents: 1800 });
        } catch (error) {
            setMessage(copy.messageError);
        } finally {
            setStatus('idle');
        }
    };

    if (!apiToken) {
        return <p className="muted">{copy.alerts.auth}</p>;
    }

    if (!profileReady || !hasPaymentMethod) {
        return (
            <p className="alert">
                {copy.alerts.prerequisites}
            </p>
        );
    }

    return (
        <form className="mission-form" onSubmit={handleSubmit}>
            <h3>{copy.title}</h3>
            <label>
                {copy.labels.title}
                <input value={form.title} onChange={event => handleChange('title', event.target.value)} required />
            </label>
            <label>
                {copy.labels.description}
                <textarea value={form.description} rows={3} onChange={event => handleChange('description', event.target.value)} />
            </label>
            <label>
                {copy.labels.location}
                <input
                    value={form.location}
                    onChange={event => handleChange('location', event.target.value)}
                    placeholder={copy.placeholderLocation}
                />
            </label>
            <div className="mission-grid">
                <label>
                    {copy.labels.datetime}
                    <input type="datetime-local" value={form.scheduledAt} onChange={event => handleChange('scheduledAt', event.target.value)} />
                </label>
                <label>
                    {copy.labels.duration}
                    <input type="number" value={form.durationMinutes} onChange={event => handleChange('durationMinutes', event.target.value)} />
                </label>
                <label>
                    {copy.labels.budget}
                    <input type="number" value={form.budgetCents} onChange={event => handleChange('budgetCents', event.target.value)} />
                </label>
            </div>
            <div className="form-actions">
                <button className="btn-primary" disabled={status === 'loading'}>
                    {copy.submit}
                </button>
                {message && <span className="muted">{message}</span>}
            </div>
        </form>
    );
}

function ClientMissionList() {
    const { apiToken } = useAuth();
    const { userRole, t, locale } = useApp();
    const copy = t('clientMissionList', translations.fr.clientMissionList);
    const navigate = useNavigate();
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusPreset, setStatusPreset] = useState('active');
    const [progressFilters, setProgressFilters] = useState([]);
    const debouncedSearch = useDebouncedValue(search, 400);

    const statusMap = {
        active: ['published', 'accepted', 'in_progress'],
        completed: ['completed'],
        cancelled: ['cancelled'],
    };
    const selectedStatuses = statusMap[statusPreset] ?? [];

    const fetchMissions = useCallback(async () => {
        if (!apiToken || userRole !== 'client') return;
        setLoading(true);
        setError('');
        try {
            const params = {
                limit: 100,
                status: selectedStatuses.length ? selectedStatuses.join(',') : undefined,
                progress: progressFilters.length ? progressFilters.join(',') : undefined,
                search: debouncedSearch || undefined,
            };
            const { data } = await axios.get('/api/missions', { params });
            setMissions(data.data ?? []);
        } catch (err) {
            setError(copy.error);
        } finally {
            setLoading(false);
        }
    }, [apiToken, userRole, selectedStatuses, progressFilters, debouncedSearch, copy.error, t]);

    useEffect(() => {
        fetchMissions();
    }, [fetchMissions]);

    if (!apiToken) {
        return (
            <section className="app-shell">
                <p className="alert">{copy.alerts.auth}</p>
                <button className="btn-primary" onClick={() => navigate('/connexion')}>
                    {t('general.connect')}
                </button>
            </section>
        );
    }

    if (userRole !== 'client') {
        return (
            <section className="app-shell">
                <p className="alert">{copy.alerts.role}</p>
                <button className="btn-primary" onClick={() => navigate('/role-choice')}>
                    {t('landing.ctas.role')}
                </button>
            </section>
        );
    }

    const progressOptions = ['pending', 'en_route', 'arrived', 'queueing', 'done'];

    return (
        <DashboardShell title={copy.title} subtitle={copy.subtitle}>
            <div className="mission-toolbar">
                <div className="pill-group">
                    {[
                        { key: 'active', label: copy.tabs.active },
                        { key: 'completed', label: copy.tabs.completed },
                        { key: 'cancelled', label: copy.tabs.cancelled },
                    ].map(option => (
                        <button
                            key={option.key}
                            type="button"
                            className={`pill ${statusPreset === option.key ? 'pill--active' : ''}`}
                            onClick={() => setStatusPreset(option.key)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <input
                    type="search"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder={copy.searchPlaceholder}
                />
            </div>
            <div className="mission-toolbar">
                <p className="muted">{copy.progressLabel}</p>
                <div className="pill-group">
                    {progressOptions.map(option => (
                        <button
                            key={option}
                            type="button"
                            className={`pill ${progressFilters.includes(option) ? 'pill--active' : ''}`}
                            onClick={() =>
                                setProgressFilters(current =>
                                    current.includes(option)
                                        ? current.filter(item => item !== option)
                                        : [...current, option],
                                )
                            }
                        >
                            {progressLabel(option, t)}
                        </button>
                    ))}
                    <button type="button" className="pill" onClick={() => setProgressFilters([])}>
                        {copy.reset}
                    </button>
                </div>
            </div>
            {error && <p className="alert">{error}</p>}
            {loading ? (
                <p className="muted">{t('general.loading')}</p>
            ) : missions.length === 0 ? (
                <p className="muted">{copy.empty}</p>
            ) : (
                <div className="mission-list">
                    {missions.map(mission => (
                        <article key={mission.id} className="mission-card">
                            <header>
                                <div>
                                    <h3>{mission.title}</h3>
                                    <p>{mission.location?.label ?? copy.locationFallback}</p>
                                </div>
                                <span className={`status ${mission.status}`}>{statusLabel(mission.status, t)}</span>
                            </header>
                            <div className="mission-meta">
                                <span>{formatDateTime(mission.scheduledAt, locale)}</span>
                                <span>{formatCurrency(mission.budgetCents, mission.currency, locale)}</span>
                                <span>
                                    {mission.applicationsCount ?? 0} {copy.candidates}
                                </span>
                            </div>
                            <MissionTimeline compact mission={mission} />
                            <footer>
                                <Link to={`/client/missions/${mission.id}`} className="btn-link">
                                    {copy.timelineLink}
                                </Link>
                                <button type="button" className="btn-ghost" onClick={() => navigate(`/client/missions/${mission.id}`)}>
                                    {copy.detailsButton}
                                </button>
                            </footer>
                        </article>
                    ))}
                </div>
            )}
        </DashboardShell>
    );
}

function MissionDetail({ role = 'client' }) {
    const { missionId } = useParams();
    const { apiToken } = useAuth();
    const { t, locale } = useApp();
    const copy = t('missionDetail', translations.fr.missionDetail);
    const navigate = useNavigate();
    const [mission, setMission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!missionId || !apiToken) return;
        let active = true;
        async function load() {
            setLoading(true);
            setError('');
            try {
                const { data } = await axios.get(`/api/missions/${missionId}`);
                if (!active) return;
                setMission(data.data ?? null);
            } catch (err) {
                if (!active) return;
                setError(copy.messageError);
            } finally {
                if (active) setLoading(false);
            }
        }
        load();
        return () => {
            active = false;
        };
    }, [missionId, apiToken]);

    if (!apiToken) {
        return (
            <section className="app-shell">
                <p className="alert">{copy.authAlert}</p>
                <button className="btn-primary" onClick={() => navigate('/connexion')}>
                    {t('general.connect')}
                </button>
            </section>
        );
    }

    return (
        <DashboardShell title={copy.title} subtitle={copy.subtitle}>
            <button className="btn-ghost" onClick={() => navigate(-1)}>
                {copy.back}
            </button>
            {loading ? (
                <p className="muted">{t('general.loading')}</p>
            ) : error ? (
                <p className="alert">{error}</p>
            ) : mission ? (
                <div className="mission-detail">
                    <header>
                        <div>
                            <p className="muted">Mission #{mission.id}</p>
                            <h2>{mission.title}</h2>
                        </div>
                        <div className="status-stack">
                            <span className={`status ${mission.status}`}>{statusLabel(mission.status, t)}</span>
                            <span className={`status ghost ${mission.progressStatus}`}>{progressLabel(mission.progressStatus, t)}</span>
                        </div>
                    </header>
                    <div className="mission-meta-grid">
                        <article>
                            <p className="muted">{copy.labels.client}</p>
                            <strong>{mission.client?.name ?? '—'}</strong>
                        </article>
                        <article>
                            <p className="muted">{copy.labels.liner}</p>
                            <strong>{mission.liner?.name ?? t('status.generic.notAssigned', copy.linerFallback)}</strong>
                        </article>
                        <article>
                            <p className="muted">{copy.labels.budget}</p>
                            <strong>{formatCurrency(mission.budgetCents, mission.currency, locale)}</strong>
                        </article>
                        <article>
                            <p className="muted">{copy.labels.duration}</p>
                            <strong>{mission.durationMinutes ? `${mission.durationMinutes} min` : copy.durationFallback}</strong>
                        </article>
                    </div>
                    <MissionTimeline mission={mission} />
                    {role === 'client' && (
                        <MissionActions mission={mission} onUpdated={setMission} />
                    )}
                    <section className="mission-description">
                        <h3>{copy.descriptionTitle}</h3>
                        <p>{mission.description || copy.descriptionEmpty}</p>
                    </section>
                    <ChatPanel role={role} missionId={mission.id} />
                </div>
            ) : null}
        </DashboardShell>
    );
}

function WalletPanel({ role = 'client' }) {
    const { apiToken } = useAuth();
    const { userRole, t, locale } = useApp();
    const copy = t('wallet', translations.fr.wallet);
    const navigate = useNavigate();
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const endpoint = role === 'liner' ? '/api/liner/wallet' : '/api/client/wallet';

    const load = useCallback(async () => {
        if (!apiToken || userRole !== role) return;
        setLoading(true);
        try {
            const { data } = await axios.get(endpoint);
            setWallet(data.wallet ?? data.data?.wallet ?? null);
            setTransactions(data.transactions ?? data.data?.transactions ?? []);
        } finally {
            setLoading(false);
        }
    }, [apiToken, endpoint, role, userRole]);

    useEffect(() => {
        load();
    }, [load]);

    if (!apiToken) {
        return (
            <section className="app-shell">
                <p className="alert">{copy.alerts.auth}</p>
                <button className="btn-primary" onClick={() => navigate('/connexion')}>
                    {t('general.connect')}
                </button>
            </section>
        );
    }

    if (userRole !== role) {
        return (
            <section className="app-shell">
                <p className="alert">{formatTemplate(copy.alerts.role, { role })}</p>
            </section>
        );
    }

    return (
        <DashboardShell title={role === 'liner' ? copy.titles.liner : copy.titles.client} subtitle={copy.subtitle}>
            {loading || !wallet ? (
                <p className="muted">{t('general.loading')}</p>
            ) : (
                <>
                    <div className="wallet-cards">
                        <article>
                            <p className="muted">{copy.cards.balance}</p>
                            <strong>{formatCurrency(wallet.balance_cents ?? wallet.balanceCents, wallet.currency, locale)}</strong>
                        </article>
                        <article>
                            <p className="muted">{copy.cards.pending}</p>
                            <strong>{formatCurrency(wallet.pending_cents ?? wallet.pendingCents, wallet.currency, locale)}</strong>
                        </article>
                        <article>
                            <p className="muted">{copy.cards.updated}</p>
                            <strong>{formatDateTime(wallet.updated_at ?? wallet.updatedAt, locale)}</strong>
                        </article>
                    </div>
                    <h3>{copy.movementsTitle}</h3>
                    {transactions.length === 0 ? (
                        <p className="muted">{copy.movementsEmpty}</p>
                    ) : (
                        <ul className="wallet-list">
                            {transactions.map(tx => (
                                <li key={tx.id}>
                                    <div>
                                        <strong>{tx.description ?? tx.counterparty ?? copy.transactionFallback}</strong>
                                        <span>{formatDateTime(tx.createdAt, locale)}</span>
                                    </div>
                                    <div className={`amount ${tx.type}`}>
                                        {tx.type === 'credit' ? '+' : '-'}
                                        {formatCurrency(tx.amountCents, tx.currency, locale)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </DashboardShell>
    );
}

function LinerOnboarding() {
    const navigate = useNavigate();
    const { t } = useApp();
    const copy = t('linerOnboarding', translations.fr.linerOnboarding);
    return (
        <section className="app-shell">
            <header className="app-shell__header">
                <p>{copy.title}</p>
                <h2>{copy.subtitle}</h2>
            </header>
            <ol className="steps">
                {copy.steps.map(step => (
                    <li key={step.title}>
                        <strong>{step.title}</strong>
                        <span>{step.description}</span>
                    </li>
                ))}
            </ol>
            <div className="form-actions">
                <button className="btn-primary" onClick={() => navigate('/liner/home')}>
                    {copy.buttons.dashboard}
                </button>
                <button className="btn-ghost" onClick={() => navigate('/role-choice')}>
                    {copy.buttons.back}
                </button>
            </div>
        </section>
    );
}

function LinerDashboard() {
    const { t } = useApp();
    const copy = t('linerDashboard', translations.fr.linerDashboard);
    return (
        <DashboardShell title={copy.title} subtitle={copy.subtitle}>
            <div className="form-actions">
                <Link className="btn-primary" to="/liner/missions">
                    {copy.buttons.missions}
                </Link>
                <Link className="btn-ghost" to="/liner/kyc">
                    {copy.buttons.kyc}
                </Link>
                <Link className="btn-ghost" to="/liner/tutorial">
                    {copy.buttons.tutorial}
                </Link>
                <Link className="btn-ghost" to="/liner/wallet">
                    {copy.buttons.wallet}
                </Link>
            </div>
            <ChatPanel role="liner" />
        </DashboardShell>
    );
}

function LinerMissions() {
    const { apiToken } = useAuth();
    const { userRole, t } = useApp();
    const copy = t('linerMissions', translations.fr.linerMissions);
    const navigate = useNavigate();
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusPreset, setStatusPreset] = useState('open');
    const [progressFilters, setProgressFilters] = useState([]);
    const [assignment, setAssignment] = useState('all');
    const debouncedSearch = useDebouncedValue(search, 400);

    const statusMap = {
        open: ['published'],
        assigned: ['accepted', 'in_progress'],
        completed: ['completed'],
    };
    const selectedStatuses = statusMap[statusPreset] ?? [];

    const fetchMissions = useCallback(async () => {
        if (!apiToken || userRole !== 'liner') return;
        setLoading(true);
        setError('');
        try {
            const params = {
                limit: 100,
                status: selectedStatuses.length ? selectedStatuses.join(',') : undefined,
                progress: progressFilters.length ? progressFilters.join(',') : undefined,
                assigned: assignment,
                search: debouncedSearch || undefined,
            };
            const { data } = await axios.get('/api/liner/missions', { params });
            setMissions(data.data ?? []);
        } catch (err) {
            setError(copy.error);
        } finally {
            setLoading(false);
        }
    }, [apiToken, userRole, selectedStatuses, progressFilters, assignment, debouncedSearch, copy.error]);

    useEffect(() => {
        fetchMissions();
    }, [fetchMissions]);

    if (!apiToken) {
        return (
            <section className="app-shell">
                <p className="alert">{copy.alerts.auth}</p>
                <button className="btn-primary" onClick={() => navigate('/connexion')}>
                    {t('general.connect')}
                </button>
            </section>
        );
    }

    if (userRole !== 'liner') {
        return (
            <section className="app-shell">
                <p className="alert">{copy.alerts.role}</p>
            </section>
        );
    }

    return (
        <DashboardShell title={copy.title} subtitle={copy.subtitle}>
            <div className="mission-toolbar">
                <div className="pill-group">
                    {['open', 'assigned', 'completed'].map(key => (
                        <button
                            key={key}
                            type="button"
                            className={`pill ${statusPreset === key ? 'pill--active' : ''}`}
                            onClick={() => setStatusPreset(key)}
                        >
                            {copy.tabs?.[key] ?? key}
                        </button>
                    ))}
                </div>
                <input
                    type="search"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder={copy.searchPlaceholder}
                />
            </div>
            <div className="mission-toolbar">
                <div className="pill-group">
                    {['pending', 'en_route', 'arrived', 'queueing', 'done'].map(option => (
                        <button
                            key={option}
                            type="button"
                            className={`pill ${progressFilters.includes(option) ? 'pill--active' : ''}`}
                            onClick={() =>
                                setProgressFilters(current =>
                                    current.includes(option)
                                        ? current.filter(item => item !== option)
                                        : [...current, option],
                                )
                            }
                        >
                            {progressLabel(option, t)}
                        </button>
                    ))}
                    <button type="button" className="pill" onClick={() => setProgressFilters([])}>
                        {copy.reset}
                    </button>
                </div>
                <div className="pill-group">
                    {Object.entries(copy.filters).map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            className={`pill ${assignment === key ? 'pill--active' : ''}`}
                            onClick={() => setAssignment(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            {error && <p className="alert">{error}</p>}
            {loading ? (
                <p className="muted">{t('general.loading')}</p>
            ) : missions.length === 0 ? (
                <p className="muted">{copy.empty}</p>
            ) : (
                <div className="mission-list">
                    {missions.map(mission => (
                        <article key={mission.id} className="mission-card">
                            <header>
                                <div>
                                    <h3>{mission.title}</h3>
                                    <p>
                                        {mission.client?.name ?? copy.labels.client} — {mission.location?.label ?? copy.locationFallback}
                                    </p>
                                </div>
                                <span className={`status ${mission.status}`}>{statusLabel(mission.status, t)}</span>
                            </header>
                            {mission.progressStatus ? <StatusPill label={progressLabel(mission.progressStatus, t)} variant="ghost" /> : null}
                            <div className="form-actions">
                                <button className="btn-primary" onClick={() => navigate(`/liner/missions/${mission.id}`)}>
                                    {copy.buttons.follow}
                                </button>
                                <button className="btn-ghost" onClick={() => navigate(`/liner/missions/${mission.id}`)}>
                                    {copy.buttons.proof}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </DashboardShell>
    );
}
function KycPanel() {
    const { apiToken } = useAuth();
    const { userRole, t } = useApp();
    const copy = t('kyc', translations.fr.kyc);
    const navigate = useNavigate();
    const [kyc, setKyc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        if (!apiToken || userRole !== 'liner') return;
        setLoading(true);
        try {
            const { data } = await axios.get('/api/liner/kyc');
            setKyc(data.data ?? data);
        } finally {
            setLoading(false);
        }
    }, [apiToken, userRole]);

    useEffect(() => {
        load();
    }, [load]);

    const toggleItem = async (itemId, nextValue) => {
        setSaving(true);
        try {
            const { data } = await axios.patch(`/api/liner/kyc/checklist/${itemId}`, { completed: nextValue });
            setKyc(data.data ?? data);
        } finally {
            setSaving(false);
        }
    };

    const submitForReview = async status => {
        setSaving(true);
        try {
            const { data } = await axios.patch('/api/liner/kyc/submit', { status });
            setKyc(data.data ?? data);
        } finally {
            setSaving(false);
        }
    };

    if (!apiToken || userRole !== 'liner') {
        return (
            <section className="app-shell">
                <p className="alert">{copy.alerts.auth}</p>
                {!apiToken && (
                    <button className="btn-primary" onClick={() => navigate('/connexion')}>
                        {t('general.connect')}
                    </button>
                )}
            </section>
        );
    }

    return (
        <DashboardShell title={copy.title} subtitle={copy.subtitle}>
            {loading || !kyc ? (
                <p className="muted">{t('general.loading')}</p>
            ) : (
                <div className="kyc-panel">
                    <header>
                        <div>
                            <p className="muted">{copy.labels.currentStatus}</p>
                            <strong>{progressLabel(kyc.status, t)}</strong>
                        </div>
                        <span>
                            {formatTemplate(copy.labels.lastUpdate, {
                                value: formatDateTime(kyc.lastSubmitted, undefined, {}, copy.labels.never),
                            })}
                        </span>
                    </header>
                    <ul>
                        {(kyc.checklist ?? []).map(item => (
                            <li key={item.id}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={item.completed}
                                        disabled={saving}
                                        onChange={event => toggleItem(item.id, event.target.checked)}
                                    />
                                    <span>{item.label}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                    <div className="form-actions">
                        <button className="btn-ghost" onClick={() => submitForReview('in_progress')} disabled={saving}>
                            {copy.buttons.save}
                        </button>
                        <button className="btn-primary" onClick={() => submitForReview('review')} disabled={saving}>
                            {copy.buttons.submit}
                        </button>
                    </div>
                </div>
            )}
        </DashboardShell>
    );
}

function TutorialPanel() {
    const { config, t } = useApp();
    const copy = t('tutorial', translations.fr.tutorial);
    const slides = useMemo(() => {
        const fromConfig = config?.linerTutorial?.slides;
        if (Array.isArray(fromConfig) && fromConfig.length) {
            return fromConfig;
        }
        return copy.slides;
    }, [config, copy.slides]);

    const [current, setCurrent] = useState(() => Number(localStorage.getItem('liner_tutorial_index')) || 0);
    const [completed, setCompleted] = useState(() => localStorage.getItem('liner_tutorial_done') === 'true');

    useEffect(() => {
        localStorage.setItem('liner_tutorial_index', String(current));
    }, [current]);

    useEffect(() => {
        if (completed) {
            localStorage.setItem('liner_tutorial_done', 'true');
        }
    }, [completed]);

    const goNext = () => {
        if (current < slides.length - 1) {
            setCurrent(current + 1);
        } else {
            setCompleted(true);
        }
    };

    const reset = () => {
        setCompleted(false);
        setCurrent(0);
        localStorage.removeItem('liner_tutorial_done');
    };

    return (
        <DashboardShell title={copy.title} subtitle={copy.subtitle}>
            <div className="tutorial">
                <header>
                    <p>
                        {formatTemplate(copy.stepLabel, { current: Math.min(current + 1, slides.length), total: slides.length })}
                    </p>
                    <progress value={completed ? slides.length : current + 1} max={slides.length} />
                </header>
                <article>
                    <h3>{completed ? copy.completedTitle : slides[current]?.title}</h3>
                    <p>{completed ? copy.completedDescription : slides[current]?.description}</p>
                </article>
                <div className="form-actions">
                    <button className="btn-ghost" onClick={reset}>
                        {copy.buttons.restart}
                    </button>
                    <button className="btn-primary" onClick={goNext}>
                        {completed ? copy.buttons.goMissions : copy.buttons.next}
                    </button>
                </div>
            </div>
        </DashboardShell>
    );
}

function NotificationsCenter() {
    const { apiToken } = useAuth();
    const { t } = useApp();
    const copy = t('notifications', translations.fr.notifications);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const streamRetryRef = useRef();

    const load = useCallback(async () => {
        if (!apiToken) return;
        setLoading(true);
        setError('');
        try {
            const { data } = await axios.get('/api/notifications');
            setItems(normalizeNotifications(data.data ?? []));
        } catch (err) {
            setError(copy.error);
        } finally {
            setLoading(false);
        }
    }, [apiToken]);

    useEffect(() => {
        load();
        if (!apiToken) return undefined;
        const timer = setInterval(load, 30_000);
        return () => clearInterval(timer);
    }, [apiToken, load]);

    useEffect(() => {
        const supportsStreams = typeof window !== 'undefined' && 'ReadableStream' in window && typeof window.fetch === 'function';
        if (!apiToken || !supportsStreams) return undefined;

        let aborted = false;
        let abortController = null;

        const connect = async () => {
            if (abortController) {
                abortController.abort();
            }
            abortController = new AbortController();

            try {
                const response = await fetch('/api/notifications/stream', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${apiToken}`,
                        Accept: 'text/event-stream',
                    },
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
                            setItems(current => mergeNotifications(current, payload.items));
                            setLoading(false);
                        }
                    });
                }
            } catch (error) {
                if (!aborted) {
                    streamRetryRef.current = setTimeout(connect, 4000);
                }
            }
        };

        connect();

        return () => {
            aborted = true;
            if (abortController) {
                abortController.abort();
            }
            if (streamRetryRef.current) {
                clearTimeout(streamRetryRef.current);
            }
        };
    }, [apiToken]);

    const markRead = async notificationId => {
        try {
            await axios.post(`/api/notifications/${notificationId}/read`);
            setItems(current => current.map(item => (item.id === notificationId ? { ...item, readAt: new Date().toISOString() } : item)));
        } catch (err) {
            setError(copy.markError);
        }
    };

    const markAll = async () => {
        try {
            await axios.post('/api/notifications/read-all');
            setItems(current => current.map(item => ({ ...item, readAt: new Date().toISOString() })));
        } catch (err) {
            setError(copy.markError);
        }
    };

    return (
        <DashboardShell title={copy.title} subtitle={copy.subtitle}>
            {!apiToken ? (
                <p className="alert">{copy.alertAuth}</p>
            ) : (
                <div className="notifications">
                    <div className="notifications__actions">
                        <button className="btn-ghost" onClick={load}>
                            {copy.actions.refresh}
                        </button>
                        <button className="btn-primary" onClick={markAll}>
                            {copy.actions.markAll}
                        </button>
                    </div>
                    {error && <p className="alert">{error}</p>}
                    {loading ? (
                        <p className="muted">{t('general.loading')}</p>
                    ) : items.length === 0 ? (
                        <p className="muted">{copy.empty}</p>
                    ) : (
                        <ul>
                            {items.map(item => (
                                <li key={item.id} className={item.readAt ? '' : 'notifications__item--unread'}>
                                    <div>
                                        <p>{item.title}</p>
                                        <span>{item.message}</span>
                                    </div>
                                    <div>
                                        <time>{formatDateTime(item.createdAt)}</time>
                                        {!item.readAt && (
                                            <button type="button" onClick={() => markRead(item.id)}>
                                                {copy.actions.markRead}
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </DashboardShell>
    );
}

function ChatPanel({ role = 'client', missionId: initialMissionId }) {
    const { apiToken } = useAuth();
    const { t } = useApp();
    const copy = t('chat', translations.fr.chat);
    const [missionId, setMissionId] = useState(initialMissionId ? String(initialMissionId) : '');
    const [messages, setMessages] = useState([]);
    const [body, setBody] = useState('');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (initialMissionId) {
            setMissionId(String(initialMissionId));
        }
    }, [initialMissionId]);

    useEffect(() => {
        if (!missionId) return;
        const cacheKey = `chat:${role}:${missionId}`;
        let active = true;
        idbGet(cacheKey).then(cached => {
            if (cached && active) {
                setMessages(cached);
            }
        });
        return () => {
            active = false;
        };
    }, [missionId, role]);

    const fetchMessages = useCallback(async () => {
        if (!missionId || !apiToken) return;
        setLoading(true);
        const cacheKey = `chat:${role}:${missionId}`;
        try {
            const path = role === 'liner' ? `/api/liner/missions/${missionId}/chat` : `/api/missions/${missionId}/chat`;
            const { data } = await axios.get(path);
            setMessages(data.data ?? []);
            await idbSet(cacheKey, data.data ?? []);
        } finally {
            setLoading(false);
        }
    }, [apiToken, missionId, role]);

    const handleSend = async event => {
        event.preventDefault();
        if (!missionId) return;
        setSending(true);
        try {
            const formData = new FormData();
            if (body.trim()) {
                formData.append('body', body.trim());
            }
            files.forEach(file => formData.append('attachments[]', file));
            const path = role === 'liner' ? `/api/liner/missions/${missionId}/chat` : `/api/missions/${missionId}/chat`;
            const cacheKey = `chat:${role}:${missionId}`;
            const { data } = await axios.post(path, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setBody('');
            setFiles([]);
            setMessages(current => {
                const next = [...current, data.data];
                idbSet(cacheKey, next);
                return next;
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <section className="chat-panel">
            <header>
                <div>
                    <p className="muted">{copy.title}</p>
                    <strong>{role === 'liner' ? copy.roleLabel.liner : copy.roleLabel.client}</strong>
                </div>
                <div>
                    <input
                        value={missionId}
                        onChange={event => setMissionId(event.target.value)}
                        placeholder={copy.missionPlaceholder}
                    />
                    <button type="button" className="btn-ghost" onClick={fetchMessages} disabled={!missionId || loading}>
                        {t('general.refresh')}
                    </button>
                </div>
            </header>
            {loading ? (
                <p className="muted">{t('general.loading')}</p>
            ) : messages.length === 0 ? (
                <p className="muted">{copy.empty}</p>
            ) : (
                <div className="chat-log">
                    {messages.map(message => (
                        <MessageBubble key={message.id} message={message} selfRole={role} />
                    ))}
                </div>
            )}
            <form className="chat-composer" onSubmit={handleSend}>
                <textarea value={body} onChange={event => setBody(event.target.value)} placeholder={copy.messagePlaceholder} rows={2} />
                <input type="file" multiple onChange={event => setFiles([...event.target.files])} />
                <button className="btn-primary" disabled={sending || (!body.trim() && files.length === 0)}>
                    {copy.buttons.send}
                </button>
            </form>
        </section>
    );
}

function MessageBubble({ message, selfRole }) {
    const { t } = useApp();
    const isSelf = message.role === selfRole;
    return (
        <article className={`bubble ${isSelf ? 'bubble--self' : ''}`}>
            <header>
                <strong>{message.user?.name ?? message.role}</strong>
                <span>{formatDateTime(message.createdAt)}</span>
            </header>
            {message.body && <p>{message.body}</p>}
            {Array.isArray(message.attachments) && message.attachments.length > 0 && (
                <div className="bubble-attachments">
                    {message.attachments.map(file => (
                        <a key={file.id ?? file.url} href={file.url} target="_blank" rel="noreferrer">
                            {file.type === 'image' ? '📷' : '📎'} {file.name ?? t('chat.attachments.file')}
                        </a>
                    ))}
                </div>
            )}
        </article>
    );
}

function MissionTimeline({ mission, compact = false }) {
    const { t } = useApp();
    if (!mission) return null;
    const steps = buildTimeline(mission, t);
    return (
        <ol className={`timeline ${compact ? 'timeline--compact' : ''}`}>
            {steps.map(step => (
                <li key={step.id} className={step.state}>
                    <div>
                        <p>{step.label}</p>
                        <span>{step.description}</span>
                    </div>
                    <small>{step.timestamp}</small>
                </li>
            ))}
        </ol>
    );
}

function DashboardShell({ title, subtitle, children }) {
    return (
        <section className="app-shell">
            <header className="app-shell__header">
                <p>{subtitle}</p>
                <h2>{title}</h2>
            </header>
            <div className="app-shell__body">{children}</div>
        </section>
    );
}

function LanguageToggle() {
    const { locale, setLocale, t } = useApp();
    return (
        <button
            type="button"
            className="language-toggle"
            onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
            aria-label="Toggle language"
        >
            {t('general.localeToggle')}
        </button>
    );
}

function useApp() {
    return useContext(AppContext);
}

function formatCurrency(cents, currency = 'EUR', locale = 'fr-FR') {
    if (typeof cents !== 'number') return '—';
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

function formatDateTime(value, locale = 'fr-FR', options = {}, fallback = '—') {
    if (!value) return fallback;
    try {
        return new Date(value).toLocaleString(locale, {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            ...options,
        });
    } catch (error) {
        return value ?? fallback;
    }
}

function normalizeNotifications(list = []) {
    return [...list].sort((a, b) => {
        const dateA = new Date(a.createdAt ?? a.created_at ?? 0).getTime();
        const dateB = new Date(b.createdAt ?? b.created_at ?? 0).getTime();
        return dateB - dateA;
    });
}

function mergeNotifications(current, incoming) {
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
                // ignore malformed payload
            }
        }
    }
    return remaining;
}

function statusLabel(status, t = () => {}) {
    const labels = t('status.mission', translations.fr.status.mission) ?? {};
    return labels[status] ?? status;
}

function progressLabel(status, t = () => {}) {
    const labels = t('status.progress', translations.fr.status.progress) ?? {};
    return labels[status] ?? status;
}

function buildTimeline(mission, t) {
    const stepsCopy = t('timeline.steps', translations.fr.timeline.steps);
    return [
        {
            id: 'published',
            label: stepsCopy.published.label,
            description: stepsCopy.published.description,
            state: 'completed',
            timestamp: formatDateTime(mission.publishedAt),
        },
        {
            id: 'assigned',
            label: mission.liner ? stepsCopy.assigned.assigned : stepsCopy.assigned.searching,
            description: mission.liner ? mission.liner.name : stepsCopy.assigned.descriptionAssigned,
            state: mission.liner ? 'completed' : 'pending',
            timestamp: mission.liner ? formatDateTime(mission.publishedAt) : '',
        },
        {
            id: 'en_route',
            label: stepsCopy.enRoute.label,
            description: stepsCopy.enRoute.description,
            state: ['en_route', 'arrived', 'queueing', 'done'].includes(mission.progressStatus) ? 'completed' : 'upcoming',
            timestamp: ['en_route', 'arrived', 'queueing', 'done'].includes(mission.progressStatus)
                ? formatDateTime(mission.updatedAt ?? mission.completedAt)
                : '',
        },
        {
            id: 'queue',
            label: stepsCopy.queue.label,
            description: stepsCopy.queue.description,
            state: ['arrived', 'queueing', 'done'].includes(mission.progressStatus) ? 'completed' : 'upcoming',
            timestamp: ['arrived', 'queueing', 'done'].includes(mission.progressStatus)
                ? formatDateTime(mission.completedAt)
                : '',
        },
        {
            id: 'done',
            label: stepsCopy.done.label,
            description: mission.clientFeedback ?? stepsCopy.done.descriptionFallback,
            state: mission.progressStatus === 'done' || mission.status === 'completed' ? 'completed' : 'upcoming',
            timestamp: mission.completedAt ? formatDateTime(mission.completedAt) : '',
        },
    ];
}

function useDebouncedValue(value, delay = 300) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}
function MissionActions({ mission, onUpdated }) {
    const [busyKey, setBusyKey] = useState('');
    const [qrToken, setQrToken] = useState('');
    const [rating, setRating] = useState(5);
    const [feedback, setFeedback] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const { config, t } = useApp();
    const copy = t('missionActions', translations.fr.missionActions);
    const buttonContainerRef = useRef(null);
    const paymentRequestDataRef = useRef(null);
    const [paymentRequestReady, setPaymentRequestReady] = useState(false);
    const [paymentRequestMessage, setPaymentRequestMessage] = useState('');

    const refreshMission = useCallback(async () => {
        if (!mission?.id) return;
        try {
            const { data } = await axios.get(`/api/missions/${mission.id}`);
            onUpdated?.(data.data ?? data);
        } catch (error) {
            console.warn('Mission refresh failed', error);
        }
    }, [mission?.id, onUpdated]);

    const callEndpoint = async (key, request) => {
        setBusyKey(key);
        setStatusMessage('');
        try {
            const { data } = await request();
            onUpdated?.(data.data ?? data);
            setStatusMessage(copy.statusSuccess);
            if (key === 'verify') {
                setQrToken('');
            }
            if (key === 'review') {
                setFeedback('');
            }
        } catch (error) {
            setStatusMessage(copy.statusError);
        } finally {
            setBusyKey('');
        }
    };

    const canAuthorizePayment =
        mission?.status === 'accepted' && (mission?.paymentStatus === 'pending' || mission?.paymentStatus === 'authorized');
    const canVerifyQr = mission?.liner && mission?.status !== 'cancelled' && mission?.status !== 'completed';
    const canReview = mission?.status === 'completed' && !mission?.clientRatedAt;
    const canPaymentRequest =
        Boolean(config?.stripe?.publishableKey && mission?.budgetCents) &&
        mission?.status !== 'completed' &&
        mission?.status !== 'cancelled';

    useEffect(() => {
        let mounted = true;
        let buttonElement;

        const initializePaymentRequest = async () => {
            setPaymentRequestReady(false);
            setPaymentRequestMessage('');

            if (
                !canPaymentRequest ||
                typeof window === 'undefined' ||
                typeof window.PaymentRequest === 'undefined'
            ) {
                if (canPaymentRequest) {
                    setPaymentRequestMessage(copy.applePayUnavailable);
                }
                return;
            }

            try {
                const stripe = await loadStripe(config.stripe.publishableKey);
                if (!stripe || !mounted) {
                    setPaymentRequestMessage(copy.stripeError);
                    return;
                }

                const paymentRequest = stripe.paymentRequest({
                    country: 'FR',
                    currency: (mission.currency ?? 'EUR').toLowerCase(),
                    total: {
                        label: mission.title ?? copy.paymentLabel,
                        amount: mission.budgetCents ?? 0,
                    },
                });

                const result = await paymentRequest.canMakePayment();
                if (!result) {
                    setPaymentRequestMessage(copy.paymentUnavailableShort);
                    return;
                }

                const handler = async ev => {
                    try {
                        const { data } = await axios.post('/api/payments/stripe/payment-intent', { missionId: mission.id });
                        const payload = data?.data ?? data;
                        const clientSecret = payload?.clientSecret;
                        if (!clientSecret) {
                            throw new Error(copy.paymentSecretMissing);
                        }

                        const { error, paymentIntent } = await stripe.confirmCardPayment(
                            clientSecret,
                            { payment_method: ev.paymentMethod.id },
                            { handleActions: false },
                        );

                        if (error) {
                            ev.complete('fail');
                            setStatusMessage(error.message ?? copy.paymentError);
                            return;
                        }

                        ev.complete('success');

                        if (paymentIntent?.status === 'requires_action') {
                            const { error: actionError } = await stripe.confirmCardPayment(clientSecret);
                            if (actionError) {
                                setStatusMessage(actionError.message ?? copy.statusError);
                                return;
                            }
                        }

                        setStatusMessage(copy.paymentConfirm);
                        await refreshMission();
                    } catch (error) {
                        ev.complete('fail');
                        setStatusMessage(copy.paymentError);
                    }
                };

                paymentRequest.on('paymentmethod', handler);
                paymentRequestDataRef.current = { paymentRequest, handler };

                const elements = stripe.elements();
                buttonElement = elements.create('paymentRequestButton', {
                    paymentRequest,
                    style: { paymentRequestButton: { theme: 'light-outline', height: '44px' } },
                });

                if (buttonContainerRef.current) {
                    buttonElement.mount(buttonContainerRef.current);
                    setPaymentRequestReady(true);
                }
            } catch (error) {
                setPaymentRequestMessage(copy.stripeError);
            }
        };

        initializePaymentRequest();

        return () => {
            mounted = false;
            if (paymentRequestDataRef.current) {
                paymentRequestDataRef.current.paymentRequest.off('paymentmethod', paymentRequestDataRef.current.handler);
                paymentRequestDataRef.current = null;
            }
            if (buttonElement) {
                buttonElement.destroy();
            }
            setPaymentRequestReady(false);
        };
    }, [canPaymentRequest, config?.stripe?.publishableKey, mission?.budgetCents, mission?.currency, mission?.id, refreshMission]);

    if (!canAuthorizePayment && !canVerifyQr && !canReview && !canPaymentRequest) {
        return null;
    }

    return (
        <section className="mission-actions">
            <h3>{copy.title}</h3>
            <p className="muted">{copy.subtitle}</p>
            <div className="mission-actions__grid">
                {canAuthorizePayment && (
                    <button
                        className="btn-primary"
                        disabled={busyKey === 'authorize'}
                        onClick={() =>
                            callEndpoint('authorize', () => axios.post(`/api/missions/${mission.id}/authorize-payment`))
                        }
                    >
                        {busyKey === 'authorize' ? copy.authorizing : copy.authorize}
                    </button>
                )}
                {canPaymentRequest && (
                    <div className="mission-actions__card">
                        <p>{copy.payWithWallet}</p>
                        <div className="payment-request-button" ref={buttonContainerRef} />
                        {!paymentRequestReady && (
                            <p className="muted">{copy.paymentUnavailable}</p>
                        )}
                    </div>
                )}
                {canVerifyQr && (
                    <div className="mission-actions__card">
                        <label>
                            {copy.qrLabel}
                            <input
                                value={qrToken}
                                onChange={event => setQrToken(event.target.value)}
                                placeholder={copy.qrPlaceholder}
                            />
                        </label>
                        <button
                            className="btn-primary"
                            disabled={!qrToken || busyKey === 'verify'}
                            onClick={() =>
                                callEndpoint('verify', () => axios.post(`/api/missions/${mission.id}/verify-qr`, { token: qrToken }))
                            }
                        >
                            {busyKey === 'verify' ? copy.verifying : copy.verify}
                        </button>
                    </div>
                )}
                {canReview && (
                    <div className="mission-actions__card mission-actions__card--full">
                        <p>{copy.reviewTitle}</p>
                        <label>
                            {copy.ratingLabel}
                            <select value={rating} onChange={event => setRating(Number(event.target.value))}>
                                {[5, 4, 3, 2, 1].map(value => (
                                    <option key={value} value={value}>
                                        {value} / 5
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            {copy.reviewPlaceholder}
                            <textarea value={feedback} rows={3} onChange={event => setFeedback(event.target.value)} />
                        </label>
                        <button
                            className="btn-primary"
                            disabled={busyKey === 'review'}
                            onClick={() =>
                                callEndpoint('review', () =>
                                    axios.post(`/api/missions/${mission.id}/review`, {
                                        rating: Number(rating),
                                        feedback: feedback || null,
                                    }),
                                )
                            }
                        >
                            {busyKey === 'review' ? copy.reviewBusy : copy.submitReview}
                        </button>
                    </div>
                )}
            </div>
            {statusMessage && <p className="muted">{statusMessage}</p>}
            {paymentRequestMessage && <p className="muted">{paymentRequestMessage}</p>}
        </section>
    );
}
