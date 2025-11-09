import { useEffect, useMemo, useState, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

const LOGO = '/assets/images/IMG_0065.PNG';
const FOOTER_LOGO = '/assets/images/IMG_0571.PNG';
const APP_STORE = '/assets/images/App store 2.png';
const PLAY_STORE = '/assets/images/Google play 2.png';

const PROCESS_STEPS = [
    {
        title: '1. Publiez votre mission',
        description: 'Brief express, budget, créneaux et préférences liner en 60 secondes.',
    },
    {
        title: '2. Match en direct',
        description: 'Les liners vérifiés reçoivent la mission, vous voyez les confirmations en temps réel.',
    },
    {
        title: '3. Preuves & paiement',
        description: 'Photos, QR et preuves d’attente sont poussés dans l’app avant capture du paiement.',
    },
];

const PSP_PROVIDERS = [
    { name: 'Stripe', status: 'Opérationnel' },
    { name: 'PayPal', status: 'Opérationnel' },
    { name: 'Adyen', status: 'Stand-by' },
    { name: 'Apple Pay', status: 'Test lab' },
    { name: 'Google Pay', status: 'Test lab' },
];

const FAQ = [
    {
        q: 'Qui sont les liners ?',
        a: 'Des profils vérifiés (KYC + casier) disponibles 7j/7 pour prendre votre place en file quelle que soit la mission.',
    },
    {
        q: 'Comment sont protégés les paiements ?',
        a: 'Autorisation Stripe/PayPal à la prise de mission, capture seulement après preuve validée. Les liners sont payés via compte ségrégué.',
    },
    {
        q: 'Puis-je suivre mon liner ?',
        a: 'Oui, statuts live, chat, notifications push et timeline d’attente sont intégrés dans l’app web et mobile.',
    },
];

function usePwaInstallPrompt() {
    const [promptEvent, setPromptEvent] = useState(null);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handlePrompt = event => {
            event.preventDefault();
            setPromptEvent(event);
        };

        const handleInstalled = () => {
            setInstalled(true);
            setPromptEvent(null);
        };

        window.addEventListener('beforeinstallprompt', handlePrompt);
        window.addEventListener('appinstalled', handleInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handlePrompt);
            window.removeEventListener('appinstalled', handleInstalled);
        };
    }, []);

    const install = useCallback(async () => {
        if (!promptEvent) return false;
        await promptEvent.prompt();
        const outcome = await promptEvent.userChoice;
        if (outcome?.outcome === 'accepted') {
            setPromptEvent(null);
            setInstalled(true);
            return true;
        }
        return false;
    }, [promptEvent]);

    return {
        canInstall: Boolean(promptEvent) && !installed,
        install,
    };
}

export default function LandingApp({ data }) {
    const hero = data.hero ?? {};
    const highlights = data.highlights ?? [];
    const metrics = data.metrics ?? [];
    const timeline = data.timeline ?? [];
    const support = data.support ?? {};
    const links = data.links ?? {};
    const user = data.user ?? null;

    const heroLines = useMemo(() => {
        return (hero.title || '')
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);
    }, [hero.title]);

    const location = useLocation();
    const navigate = useNavigate();
    const { canInstall, install } = usePwaInstallPrompt();

    useEffect(() => {
        if (location.state?.scrollTo && location.pathname === '/') {
            const target = document.getElementById(location.state.scrollTo);
            if (target) {
                requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
            }
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location, navigate]);

    return (
        <div className="landing-shell">
            <Header links={links} user={user} canInstallPwa={canInstall} onInstallPwa={install} />
            <main>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <HomePage
                                hero={hero}
                                heroLines={heroLines}
                                metrics={metrics}
                                timeline={timeline}
                                highlights={highlights}
                                support={support}
                                links={links}
                                canInstallPwa={canInstall}
                                onInstallPwa={install}
                            />
                        }
                    />
                    <Route path="/connexion" element={<AuthPage links={links} />} />
                    <Route path="/creer-mission" element={<MissionBuilderPage links={links} />} />
                    <Route path="/bonjour-lineup" element={<BonjourPage links={links} user={user} />} />
                </Routes>
            </main>
            <Footer />
        </div>
    );
}

