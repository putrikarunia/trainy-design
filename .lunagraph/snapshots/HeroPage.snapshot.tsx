// @ts-nocheck
/* eslint-disable */
import * as React from "react"

export default function HeroPageSnapshot({
  __onRender,
}: {
  
} & { __onRender?: (element: React.ReactElement) => void }) {

  const __element = (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Eyebrow */}
            <p className="text-sm font-semibold tracking-widest text-primary uppercase">
              Hero Section
            </p>

            {/* Headline */}
            <div className="space-y-2">
              <h1 className="text-5xl font-bold tracking-tight text-foreground">
                Neptune is sunsetting.
              </h1>
              <h1 className="text-5xl font-bold tracking-tight text-foreground">
                Your experiments don't have to.
              </h1>
            </div>

            {/* Description */}
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              Migrate your ML experiment tracking to Pluto — a maintained,
              high-performance alternative with dual-logging support for a
              seamless transition.
            </p>

            {/* CTA Button */}
            <button className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors">
              Start your migration
            </button>
          </div>

          {/* Right Graphic */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Neptune Logo (faded/background) */}
              <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-30">
                <div className="w-32 h-32 rounded-2xl bg-muted flex items-center justify-center">
                  <img src="/.lunagraph-assets/logo-neptune.svg" alt="Neptune" width={80} height={80} className="opacity-50" />
                </div>
              </div>

              {/* Pluto Logo (prominent/foreground) */}
              <div className="relative z-10 ml-16">
                <div className="w-48 h-48 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xl">
                  <span className="text-8xl">🪐</span>
                </div>
              </div>

              {/* Connector line decoration */}
              <div className="absolute top-1/2 left-16 w-8 h-px bg-border -translate-y-1/2" />
              <div className="absolute top-1/2 left-16 w-2 h-2 rounded-full bg-border -translate-y-1/2 -translate-x-1" />
            </div>
          </div>
        </div>
      </section>
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