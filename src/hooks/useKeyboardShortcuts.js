import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useThemeStore } from '@/store/useStore';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { toggleTheme } = useThemeStore();

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Only trigger if not typing in an input/textarea
      const isTyping =
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.isContentEditable;

      if (isTyping) return;

      // Keyboard shortcuts
      const shortcuts = {
        // Navigation shortcuts
        'h': () => {
          navigate('/');
          toast.success('Navigated to Home');
        },
        'b': () => {
          navigate('/browse');
          toast.success('Navigated to Browse');
        },
        's': () => {
          navigate('/search');
          toast.success('Navigated to Search');
        },
        'w': () => {
          navigate('/watchlist');
          toast.success('Navigated to Watchlist');
        },
        'g': () => {
          navigate('/genres');
          toast.success('Navigated to Genres');
        },
        'd': () => {
          navigate('/dashboard');
          toast.success('Navigated to Dashboard');
        },

        // UI shortcuts
        't': () => {
          toggleTheme();
          toast.success('Theme toggled');
        },

        // Help shortcut
        '?': () => {
          showShortcutsHelp();
        },
      };

      // Check if the key combination matches
      const key = event.key.toLowerCase();

      // Handle Ctrl/Cmd + key combinations
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();

        if (key === 'k') {
          // Quick search
          navigate('/search');
          // Focus search input after navigation
          setTimeout(() => {
            const searchInput = document.querySelector('input[type="search"]');
            if (searchInput) searchInput.focus();
          }, 100);
          toast.success('Quick Search');
        } else if (key === '/') {
          navigate('/search');
        }
      } else if (shortcuts[key]) {
        event.preventDefault();
        shortcuts[key]();
      }
    };

    const showShortcutsHelp = () => {
      toast.info(
        `Keyboard Shortcuts:
        H - Home
        B - Browse
        S - Search
        W - Watchlist
        G - Genres
        D - Dashboard
        T - Toggle Theme
        Ctrl/⌘ + K - Quick Search
        ? - Show this help`,
        { duration: 5000 }
      );
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [navigate, toggleTheme]);
}
