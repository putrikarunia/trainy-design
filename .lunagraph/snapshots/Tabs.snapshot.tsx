// @ts-nocheck
/* eslint-disable */
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs'

const tabsListVariants = cva("rounded-lg p-[3px] group-data-[orientation=horizontal]/tabs:h-9 data-[variant=line]:rounded-none group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col", {
  variants: {
    variant: {
      default: "bg-muted",
      line: "gap-1 bg-transparent"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export default function TabsSnapshot({
  __onRender,
  className,
  orientation = "horizontal",
  props,
}: {
  className?: string | undefined
  orientation?: "horizontal" | "vertical"
  props?: any
} & { __onRender?: (element: React.ReactElement) => void }) {

  const __element = (
    <TabsPrimitive.Root data-slot="tabs" data-orientation={orientation} orientation={orientation} className={cn("group/tabs flex gap-2 data-[orientation=horizontal]:flex-col", className)} {...props} />
  )

  // Create stable key from all props for dependency tracking
  // Use try-catch to handle non-serializable values (React elements, functions, etc.)
  const __propsKey = React.useMemo(() => {
    try {
      return JSON.stringify({ className, orientation, props }, (key, value) => {
        if (React.isValidElement(value)) return '[ReactElement]'
        if (typeof value === 'function') return '[Function]'
        return value
      })
    } catch { return String(Date.now()) }
  }, [className, orientation, props])

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