import type { ReactNode } from 'react';
import { ProductivityScoreGauge } from './ProductivityScoreGauge';
import type { ProductivityBreakdown } from '../../lib/types';

/**
 * ProductivityScore Component — Wrapper around 100-point ProductivityScoreGauge.
 */
export function ProductivityScore({
  score,
  breakdown,
  subtitle,
  children,
}: {
  score: number;
  breakdown?: ProductivityBreakdown;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <ProductivityScoreGauge score={score} breakdown={breakdown} size={130} />
      <div className="min-w-0 text-center sm:text-left">
        {children}
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-violet-300/70 mt-1 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export { ProductivityScore as ProgressScore };