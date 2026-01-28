// @ts-nocheck
/* eslint-disable */
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from '../../components/ui/dialog'

export default function DialogFooterSnapshot({
  __onRender,
  className,
  showCloseButton = false,
  children,
  props,
}: {
  className?: string
  showCloseButton?: boolean
  children?: React.ReactNode
  props?: any
} & { __onRender?: (element: React.ReactElement) => void }) {

  const __element = (
    <div data-slot="dialog-footer" className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props}>
      {children}
      {showCloseButton && <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>}
    </div>
  )

  // Create stable key from all props for dependency tracking
  // Use try-catch to handle non-serializable values (React elements, functions, etc.)
  const __propsKey = React.useMemo(() => {
    try {
      return JSON.stringify({ className, showCloseButton, children, props }, (key, value) => {
        if (React.isValidElement(value)) return '[ReactElement]'
        if (typeof value === 'function') return '[Function]'
        return value
      })
    } catch { return String(Date.now()) }
  }, [className, showCloseButton, children, props])

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