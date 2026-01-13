import { motion } from 'framer-motion';
import { Plus, Camera, Palette, Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const actions = [
  { icon: Plus, label: 'Nova Peça', path: '/wardrobe', color: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary' },
  { icon: Camera, label: 'Novo Look', path: '/canvas', color: 'bg-gold/20 text-gold dark:bg-primary/15 dark:text-primary' },
  { icon: Palette, label: 'Minha Paleta', path: '/chromatic', color: 'bg-season-summer/50 text-season-winter dark:bg-primary/15 dark:text-primary' },
  { icon: Plane, label: 'Planejar', path: '/voyager', color: 'bg-season-autumn/30 text-season-autumn dark:bg-primary/15 dark:text-primary' },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border dark:border-primary/10 shadow-soft hover:shadow-elevated transition-all dark:hover:border-primary/20"
          >
            <div className={`p-2.5 rounded-xl ${action.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {action.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
