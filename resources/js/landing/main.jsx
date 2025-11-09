import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import LandingApp from './LandingApp';
import './styles.css';

const container = document.getElementById('landing-root');
const payload = window.__PAYLOAD__ || {};

if (container) {
    ReactDOM.createRoot(container).render(
        <BrowserRouter>
            <LandingApp data={payload} />
        </BrowserRouter>,
    );
}
