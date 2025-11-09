import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/js/ops/main.jsx',
                'resources/js/landing/main.jsx',
                'resources/js/web/main.jsx',
                'resources/js/welcome/main.jsx',
                'resources/js/admin/main.jsx',
                'resources/js/admin/auth.jsx',
                'resources/js/app_portal/main.jsx',
            ],
            refresh: true,
        }),
        tailwindcss(),
        react(),
    ],
});
