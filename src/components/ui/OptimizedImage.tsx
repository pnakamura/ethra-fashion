import { useState, useCallback, forwardRef, ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onError' | 'onLoad'> {
  src: string | null | undefined;
  alt: string;
  fallbackIcon?: React.ReactNode;
  fallbackClassName?: string;
  showPlaceholder?: boolean;
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'auto';
}

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      src,
      alt,
      className,
      fallbackIcon,
      fallbackClassName,
      showPlaceholder = true,
      aspectRatio = 'auto',
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = useCallback(() => {
      setIsLoading(false);
      setHasError(false);
    }, []);

    const handleError = useCallback(() => {
      setIsLoading(false);
      setHasError(true);
    }, []);

    const aspectClasses = {
      square: 'aspect-square',
      portrait: 'aspect-[3/4]',
      landscape: 'aspect-video',
      auto: '',
    };

    // No src provided
    if (!src) {
      return (
        <div
          className={cn(
            'flex items-center justify-center bg-secondary',
            aspectClasses[aspectRatio],
            fallbackClassName || className
          )}
        >
          {fallbackIcon || <ImageOff className="w-6 h-6 text-muted-foreground/50" />}
        </div>
      );
    }

    // Error state
    if (hasError) {
      return (
        <div
          className={cn(
            'flex items-center justify-center bg-destructive/5',
            aspectClasses[aspectRatio],
            fallbackClassName || className
          )}
        >
          {fallbackIcon || <ImageOff className="w-6 h-6 text-destructive/50" />}
        </div>
      );
    }

    return (
      <div className={cn('relative overflow-hidden', aspectClasses[aspectRatio])}>
        {/* Blur placeholder skeleton */}
        {showPlaceholder && isLoading && (
          <div
            className={cn(
              'absolute inset-0 bg-secondary animate-pulse',
              'bg-gradient-to-br from-secondary via-muted to-secondary'
            )}
          />
        )}

        {/* Actual image */}
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';
