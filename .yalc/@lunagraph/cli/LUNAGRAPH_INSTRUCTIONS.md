# Lunagraph Component Guidelines

When creating or editing React components in this project, follow these rules so Lunagraph can scan and edit them visually.

## Component Structure

- **One component per file** - Each component in its own `.tsx` file
- **Named exports only** - Use `export function Button()`, NOT `export default`
- **Match filename to component** - `Button.tsx` exports `Button`

## Props

- **Type all props** with TypeScript interfaces
- **Use string unions for variants** - Creates dropdowns in the editor:
  ```tsx
  variant?: 'primary' | 'secondary' | 'ghost'
  ```
- **Keep props simple** - Strings, numbers, booleans work best
- **Avoid complex objects** - Flatten into simpler props when possible

## Example

```tsx
// components/Card.tsx
interface CardProps {
  title: string
  description?: string
  variant?: 'default' | 'outlined' | 'elevated'
  children?: React.ReactNode
}

export function Card({ title, description, variant = 'default', children }: CardProps) {
  return (
    <div className={cn('rounded-lg p-4', variantStyles[variant])}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {children}
    </div>
  )
}
```

## Scanned Locations

Lunagraph scans these directories by default:
- `components/**/*.tsx`
- `app/components/**/*.tsx`
- `src/components/**/*.tsx`

To scan a custom path:
```bash
pnpm exec lunagraph scan ./src/ui --output .lunagraph
```

## Save to Code

When editing components visually and clicking "Save to code":
- Lunagraph uses Claude CLI (if available) to merge changes back
- It preserves all imports, hooks, logic, and expressions
- Only the visual changes (styles, text, structure) are applied

---

## CSS Setup (Important!)

The editor ships with its own CSS (`@lunagraph/editor/styles.css`) that includes:
- Tailwind theme configuration
- Light and dark mode CSS variables
- Base styles and utilities

### Import Order in `app/layout.tsx`

Import editor styles **BEFORE** your globals/Tailwind:

```tsx
// ✅ Correct order - Tailwind comes LAST so responsive variants win
import "@lunagraph/editor/styles.css";
import "./globals.css"; // Contains @tailwind directives

// ❌ Wrong order - responsive variants get overridden
import "./globals.css";
import "@lunagraph/editor/styles.css";
```

This ensures Tailwind's responsive variants (`md:`, `lg:`, etc.) load after component styles and take precedence in the CSS cascade.

### Tailwind v4: Add `@source` directives in `globals.css`

```css
@import "tailwindcss";
@import "tw-animate-css";

/* Scan Lunagraph editor package for Tailwind classes */
@source "../../node_modules/@lunagraph/editor/src/**/*.{ts,tsx}";
/* Scan Lunagraph canvas files for Tailwind classes */
@source "../.lunagraph/**/*.json";

@custom-variant dark (&:is(.dark *));

/* ... rest of your theme and styles */
```

Also add these utilities used by the editor:

```css
@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

### Tailwind v3: Configure `tailwind.config.js`

```js
// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@lunagraph/editor/src/**/*.{js,ts,jsx,tsx}",
    "./.lunagraph/**/*.json",
  ],
  // ... rest of your config
}
```

---

## Adding Icon Libraries

Lunagraph supports any React icon library. Icons appear in a searchable panel and generate proper imports in code.

### Lucide Icons

```tsx
import * as LucideIcons from "lucide-react";
import { LUCIDE_PROPS_SCHEMA } from "@lunagraph/editor";

<LunagraphEditor
  // ...other props
  iconLibraries={{
    "lucide-react": {
      icons: LucideIcons,
      displayName: "Lucide",
      defaultProps: { size: 24 },
      propsSchema: LUCIDE_PROPS_SCHEMA,
    }
  }}
/>
```

### Phosphor Icons

```tsx
import * as PhosphorIcons from "@phosphor-icons/react";
import { PHOSPHOR_PROPS_SCHEMA } from "@lunagraph/editor";

<LunagraphEditor
  // ...other props
  iconLibraries={{
    "@phosphor-icons/react": {
      icons: PhosphorIcons,
      displayName: "Phosphor",
      defaultProps: { size: 24, weight: "regular" },
      propsSchema: PHOSPHOR_PROPS_SCHEMA,
    }
  }}
