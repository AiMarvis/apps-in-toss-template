import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [tailwindcss(), react()],
    build: {
        outDir: 'dist',
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // React 코어
                    if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
                        return 'vendor-react';
                    }
                    // React Router
                    if (id.includes('react-router')) {
                        return 'vendor-router';
                    }
                    // Convex
                    if (id.includes('node_modules/convex')) {
                        return 'vendor-convex';
                    }
                    // Firebase (인증 관련)
                    if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
                        return 'vendor-firebase';
                    }
                    // TDS (토스 디자인 시스템)
                    if (id.includes('@toss/tds')) {
                        return 'vendor-tds';
                    }
                },
            },
        },
    },
});
