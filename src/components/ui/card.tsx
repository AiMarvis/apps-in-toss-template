/**
 * Card 컴포넌트 (shadcn-ui 스타일)
 *
 * TDS에 포함되지 않는 카드 레이아웃 컴포넌트.
 * Tailwind 유틸리티 클래스 기반, Radix 의존 없음.
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>제목</CardTitle>
 *     <CardDescription>설명</CardDescription>
 *   </CardHeader>
 *   <CardContent>본문</CardContent>
 * </Card>
 * ```
 */

import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

/* ── Card ── */
const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-tds-border bg-tds-bg shadow-sm',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

/* ── CardHeader ── */
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1.5 p-4', className)}
      {...props}
    />
  ),
);
CardHeader.displayName = 'CardHeader';

/* ── CardTitle ── */
const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-base font-semibold text-tds-text leading-tight', className)}
      {...props}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

/* ── CardDescription ── */
const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-tds-text-secondary', className)}
      {...props}
    />
  ),
);
CardDescription.displayName = 'CardDescription';

/* ── CardContent ── */
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-4 pt-0', className)}
      {...props}
    />
  ),
);
CardContent.displayName = 'CardContent';

/* ── CardFooter ── */
const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-4 pt-0', className)}
      {...props}
    />
  ),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
