import React, { forwardRef } from 'react';
import { Check, Minus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LookHarmonyBadgeProps {
  items: Array<{ chromatic_compatibility?: string | null }>;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  harmonyType?: string;
  className?: string;
}

export const LookHarmonyBadge = forwardRef<HTMLDivElement, LookHarmonyBadgeProps>(
  function LookHarmonyBadge(
    { items, size = 'md', showPercentage = false, harmonyType, className },
    ref
  ) {
    const stats = {
      ideal: items.filter((i) => i.chromatic_compatibility === 'ideal').length,
      neutral: items.filter((i) => i.chromatic_compatibility === 'neutral').length,
      avoid: items.filter((i) => i.chromatic_compatibility === 'avoid').length,
    };

    const total = items.length;
    const harmonyScore =
      total > 0
        ? Math.round(((stats.ideal * 100 + stats.neutral * 50) / (total * 100)) * 100)
        : 0;

    // Determine badge style based on score
    const getBadgeStyle = () => {
      if (harmonyScore >= 80) {
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-900/30',
          text: 'text-emerald-700 dark:text-emerald-400',
          border: 'border-emerald-200 dark:border-emerald-800',
          icon: Check,
          label: 'Excelente',
        };
      } else if (harmonyScore >= 50) {
        return {
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          text: 'text-amber-700 dark:text-amber-400',
          border: 'border-amber-200 dark:border-amber-800',
          icon: Minus,
          label: 'Boa',
        };
      } else {
        return {
          bg: 'bg-rose-100 dark:bg-rose-900/30',
          text: 'text-rose-700 dark:text-rose-400',
          border: 'border-rose-200 dark:border-rose-800',
          icon: AlertTriangle,
          label: 'Baixa',
        };
      }
    };

    const style = getBadgeStyle();
    const Icon = style.icon;

    const sizeClasses = {
      sm: 'px-1.5 py-0.5 text-[10px] gap-0.5',
      md: 'px-2 py-1 text-xs gap-1',
      lg: 'px-3 py-1.5 text-sm gap-1.5',
    };

    const iconSizes = {
      sm: 'w-2.5 h-2.5',
      md: 'w-3 h-3',
      lg: 'w-4 h-4',
    };

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={ref}
              className={cn(
                'inline-flex items-center rounded-full font-medium border transition-transform hover:scale-105',
                sizeClasses[size],
                style.bg,
                style.text,
                style.border,
                className
              )}
            >
              <Icon className={iconSizes[size]} />
              {showPercentage ? <span>{harmonyScore}%</span> : <span>{style.label}</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-2 text-xs">
              <p className="font-medium">Harmonia Cromática: {harmonyScore}%</p>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {stats.ideal} ideais
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {stats.neutral} neutras
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  {stats.avoid} evitar
                </span>
              </div>
              {harmonyType && <p className="text-muted-foreground">Tipo: {harmonyType}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

// Mini version for compact cards
export function LookHarmonyMini({
  items,
}: {
  items: Array<{ chromatic_compatibility?: string | null }>;
}) {
  const idealCount = items.filter((i) => i.chromatic_compatibility === 'ideal').length;
  const avoidCount = items.filter((i) => i.chromatic_compatibility === 'avoid').length;
  const total = items.length;
  const score = total > 0 ? Math.round((idealCount / total) * 100) : 0;

  if (avoidCount > 0) {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
        ⚠️ {avoidCount}
      </span>
    );
  }

  if (score >= 75) {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
        ✨ {score}%
      </span>
    );
  }

  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
      {score}%
    </span>
  );
}
