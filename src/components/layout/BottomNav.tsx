import { Home, Shirt, Palette, Layers, Calendar } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/wardrobe', icon: Shirt, label: 'Closet' },
  { path: '/chromatic', icon: Palette, label: 'Cores' },
  { path: '/canvas', icon: Layers, label: 'Looks' },
  { path: '/events', icon: Calendar, label: 'Agenda' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-background/95 dark:bg-background/98 backdrop-blur-xl border-t border-border dark:border-[hsl(238_45%_55%_/_0.15)] dark:shadow-[0_-1px_15px_hsl(238_45%_55%_/_0.08)]">
        <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto md:max-w-2xl">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
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