function Header({ links, user, canInstallPwa, onInstallPwa }) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleSectionNav = sectionId => {
        if (location.pathname !== '/') {
            navigate('/', { state: { scrollTo: sectionId } });
            return;
        }
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <header className="landing-nav">
            <div className="landing-nav__brand">
                <img src={LOGO} alt="LineUp" />
                <div>
                    <p>LineUp France</p>
                    <span>Files d’attente opérées</span>
                </div>
            </div>
            <nav>
                <button type="button" className="nav-link" onClick={() => handleSectionNav('process')}>
                    Process
                </button>
                <button type="button" className="nav-link" onClick={() => handleSectionNav('experience')}>
                    Expérience
                </button>
                <button type="button" className="nav-link" onClick={() => handleSectionNav('support')}>
                    Support
                </button>
                <button type="button" onClick={() => navigate('/creer-mission')} className="btn-gradient">
                    {heroCtaLabel(links)}
                </button>
                <button
                    type="button"
                    onClick={() => navigate(user ? '/bonjour-lineup' : '/connexion')}
                    className="btn-ghost"
                >
                    {user ? `Bonjour ${user.name.split(' ')[0]}` : 'Se connecter'}
                </button>
                {canInstallPwa && (
                    <button type="button" className="btn-outline" onClick={onInstallPwa}>
                        Installer l’app
                    </button>
                )}
            </nav>
        </header>
    );
}

function heroCtaLabel(links) {
    if (links?.signupLabel) {
        return links.signupLabel;
    }
    return 'Créer une mission';
}

function HomePage({ hero, heroLines, metrics, timeline, highlights, support, links, canInstallPwa, onInstallPwa }) {
    const navigate = useNavigate();
    return (
        <>
            <HeroSection
                hero={hero}
                heroLines={heroLines}
                metrics={metrics}
                timeline={timeline}
                onCreateMission={() => navigate('/creer-mission')}
                onLogin={() => navigate('/connexion')}
                canInstallPwa={canInstallPwa}
                onInstallPwa={onInstallPwa}
            />
            <HighlightsSection highlights={highlights} />
            <ProcessSection />
            <PspSection />
            <ExperienceSection highlights={highlights} />
            <InstallSection links={links} canInstallPwa={canInstallPwa} onInstallPwa={onInstallPwa} />
            <SupportSection support={support} />
            <FaqSection />
        </>
    );
}

