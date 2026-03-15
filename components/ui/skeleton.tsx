import { cn } from "@/lib/utils"

/**
 * Visual skeleton placeholder element used to indicate loading state.
 *
 * @param className - Additional class names to apply to the skeleton container.
 * @returns A div element with pulse animation, rounded corners, and accent background used as a skeleton.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-accent", className)}
      {...props}
    />
  )
}

export { Skeleton }
