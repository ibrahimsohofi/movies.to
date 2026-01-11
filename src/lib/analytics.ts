// Analytics utilities for tracking user behavior and events

// Types
export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
}

export interface PageViewData {
  path: string;
  title: string;
  referrer?: string;
  userId?: string;
}

export interface SearchEvent {
  query: string;
  resultsCount: number;
  userId?: string;
}

export interface MovieEvent {
  movieId: number;
  movieTitle: string;
  action: 'view' | 'watchlist_add' | 'watchlist_remove' | 'rate' | 'review';
  value?: number;
  userId?: string;
}

// Google Analytics Integration
export class Analytics {
  private static instance: Analytics;
  private gaInitialized = false;
  private localAnalytics: AnalyticsEvent[] = [];

  private constructor() {
    this.initializeGA();
    this.loadLocalAnalytics();
  }

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  /**
   * Initialize Google Analytics
   */
  private initializeGA(): void {
    // Check if GA_MEASUREMENT_ID is set
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

    if (!measurementId) {
      console.warn('Google Analytics Measurement ID not found. Analytics will be tracked locally only.');
      return;
    }

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }

    gtag('js', new Date());
    gtag('config', measurementId, {
      send_page_view: false, // We'll send manually
      anonymize_ip: true, // Privacy compliance
    });

    this.gaInitialized = true;
    console.log('✅ Google Analytics initialized');
  }

  /**
   * Load local analytics from localStorage
   */
  private loadLocalAnalytics(): void {
    try {
      const stored = localStorage.getItem('local_analytics');
      if (stored) {
        this.localAnalytics = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load local analytics:', error);
    }
  }

  /**
   * Save local analytics to localStorage
   */
  private saveLocalAnalytics(): void {
    try {
      // Keep only last 1000 events
      const eventsToSave = this.localAnalytics.slice(-1000);
      localStorage.setItem('local_analytics', JSON.stringify(eventsToSave));
    } catch (error) {
      console.error('Failed to save local analytics:', error);
    }
  }

  /**
   * Track page view
   */
  trackPageView(data: PageViewData): void {
    // Google Analytics
    if (this.gaInitialized && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: data.path,
        page_title: data.title,
        page_referrer: data.referrer,
      });
    }

    // Local analytics
    this.trackEvent({
      category: 'Page View',
      action: 'view',
      label: data.path,
      userId: data.userId,
    });
  }

  /**
   * Track custom event
   */
  trackEvent(event: AnalyticsEvent): void {
    // Google Analytics
    if (this.gaInitialized && window.gtag) {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        user_id: event.userId,
      });
    }

    // Local analytics
    const analyticsEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    this.localAnalytics.push(analyticsEvent);
    this.saveLocalAnalytics();
  }

  /**
   * Track search
   */
  trackSearch(data: SearchEvent): void {
    this.trackEvent({
      category: 'Search',
      action: 'search',
      label: data.query,
      value: data.resultsCount,
      userId: data.userId,
    });
  }

  /**
   * Track movie interaction
   */
  trackMovie(data: MovieEvent): void {
    this.trackEvent({
      category: 'Movie',
      action: data.action,
      label: `${data.movieTitle} (${data.movieId})`,
      value: data.value,
      userId: data.userId,
    });
  }

  /**
   * Track conversion (e.g., signup, watchlist creation)
   */
  trackConversion(type: string, value?: number): void {
    if (this.gaInitialized && window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: import.meta.env.VITE_GA_CONVERSION_ID,
        event_category: 'Conversion',
        event_label: type,
        value: value,
      });
    }

    this.trackEvent({
      category: 'Conversion',
      action: type,
      value: value,
    });
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: string): void {
    this.trackEvent({
      category: 'Error',
      action: 'error',
      label: `${context ? `${context}: ` : ''}${error.message}`,
    });
  }

  /**
   * Track timing (e.g., page load time)
   */
  trackTiming(category: string, variable: string, time: number): void {
    if (this.gaInitialized && window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: variable,
        value: time,
        event_category: category,
      });
    }

    this.trackEvent({
      category: 'Timing',
      action: variable,
      label: category,
      value: time,
    });
  }

  /**
   * Get local analytics data
   */
  getLocalAnalytics(): AnalyticsEvent[] {
    return [...this.localAnalytics];
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary() {
    const events = this.localAnalytics;

    // Group by category
    const byCategory = events.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by action
    const byAction = events.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Popular searches
    const searches = events
      .filter(e => e.category === 'Search')
      .map(e => e.label || '')
      .filter(Boolean);

    const searchCounts = searches.reduce((acc, search) => {
      acc[search] = (acc[search] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularSearches = Object.entries(searchCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    // Popular movies
    const movieEvents = events
      .filter(e => e.category === 'Movie')
      .map(e => e.label || '')
      .filter(Boolean);

    const movieCounts = movieEvents.reduce((acc, movie) => {
      acc[movie] = (acc[movie] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularMovies = Object.entries(movieCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([movie, count]) => ({ movie, count }));

    return {
      totalEvents: events.length,
      byCategory,
      byAction,
      popularSearches,
      popularMovies,
    };
  }

  /**
   * Clear local analytics
   */
  clearLocalAnalytics(): void {
    this.localAnalytics = [];
    localStorage.removeItem('local_analytics');
  }

  /**
   * Export analytics data
   */
  exportAnalytics(): string {
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      events: this.localAnalytics,
      summary: this.getAnalyticsSummary(),
    }, null, 2);
  }
}

// Export singleton instance
export const analytics = Analytics.getInstance();

// Declare global gtag for TypeScript
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// React hook for analytics
export function useAnalytics() {
  return {
    trackPageView: (data: PageViewData) => analytics.trackPageView(data),
    trackEvent: (event: AnalyticsEvent) => analytics.trackEvent(event),
    trackSearch: (data: SearchEvent) => analytics.trackSearch(data),
    trackMovie: (data: MovieEvent) => analytics.trackMovie(data),
    trackConversion: (type: string, value?: number) => analytics.trackConversion(type, value),
    trackError: (error: Error, context?: string) => analytics.trackError(error, context),
    trackTiming: (category: string, variable: string, time: number) =>
      analytics.trackTiming(category, variable, time),
  };
}

// Track performance metrics
export function trackPerformance(): void {
  if (typeof window === 'undefined' || !window.performance) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (perfData) {
        // DOM Content Loaded
        analytics.trackTiming(
          'Performance',
          'DOM Content Loaded',
          Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart)
        );

        // Page Load Time
        analytics.trackTiming(
          'Performance',
          'Page Load',
          Math.round(perfData.loadEventEnd - perfData.loadEventStart)
        );

        // Time to First Byte
        analytics.trackTiming(
          'Performance',
          'Time to First Byte',
          Math.round(perfData.responseStart - perfData.requestStart)
        );
      }
    }, 0);
  });
}
