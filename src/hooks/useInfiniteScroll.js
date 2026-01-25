import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for implementing infinite scroll
 * @param {Function} onLoadMore - Callback function to load more items
 * @param {boolean} hasMore - Whether there are more items to load
 * @param {boolean} loading - Whether currently loading
 * @param {Object} options - Additional options
 * @returns {Object} - Ref to attach to the sentinel element
 */
export function useInfiniteScroll(onLoadMore, hasMore, loading, options = {}) {
  const {
    threshold = 1.0, // When the sentinel is 100% visible
    rootMargin = '200px', // Start loading 200px before reaching the sentinel
  } = options;

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const handleIntersection = useCallback(
    (entries) => {
      const [entry] = entries;

      if (entry.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, loading]
  );

  useEffect(() => {
    const currentSentinel = sentinelRef.current;

    // Disconnect previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new Intersection Observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    // Observe the sentinel element
    if (currentSentinel) {
      observerRef.current.observe(currentSentinel);
    }

    // Cleanup
    return () => {
      if (observerRef.current && currentSentinel) {
        observerRef.current.unobserve(currentSentinel);
      }
    };
  }, [handleIntersection, threshold, rootMargin]);

  return sentinelRef;
}
