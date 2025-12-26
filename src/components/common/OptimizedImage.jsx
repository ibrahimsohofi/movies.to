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
  // Simplified version without hooks to avoid React hooks error
  if (!src) {
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
    e.target.style.display = 'none';
    const fallback = e.target.nextElementSibling;
    if (fallback) fallback.style.display = 'block';
    onError?.(e);
  };

  const handleLoad = (e) => {
    console.log('Image loaded successfully:', src);
    onLoad?.(e);
  };

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio }}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading={priority ? 'eager' : 'lazy'}
        onError={handleError}
        onLoad={handleLoad}
        decoding="async"
        referrerPolicy="no-referrer"
      />
      <div style={{ display: 'none' }}>
        <MoviePosterFallback
          title={fallbackTitle || alt}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
}
