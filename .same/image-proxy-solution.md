# TMDB Image Proxy Solution

## Problem

TMDB images were failing to load in the Same.new development environment due to:
1. **CORS restrictions** - TMDB's CDN (BunnyCDN) doesn't send proper `Access-Control-Allow-Origin` headers
2. **Iframe restrictions** - Same.new runs applications in an iframe, which can block certain external resources
3. **Referrer policies** - TMDB images may be blocked when loaded without proper referrer headers

## Solution

### Development Environment
We implemented a **Vite proxy** that routes TMDB image requests through the local dev server:

```javascript
// vite.config.ts
server: {
  proxy: {
    '/tmdb-images': {
      target: 'https://image.tmdb.org',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/tmdb-images/, '/t/p'),
      headers: {
        'Referer': 'https://www.themoviedb.org/',
      },
    },
  },
}
```

**How it works:**
1. Images are requested as `/tmdb-images/w500/abc123.jpg`
2. Vite proxy intercepts these requests
3. Proxy forwards to `https://image.tmdb.org/t/p/w500/abc123.jpg`
4. Response is served through the dev server (bypassing CORS)

### Production Environment
In production, images are loaded directly from TMDB CDN:
- No proxy needed
- Standard browser environment (not iframe)
- TMDB images work normally

### Code Implementation

```javascript
// src/services/tmdb.js
export const getImageUrl = (path, size = 'original') => {
  if (!path) return null;

  // Development: Use proxy
  if (import.meta.env.DEV) {
    return `/tmdb-images/${size}${path}`;
  }

  // Production: Direct TMDB URL
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};
```

## Image Sizes Available

- `w92` - 92px width (thumbnail)
- `w154` - 154px width (small)
- `w185` - 185px width
- `w342` - 342px width (medium)
- `w500` - 500px width (default for posters)
- `w780` - 780px width (large)
- `w1280` - 1280px width (HD, for backdrops)
- `original` - Full resolution (avoid for performance)

## Performance Optimizations

1. **Lazy Loading** - Images load only when near viewport
2. **IntersectionObserver** - Monitors scroll position efficiently
3. **Shimmer Effect** - Shows loading animation
4. **Error Fallback** - Shows placeholder on error
5. **Image Size Selection** - Uses appropriate size for use case

## Deployment Notes

### For Netlify/Vercel (Static Hosting)
No additional configuration needed - images load directly from TMDB.

### For Full-Stack Deployment
If deploying with a backend, you may want to add a similar proxy:

**Express.js Example:**
```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

app.use('/tmdb-images', createProxyMiddleware({
  target: 'https://image.tmdb.org',
  changeOrigin: true,
  pathRewrite: {
    '^/tmdb-images': '/t/p'
  },
  headers: {
    'Referer': 'https://www.themoviedb.org/'
  }
}));
```

## Alternative Solutions Considered

1. ❌ **crossOrigin="anonymous"** - Made CORS errors worse
2. ❌ **referrerPolicy changes** - Not sufficient alone
3. ❌ **Loading from backend** - Unnecessary complexity
4. ✅ **Vite proxy** - Simple, effective, dev-only solution

## Troubleshooting

### Images still not loading?
1. Restart dev server: `bun run dev`
2. Clear browser cache
3. Check console for errors
4. Verify proxy config in `vite.config.ts`

### Slow image loading?
1. Reduce image size (use w500 instead of original)
2. Implement proper lazy loading
3. Use CDN in production

### Production images not loading?
1. Check TMDB API key is valid
2. Verify environment variables are set
3. Check browser console for errors
4. Ensure `import.meta.env.DEV` is false

## References

- [Vite Proxy Documentation](https://vitejs.dev/config/server-options.html#server-proxy)
- [TMDB Image API](https://developers.themoviedb.org/3/getting-started/images)
- [IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
