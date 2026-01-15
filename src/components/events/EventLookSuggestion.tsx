import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Palette, CheckCircle, AlertCircle, Lightbulb, ThermometerSun, 
  Shirt, Sparkles, ChevronRight, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface LookSuggestion {
  look_name: string;
  items: string[];
  item_details?: Array<{
    id: string;
    name: string;
    category: string;
    image_url: string;
  }>;
  explanation: string;
  styling_tips?: string;
  score?: number;
  color_harmony?: {
    palette_name: string;
    colors_used: string[];
    harmony_type: string;
  };
  weather_consideration?: string;
  dress_code_match?: string;
  improvements?: string[];
  event_type_tips?: string;
}

interface EventLookSuggestionProps {
  suggestion: LookSuggestion;
  eventType: string;
}

export function EventLookSuggestion({ suggestion, eventType }: EventLookSuggestionProps) {
  const navigate = useNavigate();
  
  const handleViewOnCanvas = () => {
    // Navigate to canvas with pre-selected items
    const itemIds = suggestion.items.join(',');
    navigate(`/canvas?items=${itemIds}`);
  };

  const handleTryOn = () => {
    // Navigate to virtual try-on with first item
    if (suggestion.item_details && suggestion.item_details.length > 0) {
      navigate('/provador');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 dark:border-primary/10 overflow-hidden bg-card/50"
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm">{suggestion.look_name}</h4>
          {suggestion.score && (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              {suggestion.score}%
            </Badge>
          )}
        </div>
        
        {/* Color Harmony */}
        {suggestion.color_harmony && (
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {suggestion.color_harmony.palette_name} • {suggestion.color_harmony.harmony_type}
            </span>
            <div className="flex gap-0.5 ml-1">
              {suggestion.color_harmony.colors_used.slice(0, 4).map((color, i) => (
                <span
                  key={i}
                  className="w-3 h-3 rounded-full border border-white/20"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {suggestion.weather_consideration && (
            <Badge variant="outline" className="text-[10px] h-5">
              <ThermometerSun className="w-2.5 h-2.5 mr-1" />
              {suggestion.weather_consideration}
            </Badge>
          )}
          {suggestion.dress_code_match && (
            <Badge variant="outline" className="text-[10px] h-5">
              <CheckCircle className="w-2.5 h-2.5 mr-1" />
              {suggestion.dress_code_match}
            </Badge>
          )}
        </div>
      </div>

      {/* Item Previews */}
      {suggestion.item_details && suggestion.item_details.length > 0 && (
        <div className="px-4 py-3 border-t border-border/30">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-1">
              {suggestion.item_details.map((item, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted"
                >
                  <img
                    src={item.image_url}
                    alt={item.name || item.category}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Explanation */}
      <div className="px-4 py-3 border-t border-border/30">
        <p className="text-xs text-muted-foreground">{suggestion.explanation}</p>
      </div>

      {/* Styling Tips */}
      {suggestion.styling_tips && (
        <div className="px-4 py-3 border-t border-border/30 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {suggestion.styling_tips}
            </p>
          </div>
        </div>
      )}

      {/* Improvements */}
      {suggestion.improvements && suggestion.improvements.length > 0 && (
        <div className="px-4 py-3 border-t border-border/30 bg-blue-500/5">
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
              Pode melhorar
            </span>
          </div>
          <ul className="space-y-1 pl-5">
            {suggestion.improvements.map((improvement, i) => (
              <li key={i} className="text-xs text-blue-600/80 dark:text-blue-400/80 list-disc">
                {improvement}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Event Type Tips */}
      {suggestion.event_type_tips && (
        <div className="px-4 py-3 border-t border-border/30 bg-purple-500/5">
          <div className="flex items-start gap-2">
            <Shirt className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-purple-700 dark:text-purple-400">
              {suggestion.event_type_tips}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-3 border-t border-border/30 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs rounded-lg"
          onClick={handleViewOnCanvas}
        >
          <Eye className="w-3 h-3 mr-1" />
          Montar Look
        </Button>
        <Button
          size="sm"
          className="flex-1 h-8 text-xs rounded-lg gradient-primary"
          onClick={handleTryOn}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Provar
        </Button>
      </div>
    </motion.div>
  );
}
