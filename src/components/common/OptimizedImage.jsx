import { useState } from 'react';
import MoviePosterFallback from './MoviePosterFallback';

export default function OptimizedImage({
  src,
  alt,
  className = '',
  fallbackTitle,
  aspectRatio = '2/3',
  onLoad,
  onError,
  priority = false,
  showShimmer = true,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check if it's a local proxy URL (doesn't need referrerPolicy)
  const isProxyUrl = src?.startsWith('/tmdb-images');

  if (!src || hasError) {
    return (
      <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio }}>
        <MoviePosterFallback
          title={fallbackTitle || alt}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  const handleError = (e) => {
    console.error('Image failed to load:', src);
    setHasError(true);
    onError?.(e);
  };

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio }}>
      {/* Loading shimmer */}
      {!isLoaded && showShimmer && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading={priority ? 'eager' : 'lazy'}
        onError={handleError}
        onLoad={handleLoad}
        decoding="async"
        {...(!isProxyUrl && { referrerPolicy: 'no-referrer' })}
      />
    </div>
  );
}
