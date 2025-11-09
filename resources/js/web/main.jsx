import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp';
import './styles.css';

const container = document.getElementById('web-app-root');
const payload = window.__PAYLOAD__ || {};

if (container) {
    ReactDOM.createRoot(container).render(<WebApp data={payload} />);
}
