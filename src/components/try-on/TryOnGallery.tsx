import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useVirtualTryOn } from '@/hooks/useVirtualTryOn';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TryOnDetailModal } from './TryOnDetailModal';

// Helper to detect URL type and apply appropriate treatment
const getThumbnailUrl = (url: string | null): string | null => {
  if (!url) return null;
  
  // Base64 data - use directly without modification
  if (url.startsWith('data:')) {
    return url;
  }
  
  // Supabase Storage - apply transforms
  if (url.includes('supabase.co')) {
    return `${url}?width=120&height=160&resize=cover&quality=60`;
  }
  
  // External URLs (Replicate, Google, etc.) - use as-is
  return url;
};

interface TryOnResult {
  id: string;
  result_image_url: string | null;
  garment_image_url: string;
  status: string;
  processing_time_ms: number | null;
  created_at: string;
}

interface TryOnGalleryProps {
  onSelectResult?: (result: TryOnResult) => void;
  onTryAgainWithGarment?: (garmentImageUrl: string) => void;
}

export function TryOnGallery({ onSelectResult, onTryAgainWithGarment }: TryOnGalleryProps) {
  const { tryOnHistory, isLoadingHistory, deleteTryOnResult } = useVirtualTryOn();
  const [selectedDetail, setSelectedDetail] = useState<TryOnResult | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const completedResults = tryOnHistory?.filter((r) => r.status === 'completed') || [];

  const handleDelete = (id: string) => {
    deleteTryOnResult(id);
    setSelectedDetail(null);
  };

  const handleTryAgain = (garmentImageUrl: string) => {
    if (onTryAgainWithGarment) {
      onTryAgainWithGarment(garmentImageUrl);
    }
    setSelectedDetail(null);
  };

  if (isLoadingHistory) {
    return (
      <Card className="p-4 shadow-soft">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 bg-secondary rounded" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] bg-secondary rounded-lg" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (completedResults.length === 0) {
    return (
      <Card className="p-4 shadow-soft">
        <h3 className="font-display text-lg font-medium mb-3">Histórico</h3>
        <div className="py-8 text-center">
          <Clock className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Suas provas virtuais aparecerão aqui
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-medium">Histórico</h3>
          <span className="text-xs text-muted-foreground">
            {completedResults.length} prova{completedResults.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
        {completedResults.map((result, index) => {
            const thumbnailUrl = getThumbnailUrl(result.result_image_url);
            const hasError = imageErrors.has(result.id);
            
            return (
              <motion.button
                key={result.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                onClick={() => setSelectedDetail(result)}
                className="relative aspect-[3/4] rounded-lg overflow-hidden group bg-secondary"
              >
                {hasError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-destructive/10">
                    <AlertTriangle className="w-6 h-6 text-destructive/50" />
                    <span className="text-[9px] text-destructive/50 mt-1">Expirada</span>
                  </div>
                ) : thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="Try-on result"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    onError={() => setImageErrors(prev => new Set(prev).add(result.id))}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="absolute bottom-1 left-1 right-1 text-[10px] text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatDistanceToNow(new Date(result.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </div>
              </motion.button>
            );
          })}
        </div>
      </Card>

      {/* Detail Modal */}
      <TryOnDetailModal
        result={selectedDetail}
        onClose={() => setSelectedDetail(null)}
        onDelete={handleDelete}
        onTryAgain={handleTryAgain}
      />
    </>
  );
}
