// @ts-nocheck
/* eslint-disable */
import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarBadge, AvatarGroup, AvatarGroupCount } from '../../components/ui/avatar'

export default function AvatarFallbackSnapshot({
  __onRender,
  className,
  props,
}: {
  className?: string | undefined
  props?: any
} & { __onRender?: (element: React.ReactElement) => void }) {

  const __element = (
    <AvatarPrimitive.Fallback data-slot="avatar-fallback" className={cn("bg-muted text-muted-foreground flex size-full items-center justify-center rounded-full text-sm group-data-[size=sm]/avatar:text-xs", className)} {...props} />
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