/>
```

### Multiple Libraries

```tsx
iconLibraries={{
  "lucide-react": { icons: LucideIcons, displayName: "Lucide", ... },
  "@phosphor-icons/react": { icons: PhosphorIcons, displayName: "Phosphor", ... }
}}
```

---

## Read-Only Mode (Required for Production)

The read-only editor page is **required** for production deployments. It allows users to view designs and component structures without needing the dev server.

### Step 1: Add build scripts to `package.json`

```json
{
  "scripts": {
    "scan": "lunagraph scan",
    "generate-snapshots": "lunagraph generate-snapshots",
    "prebuild": "pnpm scan && pnpm generate-snapshots",
    "lunagraph:server": "lunagraph-dev"
  }
}
```

### Step 2: Create `app/editor-read-only/page.tsx` (REQUIRED)

```tsx
'use client'

import '@lunagraph/editor/styles.css';
import { LunagraphEditor, LUCIDE_PROPS_SCHEMA, type FEElement } from "@lunagraph/editor";
import * as lunagraph from '../../.lunagraph/components';
import { snapshots } from '../../.lunagraph/snapshots';
import snapshotMetadata from '../../.lunagraph/snapshots/metadata.json';
import canvasData from '../../.lunagraph/canvases/canvas-1/canvas.json'
import * as LucideIcons from "lucide-react";

export default function EditorReadOnly() {
  return (
    <LunagraphEditor
      {...lunagraph}
      components={lunagraph.components}
      snapshots={snapshots}
      snapshotMetadata={snapshotMetadata}
      initialElements={canvasData.elements as FEElement[]}
      iconLibraries={{
        "lucide-react": {
          icons: LucideIcons,
          displayName: "Lucide",
          defaultProps: { size: 24 },
          propsSchema: LUCIDE_PROPS_SCHEMA,
        }
      }}
      readOnly
    />
  )
}
```

**Important props for read-only mode:**
- `snapshots` - Pre-generated snapshot components
- `snapshotMetadata` - Metadata for component viewing (from `metadata.json`)
- `initialElements` - Canvas data to display
- `readOnly` - Disables editing

Read-only mode:
- Disables drag-and-drop, resizing, and editing
- Allows double-click to view component layers and code
- Works without the dev server running
- Perfect for stakeholder review and production deployments

---

## Deploying to Vercel

For Vercel deployments, the `prebuild` script automatically generates snapshots before building.

### Option 1: Use `prebuild` script (Recommended)

```json
{
  "scripts": {
    "prebuild": "pnpm scan && pnpm generate-snapshots",
    "build": "next build"
  }
}
```

### Option 2: Configure in `vercel.json`

```json
{
  "buildCommand": "pnpm scan && pnpm generate-snapshots && pnpm build"
}
```

### What gets generated

- `.lunagraph/snapshots/*.snapshot.tsx` - Snapshot components
- `.lunagraph/snapshots/metadata.json` - Metadata for read-only mode
- `.lunagraph/snapshots/index.ts` - Snapshot exports

These are bundled into production, enabling the read-only editor without a dev server.

---

## Share Links

Share links let you link directly to a specific element:

```
https://yoursite.com/editor?element=element-id-here
```

The canvas will automatically center on the element when opened.

---

## Editor Page Setup

Create `app/editor/page.tsx`:

```tsx
'use client'

import '@lunagraph/editor/styles.css';
import { LunagraphEditor } from "@lunagraph/editor";
import * as lunagraph from '../../.lunagraph/components';
import { snapshots } from '../../.lunagraph/snapshots';

export default function Editor() {
  return (
    <LunagraphEditor
      {...lunagraph}
      components={lunagraph.components}
      snapshots={snapshots}
    />
  )
}
```

---

## Dev Server Setup

The dev server enables saving canvas state, editing components, and generating snapshots.

Add to `package.json`:

```json
{
  "scripts": {
    "lunagraph:server": "lunagraph-dev"
  }
}
```

The dev server runs on port 4001 by default and handles:
- Saving canvas state to `.lunagraph/canvases/`
- Component file editing
- Snapshot generation for components

### Custom Port

To use a different port, set `LUNAGRAPH_PORT` and add the corresponding env var:

```json
{
  "scripts": {
    "lunagraph:server": "LUNAGRAPH_PORT=4002 lunagraph-dev"
  }
}
```

Then add to `.env.local`:

```
NEXT_PUBLIC_LUNAGRAPH_DEV_SERVER=http://localhost:4002
```

---

## Running the Editor

Start both your Next.js app and the Lunagraph dev server:

```bash
# Terminal 1 - Start Lunagraph dev server first
pnpm lunagraph:server

# Terminal 2 - Then start Next.js
pnpm dev
```

Then open [http://localhost:3000/editor](http://localhost:3000/editor) in your browser.

> **Tip:** Add a combined script to `package.json` using [concurrently](https://www.npmjs.com/package/concurrently):
> ```json
> {
>   "scripts": {
>     "dev:all": "concurrently \"pnpm lunagraph:server\" \"pnpm dev\""
>   }
> }
> ```
