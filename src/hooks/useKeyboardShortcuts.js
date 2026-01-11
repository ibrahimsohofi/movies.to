import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const languages = ['en', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'ko', 'ar'];

export default function useKeyboardShortcuts() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+Shift+L: Cycle through languages
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        const currentIndex = languages.indexOf(i18n.language);
        const nextIndex = (currentIndex + 1) % languages.length;
        const nextLanguage = languages[nextIndex];

        i18n.changeLanguage(nextLanguage);
        localStorage.setItem('i18nextLng', nextLanguage);

        // Set RTL for Arabic
        if (nextLanguage === 'ar') {
          document.documentElement.dir = 'rtl';
          document.documentElement.classList.add('rtl');
        } else {
          document.documentElement.dir = 'ltr';
          document.documentElement.classList.remove('rtl');
        }

        // Show toast notification
        console.log(`Language switched to: ${nextLanguage.toUpperCase()}`);
      }

      // Ctrl+Shift+R: Toggle RTL/LTR (cycles between English and Arabic)
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        const newLanguage = i18n.language === 'ar' ? 'en' : 'ar';

        i18n.changeLanguage(newLanguage);
        localStorage.setItem('i18nextLng', newLanguage);

        if (newLanguage === 'ar') {
          document.documentElement.dir = 'rtl';
          document.documentElement.classList.add('rtl');
        } else {
          document.documentElement.dir = 'ltr';
          document.documentElement.classList.remove('rtl');
        }

        console.log(`Direction toggled: ${newLanguage === 'ar' ? 'RTL' : 'LTR'}`);
      }

      // Ctrl+Shift+1-9: Switch to specific language
      if (e.ctrlKey && e.shiftKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < languages.length) {
          const targetLanguage = languages[index];

          i18n.changeLanguage(targetLanguage);
          localStorage.setItem('i18nextLng', targetLanguage);

          if (targetLanguage === 'ar') {
            document.documentElement.dir = 'rtl';
            document.documentElement.classList.add('rtl');
          } else {
            document.documentElement.dir = 'ltr';
            document.documentElement.classList.remove('rtl');
          }

          console.log(`Language switched to: ${targetLanguage.toUpperCase()}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [i18n]);
}
