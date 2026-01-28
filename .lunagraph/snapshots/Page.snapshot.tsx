// @ts-nocheck
/* eslint-disable */
import * as React from "react"
import Link from "next/link";

export default function HomeSnapshot({
  __onRender,
}: {
  
} & { __onRender?: (element: React.ReactElement) => void }) {

  const __element = (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Lunagraph Starter</h1>
        <p className="text-muted-foreground max-w-md">
          Visual React component editor. Design and edit components on a canvas, then export to code.
        </p>
      </div>
      
      <Link href="/editor" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors">
        Open Editor
      </Link>

      <div className="text-sm text-muted-foreground space-y-1 text-center">
        <p>Run both servers to start:</p>
        <code className="bg-muted px-2 py-1 rounded text-xs">pnpm dev:all</code>
      </div>
    </div>
  )

  // Create stable key from all props for dependency tracking
  // Use try-catch to handle non-serializable values (React elements, functions, etc.)
  const __propsKey = React.useMemo(() => {
    try {
      return JSON.stringify({  }, (key, value) => {
        if (React.isValidElement(value)) return '[ReactElement]'
        if (typeof value === 'function') return '[Function]'
        return value
      })
    } catch { return String(Date.now()) }
  }, [])

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