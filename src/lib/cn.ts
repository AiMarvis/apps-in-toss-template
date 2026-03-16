/**
 * cn() — 조건부 클래스명 병합 유틸리티
 *
 * clsx + tailwind-merge 조합으로 Tailwind 클래스 충돌을 자동 해결한다.
 * shadcn-ui 표준 패턴.
 *
 * @example
 * ```tsx
 * // 조건부 클래스 적용
 * <div className={cn("px-4 py-2", isActive && "bg-tds-primary text-white")} />
 *
 * // 기본 + 오버라이드
 * <div className={cn("text-sm text-tds-text", className)} />
 * ```
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
