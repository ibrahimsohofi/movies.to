import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Notification component that appears when language is auto-detected
 * Shows only on first visit or when geolocation sets the language
 */
export default function LanguageNotification() {
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if language was auto-detected and user hasn't dismissed the notification
    const autoDetected = localStorage.getItem('i18nextLng_auto');
    const notificationDismissed = sessionStorage.getItem('language_notification_dismissed');

    if (autoDetected && !notificationDismissed) {
      // Show notification after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const dismissNotification = () => {
    setIsVisible(false);
    sessionStorage.setItem('language_notification_dismissed', 'true');
  };

  if (!isVisible) return null;

  const currentLanguageName = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    pt: 'Português',
    it: 'Italiano',
    ja: '日本語',
    ko: '한국어',
    ar: 'العربية'
  }[i18n.language] || 'English';

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-card border border-border shadow-lg rounded-lg p-4 flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground mb-1">
            {t('common.languageDetected') || 'Language Detected'}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('common.languageAutoSet', { language: currentLanguageName }) ||
              `We've set your language to ${currentLanguageName} based on your location. You can change this anytime.`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full hover:bg-muted"
          onClick={dismissNotification}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
