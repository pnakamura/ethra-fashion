import { useNavigate } from 'react-router-dom';
import { Lock, Crown, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageContainer } from '@/components/layout/PageContainer';
import { usePermission } from '@/hooks/usePermission';

interface LockedFeaturePageProps {
  feature: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export function LockedFeaturePage({ feature, title, description, icon: Icon }: LockedFeaturePageProps) {
  const navigate = useNavigate();
  const { featureName } = usePermission(feature);

  return (
    <>
      <Header title={title} />
      <PageContainer className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm px-4">
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center grayscale">
              <Icon className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-background border">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <h2 className="font-display text-2xl mb-2">{title}</h2>
          <p className="text-muted-foreground mb-6">{description}</p>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/subscription')}
              className="w-full gradient-primary text-primary-foreground"
            >
              <Crown className="w-4 h-4 mr-2" />
              Fazer Upgrade
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
              Voltar ao Início
            </Button>
          </div>
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}
