# Network Error Translation Fix

## Problem
The error message "Network error. Please check your internet connection." on the `/quizzes` page (and other pages) was not translating to Arabic or other languages. It remained in English regardless of the user's selected language.

## Root Cause
The error messages were **hardcoded in English** in the `src/services/api.js` file instead of using the i18n translation system.

Specifically, line 50 of `api.js` had:
```javascript
toast.error('Network error. Please check your internet connection.');
```

This was one of many hardcoded error messages in the API interceptor.

## Solution

### 1. Added i18n Import
Added the i18n instance import to `src/services/api.js`:
```javascript
import i18n from '@/i18n/config';
```

### 2. Replaced All Hardcoded Error Messages
Updated all error messages in the axios response interceptor to use translation keys:

- **Network Error (line 50)**:
  - Before: `'Network error. Please check your internet connection.'`
  - After: `i18n.t('errors.networkErrorDesc')`

- **400 Bad Request**:
  - After: `i18n.t('errors.badRequest', 'Bad request. Please check your input.')`

- **401 Unauthorized**:
  - After: `i18n.t('errors.sessionExpired', 'Session expired. Please login again.')`

- **403 Forbidden**:
  - After: `i18n.t('errors.accessDenied', 'Access denied. You don\'t have permission to perform this action.')`

- **409 Conflict**:
  - After: `i18n.t('errors.conflict', 'Conflict. Resource already exists.')`

- **422 Validation Error**:
  - After: `i18n.t('errors.validationError', 'Validation error. Please check your input.')`

- **429 Rate Limit**:
  - After: `i18n.t('errors.tooManyRequests', 'Too many requests. Please slow down and try again later.')`

- **5xx Server Errors**:
  - After: `i18n.t('errors.serverErrorDesc')`

- **Default/Unexpected Errors**:
  - After: `i18n.t('errors.unexpectedError')`

### 3. Added Missing Translation Keys
Added 6 new error translation keys to all 9 language files:

- English (`en.json`)
- Arabic (`ar.json`)
- Spanish (`es.json`)
- French (`fr.json`)
- German (`de.json`)
- Italian (`it.json`)
- Japanese (`ja.json`)
- Korean (`ko.json`)
- Portuguese (`pt.json`)

**New keys added:**
```json
{
  "errors": {
    "badRequest": "...",
    "sessionExpired": "...",
    "accessDenied": "...",
    "conflict": "...",
    "validationError": "...",
    "tooManyRequests": "..."
  }
}
```

## Testing
To test the fix:

1. **Switch to Arabic**:
   - Click the language selector (flag icon) in the navbar
   - Select Arabic (العربية)

2. **Trigger a Network Error**:
   - Navigate to `/quizzes` page
   - Turn off your internet connection or backend server
   - The error message should now display in Arabic: "تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت."

3. **Test Other Languages**:
   - Repeat for Spanish, French, German, etc.
   - All error messages should translate correctly

## Files Modified
1. `src/services/api.js` - Added i18n import and replaced all hardcoded error messages
2. `src/i18n/locales/en.json` - Added 6 new error keys
3. `src/i18n/locales/ar.json` - Added Arabic translations
4. `src/i18n/locales/es.json` - Added Spanish translations
5. `src/i18n/locales/fr.json` - Added French translations
6. `src/i18n/locales/de.json` - Added German translations
7. `src/i18n/locales/it.json` - Added Italian translations
8. `src/i18n/locales/ja.json` - Added Japanese translations
9. `src/i18n/locales/ko.json` - Added Korean translations
10. `src/i18n/locales/pt.json` - Added Portuguese translations

## Impact
- ✅ All API error messages now properly translate
- ✅ Network errors display in user's selected language
- ✅ Better user experience for non-English speakers
- ✅ Consistent error messaging across the application
- ✅ No breaking changes to existing functionality

## Arabic Translation Examples

| English | Arabic |
|---------|--------|
| Network error. Please check your internet connection. | تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت. |
| Session expired. Please login again. | انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى. |
| Access denied. You don't have permission to perform this action. | تم رفض الوصول. ليس لديك إذن لتنفيذ هذا الإجراء. |
| Too many requests. Please slow down and try again later. | عدد كبير جداً من الطلبات. يرجى التخفيف والمحاولة مرة أخرى لاحقاً. |