function HeroSection({ hero, heroLines, metrics, timeline, onCreateMission, onLogin, canInstallPwa, onInstallPwa }) {
    return (
        <section className="hero">
            <div className="hero__copy">
                <div className="hero__badge">
                    <span></span>
                    {hero.badge}
                </div>
                <div className="hero__title">
                    {heroLines.map(line => (
                        <h1 key={line}>{line}</h1>
                    ))}
                </div>
                <p className="hero__subtitle">{hero.subtitle}</p>
                <div className="hero__cta">
                    <button type="button" className="btn-gradient" onClick={onCreateMission}>
                        {hero.cta || 'Rejoindre LineUp'}
                    </button>
                    <button type="button" className="btn-ghost" onClick={onLogin}>
                        Se connecter
                    </button>
                    {canInstallPwa && (
                        <button type="button" className="btn-outline" onClick={onInstallPwa}>
                            Installer la PWA
                        </button>
                    )}
                </div>
                <p className="hero__tagline">{hero.tagline}</p>
                <div className="hero__metrics">
                    {metrics.map(metric => (
                        <div key={metric.label}>
                            <p>{metric.value}</p>
                            <span>{metric.label}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="hero__panel">
                <div className="mission-card">
                    <div>
                        <p>Mission express · Boulevard Haussmann</p>
                        <strong>Billetterie Adidas</strong>
                    </div>
                    <span>18€ / h</span>
                </div>
                <div className="timeline">
                    {timeline.map(event => (
                        <div key={event.label} className="timeline__item">
                            <div>
                                <strong>{event.label}</strong>
                                <span>{event.status}</span>
                            </div>
                            <time>{event.time}</time>
                        </div>
                    ))}
                </div>
                <div className="live-card">
                    <p>Notifications en direct</p>
                    <strong>Clara suit Samir depuis l’app et valide la preuve d’attente.</strong>
                </div>
            </div>
        </section>
    );
}

function HighlightsSection({ highlights }) {
    const items = highlights.length ? highlights : PROCESS_STEPS;
    return (
        <section className="section" id="experience">
            <header className="section__header">
                <p>Expérience client</p>
                <h2>Une mission claire, des liners pros, une timeline vérifiée.</h2>
            </header>
            <div className="grid grid--3">
                {items.map(item => (
                    <article key={item.title} className="card">
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}

function ProcessSection() {
    return (
        <section className="section" id="process">
            <header className="section__header">
                <p>Process Ops</p>
                <h2>Onboarding express, matching en direct, preuves sécurisées.</h2>
            </header>
            <div className="grid grid--3">
                {PROCESS_STEPS.map(step => (
                    <article key={step.title} className="card card--process">
                        <strong>{step.title}</strong>
                        <p>{step.description}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}

function PspSection() {
    return (
        <section className="section section--psp">
            <header className="section__header">
                <p>Paiements & conformité</p>
                <h2>Prestataires validés, webhooks monitorés, file d’attente sécurisée.</h2>
            </header>
            <div className="psp-grid">
                {PSP_PROVIDERS.map(provider => (
                    <article key={provider.name}>
                        <strong>{provider.name}</strong>
                        <span>{provider.status}</span>
                    </article>
                ))}
            </div>
        </section>
    );
}

function ExperienceSection({ highlights }) {
    const liners = highlights.slice(0, 2);
    return (
        <section className="section">
            <header className="section__header">
                <p>Expérience Liner</p>
                <h2>Les liners suivent un tutoriel concierge et valident leurs missions avec preuves.</h2>
            </header>
            <div className="grid grid--2">
                {liners.map(card => (
                    <article key={card.title} className="card">
                        <strong>{card.title}</strong>
                        <p>{card.description}</p>
                    </article>
                ))}
                <article className="card card--accent">
                    <strong>Support Ops 7/7</strong>
                    <p>Channel Slack + centre Ops pour débloquer toute mission.</p>
                </article>
                <article className="card card--accent">
                    <strong>Timeline vérifiée</strong>
                    <p>QR, selfies contextualisés et notes d’attente directement dans la mission.</p>
                </article>
            </div>
        </section>
    );
}

function InstallSection({ links, canInstallPwa, onInstallPwa }) {
    return (
        <section className="section">
            <header className="section__header">
                <p>Apps & console</p>
                <h2>Installez LineUp sur mobile ou connectez-vous à la console Ops.</h2>
            </header>
            <div className="install">
                <div className="install__stores">
                    <button type="button" onClick={() => window.location.assign(links.appStore || '#')}>
                        <img src={APP_STORE} alt="App Store" />
                    </button>
                    <button type="button" onClick={() => window.location.assign(links.playStore || '#')}>
                        <img src={PLAY_STORE} alt="Google Play" />
                    </button>
                </div>
                <button type="button" className="btn-gradient" onClick={() => window.location.assign(links.ops || '#')}>
                    {links.opsLabel || 'Console Ops'}
                </button>
                {canInstallPwa ? (
                    <button type="button" className="btn-ghost" onClick={onInstallPwa}>
                        Installer l’app web LineUp
                    </button>
                ) : links.mobileApp ? (
                    <button type="button" className="btn-ghost" onClick={() => window.location.assign(links.mobileApp)}>
                        Ouvrir l’app web
                    </button>
                ) : null}
            </div>
        </section>
    );
}

function SupportSection({ support }) {
    return (
        <section className="section section--support" id="support">
            <header className="section__header">
                <p>Support</p>
                <h2>Une équipe Ops pour sécuriser chaque mission.</h2>
            </header>
            <div className="support-grid">
                <article>
                    <strong>Contact mail</strong>
                    <p>{support.email}</p>
                </article>
                <article>
                    <strong>Ligne directe</strong>
                    <p>{support.phone}</p>
                </article>
                <article>
                    <strong>Disponibilité</strong>
                    <p>{support.availability}</p>
                </article>
            </div>
        </section>
    );
}

function FaqSection() {
    return (
        <section className="section">
            <header className="section__header">
                <p>FAQ</p>
                <h2>Questions fréquentes.</h2>
            </header>
            <div className="faq">
                {FAQ.map(item => (
                    <article key={item.q}>
                        <strong>{item.q}</strong>
                        <p>{item.a}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer className="landing-footer">
            <div>
                <img src={FOOTER_LOGO} alt="LineUp" />
                <p>LineUp — Attendez moins, vivez plus.</p>
            </div>
            <p>© {new Date().getFullYear()} LineUp France. Tous droits réservés.</p>
        </footer>
    );
}

function AuthPage({ links }) {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '', remember: true });
    const [status, setStatus] = useState('idle');

    function handleChange(event) {
        const { name, value, type, checked } = event.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }

    function handleSubmit(event) {
        event.preventDefault();
        if (!form.email || !form.password) {
            setStatus('error');
            return;
        }
        setStatus('submitted');
    }

    return (
        <section className="landing-page">
            <header className="page-hero">
                <p>Espace client & liner</p>
                <h2>Connectez-vous et pilotez vos missions.</h2>
                <p>
                    Email + mot de passe, double vérification facultative puis accès direct à vos missions, paiements et
                    preuves.
                </p>
                <div className="page-actions">
                    <button type="button" className="btn-gradient" onClick={() => window.location.assign(links.login || '#')}>
                        Ouvrir l’espace sécurisé
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => navigate('/creer-mission')}>
                        Je découvre LineUp
                    </button>
                </div>
            </header>

            <div className="page-grid">
                <form className="page-card page-form" onSubmit={handleSubmit}>
                    <label>
                        Adresse e-mail
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="vous@entreprise.fr"
                            required
                        />
                    </label>
                    <label>
                        Mot de passe
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                        />
                    </label>
                    <label className="checkbox">
                        <input type="checkbox" name="remember" checked={form.remember} onChange={handleChange} />
                        <span>Rester connecté 14 jours</span>
                    </label>
                    <button type="submit" className="btn-gradient">
                        Simuler la connexion
                    </button>
                    {status === 'submitted' && (
                        <p className="page-status page-status--success">
                            C’est bon ! Cliquez sur « Ouvrir l’espace sécurisé » pour finaliser sur l’app officielle.
                        </p>
                    )}
                    {status === 'error' && (
                        <p className="page-status page-status--error">Merci de renseigner votre e-mail et votre mot de passe.</p>
                    )}
                </form>

                <div className="page-card">
                    <h3>Process de connexion</h3>
                    <ol className="page-list">
                        <li>Choisissez votre rôle (client ou liner).</li>
                        <li>Validez l’OTP reçu par email si demandé.</li>
                        <li>Accédez à vos missions, paiements et notifications.</li>
                    </ol>
                    <p>
                        Besoin d’un compte ? Publiez une première mission en cliquant sur « Créer une mission », nous activons
                        l’accès immédiatement.
                    </p>
                </div>
            </div>
        </section>
    );
}

function MissionBuilderPage({ links }) {
    const [form, setForm] = useState({
        title: '',
        location: '',
        budget: '18',
        duration: '2h',
        notes: '',
    });
    const [preview, setPreview] = useState(null);

    function handleChange(event) {
        const { name, value } = event.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }

    function handleSubmit(event) {
        event.preventDefault();
        setPreview({
            ...form,
            reference: `MSN-${Date.now().toString().slice(-5)}`,
            steps: PROCESS_STEPS,
        });
    }

    return (
        <section className="landing-page">
            <header className="page-hero">
                <p>Simulation mission</p>
                <h2>Publiez une mission LineUp en 3 étapes.</h2>
                <p>
                    Brief express, matching en direct, paiement capturé après preuve. Renseignez votre besoin et découvrez le
                    récapitulatif généré.
                </p>
                <div className="page-actions">
                    <button type="button" className="btn-gradient" onClick={() => window.location.assign(links.signup || '#')}>
                        Publier depuis l’app
                    </button>
                </div>
            </header>

            <div className="page-grid">
                <form className="page-card page-form" onSubmit={handleSubmit}>
                    <label>
                        Titre de la mission
                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Billetterie Adidas Champs-Elysées"
                            required
                        />
                    </label>
                    <label>
                        Lieu
                        <input
                            type="text"
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            placeholder="Boutique, arrondissement, point GPS"
                            required
                        />
                    </label>
                    <div className="form-row">
                        <label>
                            Budget horaire (€)
                            <input type="number" name="budget" value={form.budget} onChange={handleChange} min="12" />
                        </label>
                        <label>
                            Durée estimée
                            <input type="text" name="duration" value={form.duration} onChange={handleChange} placeholder="2h" />
                        </label>
                    </div>
                    <label>
                        Notes pour le liner
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Documents à fournir, tenue, QR, contact sur place..."
                        />
                    </label>
                    <button type="submit" className="btn-gradient">
                        Générer le récap
                    </button>
                </form>

                <div className="page-card page-summary">
                    {preview ? (
                        <>
                            <p className="page-summary__badge">{preview.reference}</p>
                            <h3>{preview.title}</h3>
                            <ul>
                                <li>
                                    <strong>Lieu :</strong> {preview.location}
                                </li>
                                <li>
                                    <strong>Budget :</strong> {preview.budget} €/h · {preview.duration}
                                </li>
                                {preview.notes && (
                                    <li>
                                        <strong>Notes :</strong> {preview.notes}
                                    </li>
                                )}
                            </ul>
                            <div className="page-pills">
                                {preview.steps.map(step => (
                                    <span key={step.title}>{step.title}</span>
                                ))}
                            </div>
                            <p>
                                Ce récapitulatif est prêt à être publié dans l’app. Cliquez sur « Publier depuis l’app » pour finaliser
                                avec paiement sécurisé.
                            </p>
                        </>
                    ) : (
                        <p>Remplissez le formulaire pour voir apparaître ici votre mission prête à poster.</p>
                    )}
                </div>
            </div>
        </section>
    );
}

function BonjourPage({ links, user }) {
    const navigate = useNavigate();

    return (
        <section className="landing-page">
            <header className="page-hero">
                <p>Bonjour {user?.name?.split(' ')[0] ?? 'LineUp'}</p>
                <h2>Bienvenue dans votre hub Ops.</h2>
                <p>
                    Accédez à la console, relancez une mission, suivez vos paiements et retrouvez le support en 1 clic. Tout est
                    synchronisé avec l’app mobile.
                </p>
                <div className="page-actions">
                    <button type="button" className="btn-gradient" onClick={() => window.location.assign(links.ops || '#')}>
                        Ouvrir la console Ops
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => navigate('/creer-mission')}>
                        Planifier une mission
                    </button>
                </div>
            </header>

            <div className="page-grid">
                <div className="page-card">
                    <h3>Votre check-list</h3>
                    <ul className="page-list">
                        <li>📍 Vérifiez vos missions en cours et les preuves déposées.</li>
                        <li>💳 Confirmez les paiements sécurisés (Stripe/PayPal/Adyen).</li>
                        <li>🧾 Téléchargez les rapports et factures en PDF.</li>
                        <li>🛎️ Contactez l’équipe Ops 7/7 en un clic.</li>
                    </ul>
                </div>
                <div className="page-card">
                    <h3>Timeline type</h3>
                    <ol className="page-list">
                        {PROCESS_STEPS.map(step => (
                            <li key={step.title}>
                                <strong>{step.title}</strong> – {step.description}
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
