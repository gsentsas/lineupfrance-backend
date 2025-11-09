import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './styles.css';

axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const payload = window.__PAYLOAD__ || {};

function AdminAuth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await axios.post(payload.loginUrl || '/admin/login', {
                email,
                password,
                _token: payload.csrf,
            });
            window.location.href = '/admin';
        } catch (err) {
            setError(err.response?.data?.message ?? 'Connexion impossible.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-shell">
            <form className="auth-card" onSubmit={handleSubmit}>
                <img src="/assets/images/IMG_0065.PNG" alt="LineUp" />
                <h1>Console Ops</h1>
                <p>Accès réservé à l’équipe LineUp.</p>
                {error && <div className="auth-error">{error}</div>}
                <label>
                    <span>Email</span>
                    <input type="email" value={email} onChange={event => setEmail(event.target.value)} required />
                </label>
                <label>
                    <span>Mot de passe</span>
                    <input type="password" value={password} onChange={event => setPassword(event.target.value)} required />
                </label>
                <button type="submit" disabled={loading}>
                    {loading ? 'Connexion…' : 'Se connecter'}
                </button>
            </form>
        </div>
    );
}

const container = document.getElementById('admin-auth-root');
if (container) {
    ReactDOM.createRoot(container).render(<AdminAuth />);
}
