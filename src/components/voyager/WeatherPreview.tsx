import { motion } from 'framer-motion';
import { Sun, Cloud, CloudRain, Snowflake, CloudSun, CloudFog, CloudLightning, Umbrella, Thermometer } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface WeatherPreviewProps {
  weather: {
    summary: string;
    temp_avg: number;
    temp_min: number;
    temp_max: number;
    rain_probability: number;
    conditions: string[];
  };
  tips?: string[];
}

const conditionIcons: Record<string, typeof Sun> = {
  sunny: Sun,
  partly_cloudy: CloudSun,
  cloudy: Cloud,
  foggy: CloudFog,
  rainy: CloudRain,
  showers: CloudRain,
  snowy: Snowflake,
  stormy: CloudLightning,
};

function getTemperatureColor(temp: number): string {
  if (temp <= 0) return 'text-blue-500';
  if (temp <= 10) return 'text-cyan-500';
  if (temp <= 20) return 'text-emerald-500';
  if (temp <= 30) return 'text-amber-500';
  return 'text-red-500';
}

function getTemperatureGradient(min: number, max: number): string {
  if (max <= 10) return 'from-blue-500 to-cyan-400';
  if (max <= 20) return 'from-cyan-500 to-emerald-400';
  if (max <= 30) return 'from-amber-400 to-orange-500';
  return 'from-orange-500 to-red-500';
}

export function WeatherPreview({ weather, tips = [] }: WeatherPreviewProps) {
  const mainCondition = weather.conditions[0] || 'partly_cloudy';
  const WeatherIcon = conditionIcons[mainCondition] || CloudSun;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4 border-0 shadow-soft bg-gradient-to-br from-primary/5 to-secondary/10 overflow-hidden">
        <div className="flex items-start gap-4">
          {/* Weather Icon */}
          <div className="flex-shrink-0">
            <motion.div
              animate={{ 
                rotate: mainCondition === 'sunny' ? [0, 5, -5, 0] : 0,
                scale: [1, 1.05, 1],
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
              className="w-16 h-16 rounded-2xl bg-background/80 flex items-center justify-center shadow-sm"
            >
              <WeatherIcon className={`w-8 h-8 ${getTemperatureColor(weather.temp_avg)}`} />
            </motion.div>
          </div>

          {/* Weather Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-medium leading-snug line-clamp-2">
              {weather.summary}
            </p>
            
            {/* Temperature Bar */}
            <div className="mt-3 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className={`h-full rounded-full bg-gradient-to-r ${getTemperatureGradient(weather.temp_min, weather.temp_max)}`}
                />
              </div>
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                {weather.temp_min}° - {weather.temp_max}°C
              </span>
            </div>

            {/* Rain Probability */}
            {weather.rain_probability > 20 && (
              <div className="mt-2 flex items-center gap-2">
                <Umbrella className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">
                  {weather.rain_probability}% chance de chuva
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        {tips.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">Dicas para a viagem:</p>
            <ul className="space-y-1">
              {tips.slice(0, 3).map((tip, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="text-xs text-foreground/80 flex items-start gap-2"
                >
                  <span className="text-primary mt-0.5">•</span>
                  <span>{tip}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
