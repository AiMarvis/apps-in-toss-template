/**
 * SDK Safety Pattern 유틸리티
 *
 * 앱인토스 SDK API 호출 시 반드시 따라야 하는 3단계 Safety Pattern:
 * 1. Dynamic Import (번들 최적화)
 * 2. isSupported 체크 (웹 환경 graceful degradation)
 * 3. cleanup 패턴 (메모리 누수 방지)
 *
 * @example
 * ```typescript
 * // 훅에서 사용
 * useEffect(() => {
 *   const cleanup = sdkImportAndCheck('loadFullScreenAd')
 *     .then(api => api?.({ onEvent, onError }));
 *   return () => { cleanup.then(c => c?.()); };
 * }, []);
 * ```
 */

import { getEnvironment } from '../hooks/useEnvironment';

/**
 * SDK API를 Dynamic Import + isSupported 체크하여 반환.
 * 지원하지 않는 환경(웹)에서는 null을 반환한다.
 *
 * @param apiName - `@apps-in-toss/web-framework`에서 import할 API 이름
 * @returns API 함수 또는 null (미지원 환경)
 */
export async function sdkImportAndCheck<T = unknown>(
  apiName: string
): Promise<T | null> {
  try {
    const mod = await import('@apps-in-toss/web-framework');
    const api = (mod as Record<string, unknown>)[apiName];

    if (!api || typeof api !== 'function') {
      console.warn(`[SDK] ${apiName}이(가) 모듈에 존재하지 않습니다.`);
      return null;
    }

    // isSupported가 있는 경우 체크
    const apiObj = api as unknown as Record<string, unknown>;
    if ('isSupported' in apiObj && typeof apiObj.isSupported === 'function') {
      const supported = (apiObj.isSupported as () => boolean)();
      if (supported !== true) {
        const env = getEnvironment();
        console.info(
          `[SDK] ${apiName}은(는) 현재 환경(${env})에서 지원되지 않습니다. Mock 동작을 제공하세요.`
        );
        return null;
      }
    }

    return api as T;
  } catch (error) {
    console.error(`[SDK] ${apiName} import 실패:`, error);
    return null;
  }
}

/**
 * SDK API를 호출하고 cleanup 함수를 반환하는 헬퍼.
 * useEffect 내에서 사용하기 적합한 패턴.
 *
 * @param apiName - SDK API 이름
 * @param options - API에 전달할 옵션 (onEvent, onError 등)
 * @returns cleanup 함수 또는 null
 */
export async function callSdkWithCleanup(
  apiName: string,
  options: {
    onEvent?: (event: unknown) => void;
    onError?: (error: unknown) => void;
    [key: string]: unknown;
  }
): Promise<(() => void) | null> {
  const api = await sdkImportAndCheck<
    (opts: typeof options) => (() => void) | void
  >(apiName);

  if (!api) return null;

  try {
    const cleanup = api(options);
    return typeof cleanup === 'function' ? cleanup : null;
  } catch (error) {
    console.error(`[SDK] ${apiName} 호출 실패:`, error);
    options.onError?.(error);
    return null;
  }
}
