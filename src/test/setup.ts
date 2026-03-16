/**
 * Vitest 테스트 환경 설정
 *
 * 모든 테스트 파일 실행 전에 로드됩니다.
 * DOM 관련 matcher와 cleanup을 자동 설정합니다.
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// 각 테스트 후 자동 cleanup
afterEach(() => {
  cleanup();
});
