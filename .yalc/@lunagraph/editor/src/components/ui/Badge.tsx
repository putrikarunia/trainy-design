import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium transition-colors",
        {
          "bg-ed-primary text-ed-primary-foreground": variant === "default",
          "bg-ed-secondary text-ed-secondary-foreground": variant === "secondary",
          "border border-ed-border bg-ed-background text-ed-foreground": variant === "outline",
          "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400": variant === "warning",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }

