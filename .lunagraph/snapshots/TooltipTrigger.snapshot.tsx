// @ts-nocheck
/* eslint-disable */
import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider } from '../../components/ui/tooltip'

export default function TooltipTriggerSnapshot({
  __onRender,
  props,
}: {
  props?: any
} & { __onRender?: (element: React.ReactElement) => void }) {

  const __element = (
    <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
  )

  // Create stable key from all props for dependency tracking
  // Use try-catch to handle non-serializable values (React elements, functions, etc.)
  const __propsKey = React.useMemo(() => {
    try {
      return JSON.stringify({ props }, (key, value) => {
        if (React.isValidElement(value)) return '[ReactElement]'
        if (typeof value === 'function') return '[Function]'
        return value
      })
    } catch { return String(Date.now()) }
  }, [props])

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