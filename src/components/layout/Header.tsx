import { Settings, LogOut, Home, Shirt, Palette, Sparkles, Calendar, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

const navLinks = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/wardrobe', label: 'Closet', icon: Shirt },
  { path: '/provador', label: 'Provador', icon: Sparkles },
  { path: '/chromatic', label: 'Cores', icon: Palette },
  { path: '/canvas', label: 'Looks', icon: Layers },
  { path: '/events', label: 'Agenda', icon: Calendar },
];

export function Header({ title }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Prefetch data on hover for faster navigation
  const handlePrefetch = (path: string) => {
    if (!user) return;

    switch (path) {
      case '/wardrobe':
        queryClient.prefetchQuery({
          queryKey: ['wardrobe-items', user.id],
          queryFn: async () => {
            const { data } = await supabase
              .from('wardrobe_items')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });
            return data || [];
          },
          staleTime: 1000 * 60 * 3,
        });
        break;
      case '/chromatic':
      case '/':
        queryClient.prefetchQuery({
          queryKey: ['profile', user.id],
          queryFn: async () => {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', user.id)
              .single();
            return data;
          },
          staleTime: 1000 * 60 * 5,
        });
        break;
      case '/provador':
        queryClient.prefetchQuery({
          queryKey: ['try-on-results', user.id],
          queryFn: async () => {
            const { data } = await supabase
              .from('try_on_results')
              .select('id, result_image_url, status, created_at, garment_source, model_used')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(20);
            return data || [];
          },
          staleTime: 1000 * 60 * 2,
        });
        break;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 dark:bg-transparent backdrop-blur-xl border-b border-border dark:border-b-[1.5px] dark:border-b-[hsl(42_85%_55%_/_0.3)] dark:shadow-[0_1px_25px_hsl(42_85%_55%_/_0.12)]">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto md:max-w-2xl lg:max-w-5xl xl:max-w-6xl">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-semibold text-gradient">
            {title || 'Ethra'}
          </h1>
        </div>

        {/* Desktop Navigation */}
        {user && (
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link 
                  key={link.path}
                  to={link.path}
                  onMouseEnter={() => handlePrefetch(link.path)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    isActive 
                      ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary dark:shadow-[0_0_10px_hsl(45_100%_55%_/_0.15)]" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-primary/10"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}
        
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
