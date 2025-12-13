import { useState, useEffect, useRef } from 'react';
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
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    // Always load priority images immediately
    if (priority) {
      setShouldLoad(true);
      return;
    }

    // If no src, don't set up observer
    if (!src) return;

    // Set up IntersectionObserver for lazy loading
    const currentRef = imgRef.current;
    if (!currentRef) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        });
      },
      {
        rootMargin: '200px', // Start loading earlier for better UX
        threshold: 0.01,
      }
    );

    observerRef.current.observe(currentRef);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority, src]);

  const handleImageError = (e) => {
    setImageError(true);
    setImageLoaded(true);
    onError?.(e);
  };

  const handleImageLoad = (e) => {
    setImageLoaded(true);
    onLoad?.(e);
  };

  // Generate srcset for responsive images (TMDB image sizes: w300, w500, w780, original)
  const generateSrcSet = (baseSrc) => {
    if (!baseSrc || !baseSrc.includes('image.tmdb.org')) return '';

    const imageSizes = ['w300', 'w500', 'w780', 'original'];
    const srcsetParts = imageSizes.map(size => {
      const url = baseSrc.replace(/w\d+/, size);
      const width = size === 'original' ? '2000w' : `${size.substring(1)}w`;
      return `${url} ${width}`;
    });

    return srcsetParts.join(', ');
  };

  const srcSet = src ? generateSrcSet(src) : '';

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} style={{ aspectRatio }}>
      {/* Fallback for errors or missing images */}
      {(imageError || !src) && (
        <MoviePosterFallback
          title={fallbackTitle || alt}
          className="absolute inset-0 w-full h-full"
        />
      )}

      {/* Shimmer loading effect */}
      {showShimmer && !imageLoaded && src && !imageError && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700"
          style={{
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite linear',
          }}
        />
      )}

      {/* Actual image with srcset for responsive images */}
      {src && !imageError && shouldLoad && (
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-700 ${
            !imageLoaded
              ? 'opacity-0 scale-110 blur-lg'
              : 'opacity-100 scale-100 blur-0'
          }`}
          loading={priority ? 'eager' : 'lazy'}
          onError={handleImageError}
          onLoad={handleImageLoad}
          decoding="async"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}
