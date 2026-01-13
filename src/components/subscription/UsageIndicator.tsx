import { Infinity as InfinityIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { usePermission } from '@/hooks/usePermission';
import { cn } from '@/lib/utils';

interface UsageIndicatorProps {
  feature: string;
  showLabel?: boolean;
  compact?: boolean;
}

export function UsageIndicator({ feature, showLabel = true, compact = false }: UsageIndicatorProps) {
  const { currentUsage, limit, isUnlimited, percentUsed, featureName, isLoading } = usePermission(feature);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded w-16" />
      </div>
    );
  }

  if (isUnlimited) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <InfinityIcon className="w-3.5 h-3.5" />
        <span>Ilimitado</span>
      </div>
    );
  }

  const isNearLimit = percentUsed >= 80;
  const isAtLimit = percentUsed >= 100;

  if (compact) {
    return (
      <span
        className={cn(
          'text-xs font-medium',
          isAtLimit && 'text-destructive',
          isNearLimit && !isAtLimit && 'text-amber-500',
          !isNearLimit && 'text-muted-foreground'
        )}
      >
        {currentUsage}/{limit}
      </span>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        {showLabel && <span className="text-muted-foreground">{featureName}</span>}
        <span
          className={cn(
            isAtLimit && 'text-destructive',
            isNearLimit && !isAtLimit && 'text-amber-500'
          )}
        >
          {currentUsage}/{limit}
        </span>
      </div>
      <Progress
        value={Math.min(percentUsed, 100)}
        className={cn(
          'h-1.5',
          isAtLimit && '[&>div]:bg-destructive',
          isNearLimit && !isAtLimit && '[&>div]:bg-amber-500'
        )}
      />
    </div>
  );
}
