export default function WelcomeApp({ data }) {
    return (
        <div className="welcome-shell">
            <div className="welcome-card">
                <span>Bienvenue</span>
                <h1>{data.appName || 'LineUp'}</h1>
                <p>
                    Cette instance Laravel sert l’API et l’Ops console LineUp. Utilisez la landing publique ou
                    connectez-vous à l’espace Ops pour piloter missions et paiements.
                </p>
                <div className="actions">
                    <button type="button" onClick={() => window.location.assign(data.landingUrl || '/') }>
                        Landing
                    </button>
                    <button type="button" onClick={() => window.location.assign(data.opsUrl || '#') }>
                        Console Ops
                    </button>
                </div>
            </div>
        </div>
    );
}
