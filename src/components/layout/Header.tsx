import { Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export function Header({ title }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-border dark:border-border/50">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto md:max-w-2xl lg:max-w-4xl">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-semibold text-gradient dark:neon-text-gold">
            {title || 'Ethra'}
          </h1>
        </div>
        
        {user && (
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
