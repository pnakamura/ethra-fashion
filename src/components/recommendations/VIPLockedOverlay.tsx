import { motion } from 'framer-motion';
import { Crown, Lock, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface VIPLockedOverlayProps {
  previewCount?: number;
}

export function VIPLockedOverlay({ previewCount = 3 }: VIPLockedOverlayProps) {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Blurred Preview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 blur-sm opacity-40 pointer-events-none">
        {[...Array(previewCount)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-transparent border-2 border-amber-500/30"
          >
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <div className="h-6 w-20 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full" />
                <div className="h-6 w-12 bg-amber-500/30 rounded-full" />
              </div>
              <div className="flex -space-x-4 justify-center py-8">
                <div className="w-16 h-16 rounded-xl bg-muted" />
                <div className="w-16 h-16 rounded-xl bg-muted" />
                <div className="w-16 h-16 rounded-xl bg-muted" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lock Overlay */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-2xl"
      >
        <div className="text-center p-8 max-w-md">
          {/* Animated Crown */}
          <motion.div
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}
            className="relative inline-block mb-6"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-[0_0_40px_hsl(45_100%_50%_/_0.5)]">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              className="absolute -inset-2"
            >
              <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 text-amber-400" />
              <Star className="absolute bottom-0 right-0 w-3 h-3 text-yellow-500" />
              <Sparkles className="absolute top-1/2 left-0 -translate-y-1/2 w-3 h-3 text-amber-500" />
            </motion.div>
          </motion.div>

          {/* Content */}
          <h3 className="text-2xl font-display font-bold mb-2 bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
            Looks Exclusivos VIP
          </h3>
          <p className="text-muted-foreground mb-6">
            Desbloqueie looks de passarela personalizados com harmonias cromáticas avançadas, 
            tendências atuais e dicas exclusivas de styling.
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {['Tendências de Passarela', 'Harmonias Avançadas', 'Styling Premium'].map((feature) => (
              <div
                key={feature}
                className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium"
              >
                {feature}
              </div>
            ))}
          </div>

          {/* CTA */}
          <Button
            size="lg"
            onClick={() => navigate('/subscription')}
            className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white shadow-[0_0_20px_hsl(45_100%_50%_/_0.4)] hover:shadow-[0_0_30px_hsl(45_100%_50%_/_0.6)] transition-shadow rounded-xl"
          >
            <Crown className="w-5 h-5 mr-2" />
            Upgrade para Muse
          </Button>

          <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            Exclusivo para assinantes Muse
          </p>
        </div>
      </motion.div>
    </div>
  );
}
