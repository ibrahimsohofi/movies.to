import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';

// Common reaction emojis for quick access
const QUICK_REACTIONS = [
  { emoji: '👍', label: 'thumbs up' },
  { emoji: '❤️', label: 'heart' },
  { emoji: '😂', label: 'laugh' },
  { emoji: '😮', label: 'wow' },
  { emoji: '😢', label: 'sad' },
  { emoji: '😡', label: 'angry' },
  { emoji: '🔥', label: 'fire' },
  { emoji: '👏', label: 'clap' },
];

// Extended emoji categories
const EMOJI_CATEGORIES = {
  'Faces': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😛', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬'],
  'Gestures': ['👍', '👎', '👌', '🤌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  'Celebration': ['🎉', '🎊', '🎈', '🎁', '🎂', '🍾', '🥳', '🎆', '🎇', '✨', '🌟', '⭐', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️'],
  'Movie': ['🎬', '🎥', '📽️', '🎞️', '📺', '📹', '🍿', '🎭', '🎪', '🎤', '🎧', '🎼', '🎵', '🎶', '🔊', '📢'],
  'Food': ['🍕', '🍔', '🍟', '🌭', '🍿', '🧀', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥨', '🥯', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯'],
};

export default function EmojiPicker({ onSelect, variant = 'outline', size = 'icon' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Faces');

  const handleSelect = (emoji) => {
    onSelect(emoji);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size} className="shrink-0">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {/* Quick reactions */}
        <div className="p-2 border-b">
          <div className="flex gap-1 justify-center">
            {QUICK_REACTIONS.map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => handleSelect(emoji)}
                className="text-xl p-1.5 hover:bg-muted rounded-md transition-colors"
                title={label}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 p-2 border-b overflow-x-auto">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs shrink-0"
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Emoji grid */}
        <div className="p-2 h-48 overflow-y-auto">
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_CATEGORIES[activeCategory].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelect(emoji)}
                className="text-lg p-1 hover:bg-muted rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Floating reaction component for quick reactions during playback
export function FloatingReactions({ onReact }) {
  const reactions = ['👍', '❤️', '😂', '😮', '🔥', '👏'];

  return (
    <div className="flex gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
      {reactions.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="text-lg p-1 hover:scale-125 transition-transform"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

// Animated reaction bubble that floats up
export function ReactionBubble({ emoji, onComplete }) {
  const [position, setPosition] = useState({ x: Math.random() * 80 + 10, opacity: 1 });

  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="absolute text-3xl animate-float-up pointer-events-none"
      style={{
        left: `${position.x}%`,
        bottom: '100px',
      }}
    >
      {emoji}
    </div>
  );
}
