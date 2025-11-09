import React from 'react';
import ReactDOM from 'react-dom/client';
import AppShell from './App';

const container = document.getElementById('app-react-root');

if (container) {
    ReactDOM.createRoot(container).render(
        <React.StrictMode>
            <AppShell />
        </React.StrictMode>,
    );
}
