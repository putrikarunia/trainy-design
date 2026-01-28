// @ts-nocheck
/* eslint-disable */
import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";
import { AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount } from '../../components/ui/avatar'

export default function AvatarSnapshot({
  __onRender,
  className,
  size = "default",
  props,
}: {
  className?: string | undefined
  size?: "default" | "sm" | "lg"
  props?: any
} & { __onRender?: (element: React.ReactElement) => void }) {

  const __element = (
    <AvatarPrimitive.Root data-slot="avatar" data-size={size} className={cn("group/avatar relative flex size-8 shrink-0 overflow-hidden rounded-full select-none data-[size=lg]:size-10 data-[size=sm]:size-6", className)} {...props} />
  )

  // Create stable key from all props for dependency tracking
  // Use try-catch to handle non-serializable values (React elements, functions, etc.)
  const __propsKey = React.useMemo(() => {
    try {
      return JSON.stringify({ className, size, props }, (key, value) => {
        if (React.isValidElement(value)) return '[ReactElement]'
        if (typeof value === 'function') return '[Function]'
        return value
      })
    } catch { return String(Date.now()) }
  }, [className, size, props])

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