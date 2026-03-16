/**
 * 환경 감지 훅 및 유틸리티
 *
 * `getOperationalEnvironment()` SDK API를 래핑하여
 * 현재 실행 환경(web/toss/sandbox)을 판별합니다.
 *
 * - web: 브라우저 개발 환경 → mock 데이터, console.log
 * - sandbox: 토스 테스트 환경 → 테스트 광고 ID
 * - toss: 프로덕션 → 실제 SDK API
 */

import { useState, useEffect } from 'react';
import type { Environment } from './useFeatureBase';

/** 캐시된 환경 값 (한 번만 감지) */
let cachedEnvironment: Environment | null = null;

/**
 * 현재 실행 환경을 동기적으로 반환한다.
 * SDK가 로드되기 전에는 'web'을 기본값으로 반환.
 *
 * 비훅 컨텍스트(유틸리티 함수 등)에서 사용.
 */
export function getEnvironment(): Environment {
  if (cachedEnvironment) return cachedEnvironment;
  return 'web'; // SDK 로드 전 기본값
}

/**
 * 현재 실행 환경을 감지하는 React 훅.
 *
 * @returns 현재 환경 ('web' | 'toss' | 'sandbox')
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const env = useEnvironment();
 *
 *   if (env === 'web') {
 *     return <div>개발 모드 - Mock 데이터 사용</div>;
 *   }
 *   return <div>토스 앱 내 실행 중</div>;
 * }
 * ```
 */
export function useEnvironment(): Environment {
  const [environment, setEnvironment] = useState<Environment>(
    cachedEnvironment ?? 'web'
  );

  useEffect(() => {
    if (cachedEnvironment) {
      setEnvironment(cachedEnvironment);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { getOperationalEnvironment } = await import(
          '@apps-in-toss/web-framework'
        );

        if (
          getOperationalEnvironment &&
          typeof getOperationalEnvironment === 'function'
        ) {
          const env = getOperationalEnvironment();
          const mapped: Environment =
            env === 'toss' ? 'toss' : env === 'sandbox' ? 'sandbox' : 'web';

          cachedEnvironment = mapped;
          if (!cancelled) setEnvironment(mapped);
        }
      } catch {
        // SDK import 실패 → 웹 환경으로 간주
        cachedEnvironment = 'web';
        if (!cancelled) setEnvironment('web');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return environment;
}
