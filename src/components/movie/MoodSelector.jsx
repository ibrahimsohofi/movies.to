import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Smile,
  Frown,
  Zap,
  Ghost,
  Coffee,
  Heart,
  Compass,
  Clock,
  Brain,
  Flame,
  Check,
} from 'lucide-react';

const MOODS = [
  {
    id: 'happy',
    name: 'Happy',
    icon: Smile,
    color: 'from-yellow-400 to-orange-400',
    bgColor: 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30',
    activeColor: 'bg-yellow-500/30 border-yellow-500',
    description: 'Comedy, Family, Animation',
  },
  {
    id: 'sad',
    name: 'Sad',
    icon: Frown,
    color: 'from-blue-400 to-indigo-400',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30',
    activeColor: 'bg-blue-500/30 border-blue-500',
    description: 'Drama, Romance',
  },
  {
    id: 'excited',
    name: 'Excited',
    icon: Zap,
    color: 'from-red-400 to-pink-400',
    bgColor: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30',
    activeColor: 'bg-red-500/30 border-red-500',
    description: 'Action, Adventure, Sci-Fi',
  },
  {
    id: 'scared',
    name: 'Scared',
    icon: Ghost,
    color: 'from-purple-400 to-violet-400',
    bgColor: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30',
    activeColor: 'bg-purple-500/30 border-purple-500',
    description: 'Horror, Thriller',
  },
  {
    id: 'relaxed',
    name: 'Relaxed',
    icon: Coffee,
    color: 'from-green-400 to-emerald-400',
    bgColor: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30',
    activeColor: 'bg-green-500/30 border-green-500',
    description: 'Documentary, History, Music',
  },
  {
    id: 'romantic',
    name: 'Romantic',
    icon: Heart,
    color: 'from-pink-400 to-rose-400',
    bgColor: 'bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/30',
    activeColor: 'bg-pink-500/30 border-pink-500',
    description: 'Romance, Comedy',
  },
  {
    id: 'adventurous',
    name: 'Adventurous',
    icon: Compass,
    color: 'from-teal-400 to-cyan-400',
    bgColor: 'bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/30',
    activeColor: 'bg-teal-500/30 border-teal-500',
    description: 'Adventure, Fantasy, Sci-Fi',
  },
  {
    id: 'nostalgic',
    name: 'Nostalgic',
    icon: Clock,
    color: 'from-amber-400 to-yellow-400',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30',
    activeColor: 'bg-amber-500/30 border-amber-500',
    description: 'Family, Animation, Comedy',
  },
  {
    id: 'thoughtful',
    name: 'Thoughtful',
    icon: Brain,
    color: 'from-slate-400 to-gray-400',
    bgColor: 'bg-slate-500/10 hover:bg-slate-500/20 border-slate-500/30',
    activeColor: 'bg-slate-500/30 border-slate-500',
    description: 'Drama, Mystery, Documentary',
  },
  {
    id: 'energetic',
    name: 'Energetic',
    icon: Flame,
    color: 'from-orange-400 to-red-400',
    bgColor: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30',
    activeColor: 'bg-orange-500/30 border-orange-500',
    description: 'Action, Crime, Thriller',
  },
];

export default function MoodSelector({
  selectedMood,
  onMoodChange,
  showDescriptions = true,
  variant = 'cards', // 'cards' | 'pills' | 'compact'
  className,
}) {
  if (variant === 'pills') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {MOODS.map(mood => {
          const Icon = mood.icon;
          const isSelected = selectedMood === mood.id;

          return (
            <Button
              key={mood.id}
              variant="outline"
              size="sm"
              onClick={() => onMoodChange(isSelected ? null : mood.id)}
              className={cn(
                'transition-all duration-200 border',
                isSelected
                  ? mood.activeColor
                  : mood.bgColor
              )}
            >
              <Icon className={cn(
                'h-4 w-4 mr-1.5',
                isSelected && 'text-foreground'
              )} />
              {mood.name}
              {isSelected && <Check className="h-3 w-3 ml-1.5" />}
            </Button>
          );
        })}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex gap-1 overflow-x-auto pb-2', className)}>
        {MOODS.map(mood => {
          const Icon = mood.icon;
          const isSelected = selectedMood === mood.id;

          return (
            <button
              key={mood.id}
              onClick={() => onMoodChange(isSelected ? null : mood.id)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border',
                isSelected
                  ? mood.activeColor
                  : mood.bgColor
              )}
            >
              <Icon className="h-3 w-3" />
              {mood.name}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: cards variant
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3', className)}>
      {MOODS.map(mood => {
        const Icon = mood.icon;
        const isSelected = selectedMood === mood.id;

        return (
          <button
            key={mood.id}
            onClick={() => onMoodChange(isSelected ? null : mood.id)}
            className={cn(
              'relative p-4 rounded-xl border transition-all duration-200 text-left group',
              isSelected
                ? mood.activeColor
                : mood.bgColor
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={cn(
                'p-1.5 rounded-lg bg-gradient-to-br',
                mood.color
              )}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              {isSelected && (
                <Check className="h-4 w-4 text-green-500 ml-auto" />
              )}
            </div>
            <p className="font-medium text-sm">{mood.name}</p>
            {showDescriptions && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {mood.description}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { MOODS };
