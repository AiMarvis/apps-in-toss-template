import type { PropsWithChildren } from 'react';
import { useTossIntegration } from '../hooks/useTossIntegration';

/**
 * 연동 해제 감시 가드
 *
 * App.tsx의 라우트 래퍼로 사용합니다.
 * 토스 앱에서 연동 해제 시 자동으로 로그아웃됩니다.
 */
export function IntegrationGuard({ children }: PropsWithChildren) {
    useTossIntegration();
    return <>{children}</>;
}
