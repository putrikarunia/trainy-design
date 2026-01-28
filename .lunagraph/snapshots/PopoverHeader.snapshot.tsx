// @ts-nocheck
/* eslint-disable */
import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverTitle, PopoverDescription } from '../../components/ui/popover'

export default function PopoverHeaderSnapshot({
  __onRender,
  className,
  props,
}: {
  className?: string
  props?: any
} & { __onRender?: (element: React.ReactElement) => void }) {

  const __element = (
    <div data-slot="popover-header" className={cn("flex flex-col gap-1 text-sm", className)} {...props} />
  )

  // Create stable key from all props for dependency tracking
  // Use try-catch to handle non-serializable values (React elements, functions, etc.)
  const __propsKey = React.useMemo(() => {
    try {
      return JSON.stringify({ className, props }, (key, value) => {
        if (React.isValidElement(value)) return '[ReactElement]'
        if (typeof value === 'function') return '[Function]'
        return value
      })
    } catch { return String(Date.now()) }
  }, [className, props])

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