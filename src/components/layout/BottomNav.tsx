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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border dark:border-border/50 lg:hidden">
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto md:max-w-2xl">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center py-2 px-3 rounded-xl transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 gradient-primary rounded-xl opacity-10 dark:opacity-20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-primary dark:neon-text-gold' : 'text-muted-foreground'
                }`}
              />
              <span
                className={`text-[10px] mt-1 font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
