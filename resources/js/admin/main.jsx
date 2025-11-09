import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './AdminApp';

const container = document.getElementById('admin-root');
const payload = window.__PAYLOAD__ || {};

if (container) {
    ReactDOM.createRoot(container).render(<AdminApp data={payload} />);
}
