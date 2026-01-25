import { useEffect } from 'react';

export default function MetaTags({
  title = 'Movies.to - Discover Your Next Favorite Movie',
  description = 'Browse, search, and discover thousands of movies. Get details, ratings, cast info, and more. Your ultimate movie discovery platform.',
  image = '/logo.svg',
  url = window.location.href,
  type = 'website',
  keywords = 'movies, films, cinema, movie database, watch movies, movie ratings, movie reviews'
}) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper function to set meta tag
    const setMetaTag = (property, content, nameAttr = 'property') => {
      if (!content) return;

      let element = document.querySelector(`meta[${nameAttr}="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard meta tags
    setMetaTag('description', description, 'name');
    setMetaTag('keywords', keywords, 'name');

    // Open Graph tags
    setMetaTag('og:title', title);
    setMetaTag('og:description', description);
    setMetaTag('og:image', image.startsWith('http') ? image : window.location.origin + image);
    setMetaTag('og:url', url);
    setMetaTag('og:type', type);
    setMetaTag('og:site_name', 'Movies.to');

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image', 'name');
    setMetaTag('twitter:title', title, 'name');
    setMetaTag('twitter:description', description, 'name');
    setMetaTag('twitter:image', image.startsWith('http') ? image : window.location.origin + image, 'name');

    // Additional SEO tags
    setMetaTag('author', 'Movies.to', 'name');
    setMetaTag('robots', 'index, follow', 'name');
    setMetaTag('googlebot', 'index, follow', 'name');

    // Theme color
    setMetaTag('theme-color', '#dc2626', 'name');
  }, [title, description, image, url, type, keywords]);

  return null;
}
