import { cn } from "@/lib/utils";

interface SparkProps {
  className?: string;
}

/** Decorative four-point spark echoing the Idea Spark mark. Not a logo substitute. */
export function Spark({ className }: SparkProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("h-6 w-6 text-lime-300", className)}>
      <path
        fill="currentColor"
        d="M12 0c.6 0 1 .4 1.1 1 .9 5.6 4.3 9 9.9 9.9.6.1 1 .5 1 1.1s-.4 1-1 1.1c-5.6.9-9 4.3-9.9 9.9-.1.6-.5 1-1.1 1s-1-.4-1.1-1C10 17.4 6.6 14 1 13.1.4 13 0 12.6 0 12s.4-1 1-1.1C6.6 10 10 6.6 10.9 1 11 .4 11.4 0 12 0Z"
      />
    </svg>
  );
}
