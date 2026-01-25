# Translation System

## Overview
Movies.to supports 9 languages:
- 🇬🇧 English (en)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)
- 🇮🇹 Italian (it)
- 🇵🇹 Portuguese (pt)
- 🇯🇵 Japanese (ja)
- 🇰🇷 Korean (ko)
- 🇸🇦 Arabic (ar)

## File Structure
```
src/i18n/
├── locales/
│   ├── en.json      # English (master/source)
│   ├── es.json      # Spanish
│   ├── fr.json      # French
│   ├── de.json      # German
│   ├── it.json      # Italian
│   ├── pt.json      # Portuguese
│   ├── ja.json      # Japanese
│   ├── ko.json      # Korean
│   └── ar.json      # Arabic
├── config.js        # i18n configuration
├── geolocation.js   # Auto-detect user language
└── sync-translations.cjs  # Sync script
```

## How It Works

### 1. Using Translations in Components
```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('home.trending')}</h1>
      <p>{t('home.mostPopularMovies')}</p>
    </div>
  );
}
```

### 2. Adding New Translation Keys

**Step 1:** Add the key to `locales/en.json` (English is the master file)
```json
{
  "home": {
    "trending": "Trending Now",
    "newKey": "My New Translation"
  }
}
```

**Step 2:** Run the sync script to propagate to all languages
```bash
cd src/i18n
node sync-translations.cjs
```

This will automatically add the English value to all other language files as a fallback.

**Step 3:** Update translations in other language files manually
```json
// locales/es.json
{
  "home": {
    "trending": "Tendencias Ahora",
    "newKey": "Mi Nueva Traducción"
  }
}
```

### 3. Translation Keys with Variables
```jsx
// Using variables in translations
t('personalizedRecs.basedOn', { genres: 'Action, Comedy' })
```

```json
{
  "personalizedRecs": {
    "basedOn": "Based on your love for {{genres}}"
  }
}
```

## Sync Script

The `sync-translations.cjs` script ensures all language files have the same structure as the English file.

### When to Run
- After adding new translation keys to `en.json`
- After deleting old translation keys
- When setting up a new language file

### How It Works
1. Reads the English translation file (source of truth)
2. For each language file:
   - Merges new keys from English
   - Keeps existing translations
   - Uses English value for missing translations
3. Writes updated files back

### Running the Script
```bash
cd src/i18n
node sync-translations.cjs
```

Output:
```
✓ Synced ar.json
✓ Synced de.json
✓ Synced es.json
✓ Synced fr.json
✓ Synced it.json
✓ Synced ja.json
✓ Synced ko.json
✓ Synced pt.json
✨ Translation sync complete!
```

## Language Detection

The app automatically detects the user's language based on:
1. Browser language settings
2. Geolocation (country)
3. Falls back to English if unsure

Users can manually change language using the language selector in the navbar.

## Best Practices

1. **Always add keys to English first** - `en.json` is the master file
2. **Run sync script** after updating English translations
3. **Use namespaces** to organize translations (e.g., `home.*`, `movie.*`, `auth.*`)
4. **Be specific with keys** - Use descriptive names like `home.trendingNow` instead of generic `trending`
5. **Test in multiple languages** to ensure UI looks good with different text lengths

## Common Translation Namespaces

- `nav.*` - Navigation items
- `home.*` - Home page content
- `movie.*` - Movie details, ratings, etc.
- `auth.*` - Login, register, password reset
- `common.*` - Shared UI elements (buttons, loading states, etc.)
- `errors.*` - Error messages
- `toasts.*` - Toast notifications
- `footer.*` - Footer content

## Troubleshooting

### Missing translations showing as keys
- Check if the key exists in `en.json`
- Run the sync script to update all language files
- Verify the component is using `t()` function correctly

### Translations not updating
- Clear browser cache
- Restart development server
- Check for typos in translation keys

### New language not working
1. Add the language file to `locales/` directory
2. Add language to the sync script's `languages` array
3. Update `config.js` to include the new language
4. Run the sync script

## Contributing Translations

To help translate Movies.to to your language:
1. Choose your language file from `locales/`
2. Find entries with English values
3. Replace with proper translations
4. Submit a pull request

**Note:** All language files already have complete key coverage thanks to the sync script, so you just need to replace English fallback values with proper translations.
