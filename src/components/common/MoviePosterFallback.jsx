import { Film } from 'lucide-react';

export default function MoviePosterFallback({ title, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 ${className}`}>
      <Film className="h-16 w-16 text-slate-500 mb-3" strokeWidth={1.5} />
      <p className="text-slate-400 text-sm font-medium text-center px-4 line-clamp-2">
        {title || 'No Image Available'}
      </p>
    </div>
  );
}
