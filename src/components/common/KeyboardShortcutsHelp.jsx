import { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+Shift+? or Ctrl+/ to open shortcuts help
      if ((e.ctrlKey && e.shiftKey && e.key === '?') || (e.ctrlKey && e.key === '/')) {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 ${isRTL ? 'left-4' : 'right-4'} z-40 p-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all duration-300 hover:scale-110 group`}
        title="Keyboard Shortcuts (Ctrl+/)"
      >
        <Keyboard className="h-5 w-5 group-hover:animate-pulse" />
      </button>
    );
  }

  const shortcuts = [
    { keys: 'Ctrl + Shift + L', description: 'Cycle through all languages', category: 'Language' },
    { keys: 'Ctrl + Shift + R', description: 'Toggle RTL/LTR (Arabic ↔ English)', category: 'Language' },
    { keys: 'Ctrl + Shift + 1', description: 'Switch to English', category: 'Quick Switch' },
    { keys: 'Ctrl + Shift + 2', description: 'Switch to Spanish', category: 'Quick Switch' },
    { keys: 'Ctrl + Shift + 3', description: 'Switch to French', category: 'Quick Switch' },
    { keys: 'Ctrl + Shift + 4', description: 'Switch to German', category: 'Quick Switch' },
    { keys: 'Ctrl + Shift + 5', description: 'Switch to Portuguese', category: 'Quick Switch' },
    { keys: 'Ctrl + Shift + 6', description: 'Switch to Italian', category: 'Quick Switch' },
    { keys: 'Ctrl + Shift + 7', description: 'Switch to Japanese', category: 'Quick Switch' },
    { keys: 'Ctrl + Shift + 8', description: 'Switch to Korean', category: 'Quick Switch' },
    { keys: 'Ctrl + Shift + 9', description: 'Switch to Arabic', category: 'Quick Switch' },
    { keys: 'Ctrl + /', description: 'Show this help', category: 'General' },
    { keys: 'Esc', description: 'Close this help', category: 'General' },
  ];

  const categories = [...new Set(shortcuts.map(s => s.category))];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-red-500/20 shadow-2xl ${isRTL ? 'slide-in-rtl' : 'slide-in-ltr'}`}>
        <div className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border/40 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600/10 rounded-lg">
              <Keyboard className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-muted-foreground">
                Quick actions to navigate and switch languages
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="rounded-full hover:bg-red-600/10 hover:text-red-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3 text-red-600">{category}</h3>
              <div className="space-y-2">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="px-3 py-1.5 bg-background border border-border/50 rounded-md text-sm font-mono shadow-sm whitespace-nowrap">
                        {shortcut.keys}
                      </kbd>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-background/95 backdrop-blur-xl border-t border-border/40 p-4">
          <p className="text-xs text-center text-muted-foreground">
            Press <kbd className="px-2 py-1 bg-muted border border-border/50 rounded text-xs font-mono">Esc</kbd> to close this panel
          </p>
        </div>
      </Card>
    </div>
  );
}
