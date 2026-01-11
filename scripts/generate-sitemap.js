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

const SITE_URL = 'https://movies-to.netlify.app'; // Update with your actual domain

// Static routes
const staticRoutes = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/browse', priority: 0.9, changefreq: 'daily' },
  { path: '/genres', priority: 0.8, changefreq: 'weekly' },
  { path: '/search', priority: 0.7, changefreq: 'weekly' },
  { path: '/login', priority: 0.5, changefreq: 'monthly' },
  { path: '/register', priority: 0.5, changefreq: 'monthly' },
];

// Popular genres (TMDB genre IDs)
const genres = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
`;

  // Add static routes
  staticRoutes.forEach((route) => {
    sitemap += `
  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  });

  // Add genre routes
  genres.forEach((genre) => {
    sitemap += `
  <url>
    <loc>${SITE_URL}/genre/${genre.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  // Note: For dynamic movie pages, you would typically fetch popular movies from TMDB
  // and add them here. For now, we'll just add a note that they're crawlable
  sitemap += `
  <!-- Dynamic movie pages are crawlable via /browse and /search -->
  <!-- Popular movies should be added here via TMDB API in production -->
`;

  sitemap += `
</urlset>`;

  // Write sitemap to public folder
  const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, sitemap);

  console.log('✅ Sitemap generated successfully!');
  console.log(`📍 Location: ${outputPath}`);
  console.log(`📊 Total URLs: ${staticRoutes.length + genres.length}`);
}

// Run the generator
generateSitemap();
