import { cn } from "@/lib/utils"

function Skeleton({
  className,
  shimmer = true,
  ...props
}) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted relative overflow-hidden",
        shimmer ? "shimmer-effect" : "animate-pulse",
        className
      )}
      {...props}
    >
      {shimmer && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}
    </div>
  )
}

export { Skeleton }
