import { useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { checkTossIntegration, clearSessionForDisconnect } from '../services/tossAuth';

/**
 * 연동 해제 감시 훅 — 3지점 재검증 중 3번째 (visibilitychange)
 *
 * 사용자가 토스 앱 설정에서 연동을 해제하고 돌아올 때
 * 자동으로 로그아웃 처리합니다.
 *
 * IntegrationGuard 컴포넌트 내부에서 사용됩니다.
 */
export function useTossIntegration() {
    const { user, logout } = useAuth();

    const runCheck = useCallback(async () => {
        if (!user?.uid?.startsWith('toss_')) {
            return;
        }

        const isLinked = await checkTossIntegration();

        // ⚠️ 엄격 비교: isLinked === false
        if (isLinked === false) {
            clearSessionForDisconnect();
            await logout();
        }
    }, [user, logout]);

    useEffect(() => {
        // 컴포넌트 마운트 시 즉시 체크
        void runCheck();

        // visibilitychange: 포그라운드 복귀 시 재체크
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                void runCheck();
            }
        };

        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [runCheck]);
}
