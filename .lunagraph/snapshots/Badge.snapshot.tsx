// @ts-nocheck
/* eslint-disable */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center justify-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
      destructive: "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
      outline: "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      link: "text-primary underline-offset-4 [a&]:hover:underline"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export default function BadgeSnapshot({
  __onRender,
  className,
  variant = "default",
  asChild = false,
  props,
}: {
  className?: string | undefined
  variant?: "link" | "default" | "secondary" | "destructive" | "outline" | "ghost" | null
  asChild?: boolean
  props?: any
} & { __onRender?: (element: React.ReactElement) => void }) {
  const Comp = asChild ? Slot : "span";

  const __element = (
    <Comp data-slot="badge" data-variant={variant} className={cn(badgeVariants({
  variant
}), className)} {...props} />
  )

  // Create stable key from all props for dependency tracking
  // Use try-catch to handle non-serializable values (React elements, functions, etc.)
  const __propsKey = React.useMemo(() => {
    try {
      return JSON.stringify({ className, variant, asChild, props }, (key, value) => {
        if (React.isValidElement(value)) return '[ReactElement]'
        if (typeof value === 'function') return '[Function]'
        return value
      })
    } catch { return String(Date.now()) }
  }, [className, variant, asChild, props])

  // Pass element tree to parent via callback when props change
  // Use useLayoutEffect to ensure we capture the tree before paint
  React.useLayoutEffect(() => {
    if (__onRender) {
      __onRender(__element)
    }
  }, [__propsKey, __onRender])

  // Return the actual element for rendering in canvas
  return __element
}