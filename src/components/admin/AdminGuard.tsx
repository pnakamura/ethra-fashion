import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/useAdmin';

interface AdminGuardProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'moderator';
  fallback?: ReactNode;
}

export function AdminGuard({ children, requiredRole = 'admin', fallback }: AdminGuardProps) {
  const { isAdmin, isModerator, isLoading } = useAdmin();
  const navigate = useNavigate();

  const hasAccess = requiredRole === 'admin' ? isAdmin : isModerator;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto" />
          <div className="w-32 h-4 bg-muted rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 text-center max-w-md">
          <ShieldX className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground mb-6">
            Você não tem permissão para acessar esta área. Esta página é restrita a{' '}
            {requiredRole === 'admin' ? 'administradores' : 'moderadores'}.
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            Voltar ao Início
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
