// Test TMDB image URL construction
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const getImageUrl = (path, size = 'w500') => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

// Test with a sample poster path
const testPath = '/2VewzHWRJW0KdKSyLgqO6YFwjh1.jpg';
const url = getImageUrl(testPath, 'w500');

console.log('Test Image URL:', url);
console.log('Expected format: https://image.tmdb.org/t/p/w500/2VewzHWRJW0KdKSyLgqO6YFwjh1.jpg');
