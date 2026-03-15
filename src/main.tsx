import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { ThemeProvider } from '@toss/tds-mobile';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuthFromFirebase } from './hooks/useConvexAuth';
import './styles/global.css';
import './styles/tds-overrides.css';
import './styles/animations.css';

const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://placeholder.convex.cloud';
const convex = new ConvexReactClient(convexUrl);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ErrorBoundary>
            <ThemeProvider>
                <ConvexProviderWithAuth client={convex} useAuth={useAuthFromFirebase}>
                    <App />
                </ConvexProviderWithAuth>
            </ThemeProvider>
        </ErrorBoundary>
    </StrictMode>,
);
