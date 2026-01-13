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
    <header className="sticky top-0 z-40 bg-background/95 dark:bg-background/98 backdrop-blur-xl border-b border-border dark:border-primary/15">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto md:max-w-2xl lg:max-w-4xl">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-semibold text-gradient">
            {title || 'Ethra'}
          </h1>
        </div>
        
        {user && (
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 dark:hover:bg-primary/20">
                <Settings className="w-5 h-5 text-muted-foreground dark:text-muted-foreground" />
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-primary/10 dark:hover:bg-primary/20"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 text-muted-foreground dark:text-muted-foreground" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
