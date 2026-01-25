const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'locales');
const enPath = path.join(localesDir, 'en.json');
const languages = ['ar', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt'];

// Read English translations (source of truth)
const enTranslations = JSON.parse(fs.readFileSync(enPath, 'utf8'));

function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else if (!(key in target)) {
      // Only add if key doesn't exist in target
      output[key] = source[key];
    } else {
      // Keep existing translation
      output[key] = target[key];
    }
  }

  return output;
}

// Sync each language file
languages.forEach(lang => {
  const langPath = path.join(localesDir, `${lang}.json`);

  try {
    // Read existing translations
    const existingTranslations = JSON.parse(fs.readFileSync(langPath, 'utf8'));

    // Merge with English translations (keeping existing translations)
    const mergedTranslations = deepMerge(enTranslations, existingTranslations);

    // Write back to file
    fs.writeFileSync(langPath, JSON.stringify(mergedTranslations, null, 2) + '\n', 'utf8');

    console.log(`✓ Synced ${lang}.json`);
  } catch (error) {
    console.error(`✗ Error syncing ${lang}.json:`, error.message);
  }
});

console.log('\n✨ Translation sync complete!');
