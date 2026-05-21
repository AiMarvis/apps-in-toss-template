import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { BackButtonHandler } from './components/BackButtonHandler';
import { IntegrationGuard } from './components/IntegrationGuard';
import { LoadingScreen } from './components/LoadingScreen';
import { useAuth } from './hooks/useAuth';

// 코드 스플리팅: 페이지 컴포넌트를 동적 임포트하여 초기 번들 크기 축소
import HomePage from './pages/HomePage';
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
// TODO: 앱 고유 페이지 추가
// const MyPage = lazy(() => import('./pages/MyPage'));

function AppShell() {
    // const location = useLocation();
    const { isOnboardingSeen } = useAuth();
    // const hideBottomNav =
    //     location.pathname === '/onboarding' ||
    //     location.pathname === '/terms' ||
    //     location.pathname === '/privacy';

    return (
        <IntegrationGuard>
            <BackButtonHandler />
            <div className="app-shell">
                <Suspense fallback={<LoadingScreen label="" />}>
                    <Routes>
                        <Route
                            path="/"
                            element={isOnboardingSeen ? <HomePage /> : <Navigate to="/onboarding" replace />}
                        />
                        <Route
                            path="/onboarding"
                            element={isOnboardingSeen ? <Navigate to="/" replace /> : <OnboardingPage />}
                        />
                        {/* TODO: 앱 고유 라우트 추가 */}
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
                {/* TODO: 탭 네비게이션이 필요한 경우 BottomTabNav 구현 후 활성화 */}
                {/* {!hideBottomNav && <BottomTabNav />} */}
            </div>
        </IntegrationGuard>
    );
}

export default function App() {
    const { initialize, initialized, isLoading } = useAuth();
    // const [showSplash, setShowSplash] = useState(false);
    // TODO: 스플래시 필요 시 useState(true)로 변경 + SplashScreen 컴포넌트 구현

    useEffect(() => {
        void initialize();
    }, [initialize]);

    // 스플래시가 끝났지만 아직 초기화가 완료되지 않은 경우
    if (!initialized || isLoading) {
        return <LoadingScreen label="초기화 중..." />;
    }

    return (
        <BrowserRouter>
            <AppShell />
        </BrowserRouter>
    );
}
