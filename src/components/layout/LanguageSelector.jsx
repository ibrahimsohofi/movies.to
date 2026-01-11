import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const languages = [
  { code: 'en', name: 'English', flag: 'gb' },
  { code: 'es', name: 'Español', flag: 'es' },
  { code: 'fr', name: 'Français', flag: 'fr' },
  { code: 'de', name: 'Deutsch', flag: 'de' },
  { code: 'pt', name: 'Português', flag: 'pt' },
  { code: 'it', name: 'Italiano', flag: 'it' },
  { code: 'ja', name: '日本語', flag: 'jp' },
  { code: 'ko', name: '한국어', flag: 'kr' },
  { code: 'ar', name: 'العربية', flag: 'sa' },
];

export default function LanguageSelector({ variant = 'icon' }) {
  const { i18n, t } = useTranslation();

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = async (languageCode) => {
    await i18n.changeLanguage(languageCode);

    // Store as user's manual selection (overrides geolocation)
    localStorage.setItem('i18nextLng', languageCode);
    localStorage.removeItem('i18nextLng_auto');

    // Set RTL direction for Arabic, LTR for other languages
    if (languageCode === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.classList.remove('rtl');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'full' ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start hover:bg-muted/80 transition-all focus:outline-none focus-visible:ring-0"
          >
            <span className={`fi fi-${currentLanguage.flag} mr-3 text-xl`}></span>
            <span>{currentLanguage.name}</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-muted/80 transition-all duration-300 hover:scale-110 focus:outline-none focus-visible:ring-0"
            title={`Change Language - ${currentLanguage.name}`}
          >
            <span className={`fi fi-${currentLanguage.flag} text-xl`}></span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t('common.selectLanguage') || 'Select Language'}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`cursor-pointer ${
              currentLanguage.code === language.code ? 'bg-muted font-semibold' : ''
            }`}
          >
            <span className={`fi fi-${language.flag} mr-3 text-lg`}></span>
            <span className="flex-1">{language.name}</span>
            {currentLanguage.code === language.code && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
