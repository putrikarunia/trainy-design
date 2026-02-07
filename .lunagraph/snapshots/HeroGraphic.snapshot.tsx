// @ts-nocheck
/* eslint-disable */
import * as React from "react"

export default function HeroGraphicSnapshot({
  __onRender,
}: {
  
} & { __onRender?: (element: React.ReactElement) => void }) {

  const __element = (
    <div style={{
  "display": "flex",
  "flexDirection": "row",
  "alignItems": "center",
  "justifyContent": "flex-start"
}} className="relative">
      <div className="">
        <div className="w-32 h-32 rounded-2xl flex items-center justify-center bg-linear-to-br to-slate-300/0 border border-slate-800 from-slate-300/10">
          <img src="/.lunagraph-assets/logo-neptune.svg" alt="Neptune" width={80} height={80} className="grayscale opacity-50"></img>
        </div>
      </div>
      <div style={{
    "display": "flex",
    "flexDirection": "row",
    "gap": "0px",
    "alignItems": "center",
    "justifyContent": "flex-start"
  }}>
        <div className="w-8 h-px bg-border -translate-y-1/2"></div>
        <div className="w-2 h-2 rounded-full bg-border"></div>
      </div>
      <div className="relative z-10">
        <div className="rounded-2xl flex items-center justify-center bg-linear-to-br to-slate-300/0 border from-slate-300/20 w-48 h-48 text-[100px] border-glow-orange">
          🪐
        </div>
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