import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTemporarySeason } from '@/contexts/TemporarySeasonContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

export function TemporarySeasonBanner() {
  const { temporarySeason, isUsingTemporary, clearTemporary } = useTemporarySeason();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleMakePermanent = async () => {
    if (!user || !temporarySeason) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          color_season: temporarySeason.id,
          color_analysis: {
            season: temporarySeason.name,
            subtype: temporarySeason.subtype,
            season_id: temporarySeason.id,
            recommended_colors: temporarySeason.colors.primary.map(c => c.name),
            avoid_colors: temporarySeason.colors.avoid.map(c => c.name),
            updated_at: new Date().toISOString(),
          }
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(`${temporarySeason.name} ${temporarySeason.subtype} agora é sua paleta!`);
      clearTemporary();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      console.error('Error saving season:', error);
      toast.error('Erro ao salvar paleta');
    }
  };

  return (
    <AnimatePresence>
      {isUsingTemporary && temporarySeason && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            height: 'auto',
          }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          className="overflow-hidden"
        >
          <motion.div 
            initial={{ scale: 0.98 }}
            animate={{ scale: [1, 1.01, 1] }}
            transition={{ duration: 0.4, times: [0, 0.5, 1] }}
            className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent 
                       border-2 border-amber-500/50 rounded-xl p-4 mb-4
                       shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          >
            <div className="flex items-center gap-3">
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="p-2 rounded-full bg-amber-500/20 flex-shrink-0"
              >
                <Wand2 className="w-4 h-4 text-amber-600" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Experimentando: {temporarySeason.name} {temporarySeason.subtype}
                </p>
                <p className="text-xs text-muted-foreground">
                  Veja o preview abaixo
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearTemporary}
                  className="h-8 px-2 hover:bg-amber-500/10"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleMakePermanent}
                  className="h-8 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Usar
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
