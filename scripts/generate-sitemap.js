#!/usr/bin/env node

/**
 * Sitemap Generator for Movies.to
 * Generates sitemap.xml for SEO optimization
 * Run: bun run generate-sitemap
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = process.env.VITE_APP_URL || 'https://movies-to.com';
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');

// Static routes
const staticRoutes = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/browse', priority: '0.9', changefreq: 'daily' },
  { url: '/search', priority: '0.8', changefreq: 'weekly' },
  { url: '/genres', priority: '0.8', changefreq: 'weekly' },
  { url: '/watchlist', priority: '0.7', changefreq: 'weekly' },
  { url: '/login', priority: '0.5', changefreq: 'monthly' },
  { url: '/register', priority: '0.5', changefreq: 'monthly' },
];

// Genre routes (will be populated from TMDB API)
const genreRoutes = [
  { id: 28, name: 'action', priority: '0.8', changefreq: 'daily' },
  { id: 12, name: 'adventure', priority: '0.8', changefreq: 'daily' },
  { id: 16, name: 'animation', priority: '0.8', changefreq: 'daily' },
  { id: 35, name: 'comedy', priority: '0.8', changefreq: 'daily' },
  { id: 80, name: 'crime', priority: '0.8', changefreq: 'daily' },
  { id: 99, name: 'documentary', priority: '0.8', changefreq: 'daily' },
  { id: 18, name: 'drama', priority: '0.8', changefreq: 'daily' },
  { id: 10751, name: 'family', priority: '0.8', changefreq: 'daily' },
  { id: 14, name: 'fantasy', priority: '0.8', changefreq: 'daily' },
  { id: 36, name: 'history', priority: '0.8', changefreq: 'daily' },
  { id: 27, name: 'horror', priority: '0.8', changefreq: 'daily' },
  { id: 10402, name: 'music', priority: '0.8', changefreq: 'daily' },
  { id: 9648, name: 'mystery', priority: '0.8', changefreq: 'daily' },
  { id: 10749, name: 'romance', priority: '0.8', changefreq: 'daily' },
  { id: 878, name: 'science-fiction', priority: '0.8', changefreq: 'daily' },
  { id: 10770, name: 'tv-movie', priority: '0.8', changefreq: 'daily' },
  { id: 53, name: 'thriller', priority: '0.8', changefreq: 'daily' },
  { id: 10752, name: 'war', priority: '0.8', changefreq: 'daily' },
  { id: 37, name: 'western', priority: '0.8', changefreq: 'daily' },
];

function generateSitemap() {
  const now = new Date().toISOString();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Add static routes
  staticRoutes.forEach(route => {
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}${route.url}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  // Add genre routes
  genreRoutes.forEach(genre => {
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}/genre/${genre.id}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>${genre.changefreq}</changefreq>\n`;
    xml += `    <priority>${genre.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  // Write to file
  fs.writeFileSync(OUTPUT_PATH, xml, 'utf8');
  console.log('✅ Sitemap generated successfully!');
  console.log(`📍 Location: ${OUTPUT_PATH}`);
  console.log(`🔗 URL: ${SITE_URL}/sitemap.xml`);
  console.log(`📊 Total URLs: ${staticRoutes.length + genreRoutes.length}`);
}

// Run generator
try {
  generateSitemap();
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}
