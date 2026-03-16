/**
 * Standard Hook Interface
 *
 * 모든 SDK 기능 훅의 베이스 인터페이스.
 * robinade/apps-in-toss-fullstack-templates의 표준 훅 패턴 적용.
 *
 * @example
 * ```typescript
 * // 커스텀 SDK 훅 구현 예시
 * function useRewardedAd(): UseFeatureReturn & { showAd: () => void } {
 *   const [state, setState] = useState<UseFeatureReturn>(INITIAL_FEATURE_STATE);
 *   // ... SDK 호출 로직
 *   return { ...state, showAd };
 * }
 * ```
 */

/** SDK 기능의 상태 */
export type FeatureStatus = 'idle' | 'loading' | 'ready' | 'error';

/** 실행 환경 구분 */
export type Environment = 'web' | 'toss' | 'sandbox';

/**
 * 모든 SDK 기능 훅이 반환해야 하는 표준 인터페이스.
 *
 * - `status`: 현재 기능의 상태 (idle → loading → ready/error)
 * - `error`: 에러 발생 시 Error 객체
 * - `isSupported`: 현재 환경에서 해당 기능을 지원하는지 여부
 * - `environment`: 현재 실행 환경 (web/toss/sandbox)
 */
export interface UseFeatureReturn {
  status: FeatureStatus;
  error: Error | null;
  isSupported: boolean;
  environment: Environment;
}

/** 초기 상태 상수 - 훅 초기화 시 사용 */
export const INITIAL_FEATURE_STATE: UseFeatureReturn = {
  status: 'idle',
  error: null,
  isSupported: false,
  environment: 'web',
};
