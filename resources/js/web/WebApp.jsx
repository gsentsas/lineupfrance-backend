const CLIENT_STEPS = [
    {
        title: 'Publier',
        subtitle: 'Lieu, budget et instructions synchronisés avec le back-office.',
        status: '1 min',
    },
    {
        title: 'Suivre',
        subtitle: 'Statuts “En route”, “Arrivé”, selfie de preuve, chat et QR.',
        status: 'Live',
    },
    {
        title: 'Payer',
        subtitle: 'Carte, PayPal ou wallet. Capture automatique après validation.',
        status: 'Auto',
    },
];

const LINER_KYC = [
    { label: "Pièce d'identité", status: 'Validé' },
    { label: 'Selfie temps réel', status: 'En attente' },
    { label: 'Casier judiciaire', status: 'À compléter' },
];

const CLIENT_TIMELINE = [
    { label: 'Mission publiée', status: 'Créée', time: '09:12' },
    { label: 'Liner accepté', status: 'Assignée', time: '09:18' },
    { label: 'Liner en route', status: 'Tracking', time: '09:42' },
    { label: 'Preuve envoyée', status: 'Terminée', time: '10:05' },
];

export default function WebApp({ data }) {
    const links = data?.links ?? {};
    return (
        <div className="web-shell">
            <Hero links={links} />
            <ClientFlow />
            <LinerExperience />
            <Footer links={links} />
        </div>
    );
}

function Hero({ links }) {
    return (
        <section className="web-hero">
            <div className="web-hero__copy">
                <p className="eyebrow">App web LineUp</p>
                <h1>Client & Liner sur un seul écran.</h1>
                <p>
                    Retrouvez la même expérience que sur l’app iOS : onboarding, missions, wallet et KYC.
                    Cette démo web reflète le front React connecté à Laravel.
                </p>
                <div className="cta-row">
                    <button type="button" className="btn-primary" onClick={() => window.location.assign(links.landingUrl || '/') }>
                        Revenir à la landing
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => window.location.assign(links.opsUrl || '#') }>
                        Console Ops
                    </button>
                </div>
            </div>
            <div className="web-hero__panel">
                <div className="panel-card">
                    <div>
                        <p className="eyebrow">Mission</p>
                        <h2>Billetterie Champs-Élysées</h2>
                        <div className="stat-grid">
                            <StatCard label="Budget" value="35 €" />
                            <StatCard label="Statut" value="En route" />
                            <StatCard label="ETA" value="12 min" />
                        </div>
                    </div>
                </div>
                <div className="timeline">
                    {CLIENT_TIMELINE.map(item => (
                        <article key={item.label}>
                            <div>
                                <strong>{item.label}</strong>
                                <span>{item.status}</span>
                            </div>
                            <time>{item.time}</time>
                        </article>
                    ))}
                </div>
                <div className="panel-card">
                    <p className="eyebrow">Notifications en direct</p>
                    <strong>Clara suit Samir depuis l’app et valide la preuve d’attente.</strong>
                </div>
            </div>
        </section>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="stat-card">
            <p>{label}</p>
            <strong>{value}</strong>
        </div>
    );
}

function ClientFlow() {
    return (
        <section className="section">
            <header>
                <p className="eyebrow">Expérience client</p>
                <h2>Brief clair, suivi live, paiement sécurisé.</h2>
            </header>
            <div className="grid">
                {CLIENT_STEPS.map(step => (
                    <article key={step.title} className="card">
                        <div>
                            <p className="eyebrow">{step.status}</p>
                            <h3>{step.title}</h3>
                        </div>
                        <p>{step.subtitle}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}

function LinerExperience() {
    return (
        <section className="section">
            <header>
                <p className="eyebrow">Pour les liners</p>
                <h2>Onboarding tutoriel + KYC complet.</h2>
            </header>
            <div className="liner-grid">
                <div>
                    <h3>Checklist KYC</h3>
                    <ul>
                        {LINER_KYC.map(item => (
                            <li key={item.label}>
                                <span>{item.label}</span>
                                <strong>{item.status}</strong>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3>Wallet & missions</h3>
                    <p>
                        Les liners gèrent leurs missions, notifications et cash-out hebdo directement depuis l’app web
                        responsive ou l’app native. Les preuves sont synchronisées avec le back-office Ops.
                    </p>
                </div>
            </div>
        </section>
    );
}

function Footer({ links }) {
    return (
        <footer className="section footer">
            <p>Besoin d’un accès complet ?</p>
            <div className="cta-row">
                <button type="button" className="btn-primary" onClick={() => window.location.assign(links.consoleUrl || '#')}>
                    Ouvrir la console
                </button>
                <button type="button" className="btn-secondary" onClick={() => window.location.assign(links.opsUrl || '#')}>
                    Connexion Ops
                </button>
            </div>
        </footer>
    );
}
