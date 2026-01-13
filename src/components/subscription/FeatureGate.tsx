import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/hooks/usePermission';
import { cn } from '@/lib/utils';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
  blurContent?: boolean;
  grayScale?: boolean;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgrade = true,
  blurContent = false,
  grayScale = false,
}: FeatureGateProps) {
  const { hasAccess, remaining, limit, featureName, isUnlimited } = usePermission(feature);
  const navigate = useNavigate();

  if (hasAccess) {
    return <>{children}</>;
  }

  // Custom fallback provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default locked overlay
  return (
    <div className="relative">
      {/* Blurred or grayscale content */}
      {(blurContent || grayScale) && (
        <div
          className={cn(
            'pointer-events-none',
            blurContent && 'blur-sm opacity-50',
            grayScale && 'grayscale opacity-60'
          )}
        >
          {children}
        </div>
      )}

      {/* Lock overlay */}
      <div
        className={cn(
          'flex items-center justify-center rounded-xl',
          (blurContent || grayScale) ? 'absolute inset-0 bg-background/80 backdrop-blur-sm' : 'p-8 bg-muted/50'
        )}
      >
        <div className="text-center p-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">{featureName} bloqueado</p>
          {!isUnlimited && (
            <p className="text-xs text-muted-foreground mb-3">
              Limite: {remaining}/{limit}
            </p>
          )}
          {showUpgrade && (
            <Button
              size="sm"
              onClick={() => navigate('/subscription')}
              className="gradient-primary text-primary-foreground"
            >
              <Crown className="w-3.5 h-3.5 mr-1.5" />
              Fazer Upgrade
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
