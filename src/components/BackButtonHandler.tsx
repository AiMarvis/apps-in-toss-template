import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { closeView, graniteEvent } from '@apps-in-toss/web-framework';

// TODO: 앱의 종료 라우트 경로 추가
const EXIT_ROUTES = new Set(['/', '/onboarding']);

type GraniteBackListener = { onEvent: () => void };

/**
 * 백버튼 핸들러
 *
 * - 홈/온보딩 경로: closeView()로 앱 종료
 * - 그 외: navigate(-1)로 뒤로 가기
 *
 * ⚠️ popstate 이벤트 사용 금지 → graniteEvent.addEventListener 사용
 */
export function BackButtonHandler() {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleBack = () => {
            if (EXIT_ROUTES.has(location.pathname)) {
                try {
                    if ((window as any).ReactNativeWebView) {
                        closeView();
                    }
                } catch (e) { }
                return;
            }
            navigate(-1);
        };

        if (typeof window === 'undefined' || !(window as any).ReactNativeWebView) {
            return;
        }

        if (!graniteEvent?.addEventListener) {
            return;
        }

        const unsubscribe = graniteEvent.addEventListener('backEvent', {
            onEvent: handleBack,
        } as GraniteBackListener);

        return () => {
            unsubscribe();
        };
    }, [location.pathname, navigate]);

    return null;
}
