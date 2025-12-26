import { Loader2 } from 'lucide-react';

export default function LoadingMore({ message = 'Loading more...' }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}
