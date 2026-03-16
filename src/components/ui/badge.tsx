/**
 * Badge 컴포넌트 (shadcn-ui 스타일)
 *
 * 상태 표시, 태그, 라벨 등에 사용하는 인라인 뱃지.
 * TDS에 포함되지 않는 컴포넌트.
 *
 * @example
 * ```tsx
 * <Badge>기본</Badge>
 * <Badge variant="success">완료</Badge>
 * <Badge variant="error">실패</Badge>
 * <Badge variant="outline">정보</Badge>
 * ```
 */

import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

type BadgeVariant = 'default' | 'success' | 'error' | 'outline';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    'bg-tds-primary/10 text-tds-primary',
  success:
    'bg-tds-success/10 text-tds-success',
  error:
    'bg-tds-error/10 text-tds-error',
  outline:
    'border border-tds-border text-tds-text-secondary bg-transparent',
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  ),
);
Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps, BadgeVariant };
