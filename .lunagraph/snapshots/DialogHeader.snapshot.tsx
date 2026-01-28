// @ts-nocheck
/* eslint-disable */
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from '../../components/ui/dialog'

export default function DialogHeaderSnapshot({
  __onRender,
  className,
  props,
}: {
  className?: string
  props?: any
} & { __onRender?: (element: React.ReactElement) => void }) {

  const __element = (
    <div data-slot="dialog-header" className={cn("flex flex-col gap-2 text-center sm:text-left", className)} {...props} />
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