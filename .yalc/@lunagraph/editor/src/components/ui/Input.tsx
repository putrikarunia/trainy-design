import * as React from "react"
import { cn } from "../../lib/utils"


function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "text-ed-foreground file:text-ed-foreground placeholder:text-ed-muted-foreground selection:bg-ed-primary selection:text-ed-primary-foreground dark:bg-ed-input/30 border-ed-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ed-ring focus-visible:ring-ed-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-ed-destructive/20 dark:aria-invalid:ring-ed-destructive/40 aria-invalid:border-ed-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
