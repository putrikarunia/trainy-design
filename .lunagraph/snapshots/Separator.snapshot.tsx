// @ts-nocheck
/* eslint-disable */
import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

export default function SeparatorSnapshot({
  __onRender,
  className,
  orientation = "horizontal",
  decorative = true,
  props,
}: {
  className?: string | undefined
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
  props?: any
} & { __onRender?: (element: React.ReactElement) => void }) {

  const __element = (
    <SeparatorPrimitive.Root data-slot="separator" decorative={decorative} orientation={orientation} className={cn("bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px", className)} {...props} />
  )

  // Create stable key from all props for dependency tracking
  // Use try-catch to handle non-serializable values (React elements, functions, etc.)
  const __propsKey = React.useMemo(() => {
    try {
      return JSON.stringify({ className, orientation, decorative, props }, (key, value) => {
        if (React.isValidElement(value)) return '[ReactElement]'
        if (typeof value === 'function') return '[Function]'
        return value
      })
    } catch { return String(Date.now()) }
  }, [className, orientation, decorative, props])

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