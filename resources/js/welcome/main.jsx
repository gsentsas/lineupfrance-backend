import React from 'react';
import ReactDOM from 'react-dom/client';
import WelcomeApp from './WelcomeApp';
import './styles.css';

const container = document.getElementById('welcome-root');
const data = window.__PAYLOAD__ || {};

if (container) {
    ReactDOM.createRoot(container).render(<WelcomeApp data={data} />);
}
