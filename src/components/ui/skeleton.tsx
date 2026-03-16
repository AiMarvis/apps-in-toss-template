/**
 * Skeleton 컴포넌트 (shadcn-ui 스타일)
 *
 * 콘텐츠 로딩 시 플레이스홀더로 사용하는 shimmer 애니메이션 컴포넌트.
 * TDS에 포함되지 않는 컴포넌트.
 *
 * @example
 * ```tsx
 * // 텍스트 스켈레톤
 * <Skeleton className="h-4 w-48" />
 *
 * // 이미지 스켈레톤
 * <Skeleton className="h-32 w-full rounded-2xl" />
 *
 * // 아바타 스켈레톤
 * <Skeleton className="h-10 w-10 rounded-full" />
 * ```
 */

import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

const Skeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'animate-pulse rounded-lg bg-tds-bg-secondary',
        className,
      )}
      {...props}
    />
  ),
);
Skeleton.displayName = 'Skeleton';

export { Skeleton };
