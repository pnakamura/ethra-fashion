import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useVirtualTryOn } from '@/hooks/useVirtualTryOn';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TryOnDetailModal } from './TryOnDetailModal';

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
            // Generate thumbnail URL with Supabase transform (smaller size for gallery)
            const thumbnailUrl = result.result_image_url
              ? result.result_image_url.includes('supabase.co')
                ? `${result.result_image_url}?width=200&height=267&resize=cover&quality=70`
                : result.result_image_url
              : null;
            
            return (
              <motion.button
                key={result.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                onClick={() => setSelectedDetail(result)}
                className="relative aspect-[3/4] rounded-lg overflow-hidden group bg-secondary"
              >
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="Try-on result"
                    loading="lazy"
                    decoding="async"
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
