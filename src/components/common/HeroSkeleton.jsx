import { Skeleton } from '@/components/ui/skeleton';

export default function HeroSkeleton() {
  return (
    <div className="relative h-[70vh] w-full overflow-hidden bg-background">
      {/* Backdrop */}
      <Skeleton className="absolute inset-0" />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
        <div className="container mx-auto max-w-7xl space-y-4">
          {/* Title */}
          <Skeleton className="h-12 w-3/4 md:w-1/2" />

          {/* Description */}
          <Skeleton className="h-6 w-full md:w-2/3" />
          <Skeleton className="h-6 w-2/3 md:w-1/2" />

          {/* Metadata */}
          <div className="flex items-center gap-4 pt-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-4 pt-4">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
