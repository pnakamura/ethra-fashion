import { Home, Shirt, Palette, Sparkles, Layers } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/wardrobe', icon: Shirt, label: 'Closet' },
  { path: '/provador', icon: Sparkles, label: 'Provador' },
  { path: '/chromatic', icon: Palette, label: 'Cores' },
  { path: '/canvas', icon: Layers, label: 'Looks' },
];

export function BottomNav() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
              .maybeSingle();
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
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-background/95 dark:bg-background/70 backdrop-blur-xl border-t border-border dark:border-t-[1.5px] dark:border-t-[hsl(42_85%_55%_/_0.3)] dark:shadow-[0_-1px_25px_hsl(42_85%_55%_/_0.12)]">
        <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto md:max-w-2xl">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onMouseEnter={() => handlePrefetch(item.path)}
                onTouchStart={() => handlePrefetch(item.path)}
                className="relative flex flex-col items-center py-2 px-3 rounded-xl transition-all"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 transition-colors relative z-10 ${
                    isActive 
                      ? 'text-primary dark:text-primary' 
                      : 'text-muted-foreground'
                  }`}
                />
                <span
                  className={`text-[10px] mt-1 font-medium transition-colors relative z-10 ${
                    isActive 
                      ? 'text-primary dark:text-primary' 
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
