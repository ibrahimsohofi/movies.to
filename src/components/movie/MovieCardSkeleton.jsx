import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function MovieCardSkeleton() {
  return (
    <Card className="overflow-hidden group cursor-pointer">
      {/* Poster */}
      <Skeleton className="w-full aspect-[2/3]" />

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />

        {/* Rating and Year */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>

        {/* Button */}
        <Skeleton className="h-9 w-full" />
      </div>
    </Card>
  );
}
