# Lunagraph

A visual React component editor. Design and edit React components on a canvas with drag-and-drop, then export to code.

## Installation

### Step 1: Get your access token

Request your access token from the Lunagraph team, or sign up at [lunagraph.com](https://lunagraph.com) (coming soon).

### Step 2: Configure authentication

Create `.npmrc` in your project root:

```
@lunagraph:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${LUNAGRAPH_TOKEN}
```

Then add your token to your local environment:

Run this in your terminal, replacing *your_actual_token_here* with the real token:

```
echo 'export LUNAGRAPH_TOKEN=your_actual_token_here' >> ~/.zshrc
```

Then reload your shell:

```
source ~/.zshrc
```

### Step 3: Install packages

Run this in your terminal:

```bash
pnpm add @lunagraph/editor @lunagraph/cli @lunagraph/dev-server tw-animate-css
```

### Step 4: Run the setup wizard

```bash
pnpm exec lunagraph setup --prompt
```

Paste the output into **Cursor**, **Claude**, or any AI assistant. It will:
- Verify your token is configured
- Add reference to `.lunagraph/INSTRUCTIONS.md` in your AI agent rules
- Scan your components
- Create the editor page
- Configure CSS and Tailwind
- Set up the dev server
- Optionally configure icon libraries

That's it! The AI handles the rest.

---

### Manual Setup (without AI)

<details>
<summary>Click to expand manual setup steps</summary>

#### Scan your components

Add to `package.json`:

```json
{
  "scripts": {
    "scan": "lunagraph scan"
  }
}
```

Run:

```bash
pnpm scan
```

This creates `.lunagraph/` with component metadata and snapshots.

By default, it scans these patterns:
- `app/components/**/*.{ts,tsx}`
- `components/**/*.{ts,tsx}`
- `src/components/**/*.{ts,tsx}`

To scan a custom path:
```bash
pnpm exec lunagraph scan ./src/ui --output .lunagraph
```

#### Create the editor page

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

#### CSS Setup (Important!)

The editor ships with its own CSS (`@lunagraph/editor/styles.css`) that includes:
- Tailwind theme configuration
- Light and dark mode CSS variables
- Base styles and utilities

#### Import order in `app/layout.tsx`

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

#### Tailwind v4: Add `@source` directives in `globals.css`

For Tailwind v4, add these `@source` directives to scan editor and canvas files for utility classes:

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

Also ensure your `globals.css` includes these utilities used by the editor:

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

#### Tailwind v3: Configure `tailwind.config.js`

For Tailwind v3, add the editor package to your content paths:

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

#### Set up the dev server

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

**Custom dev server URL**

The editor connects to the dev server at `http://localhost:4001` by default. To use a different URL, pass the `devServerUrl` prop:

```tsx
<LunagraphEditor
  // ...other props
  devServerUrl="http://localhost:4002"
/>
```

To change the dev server port, set `LUNAGRAPH_PORT`:

```json
{
  "scripts": {
    "lunagraph:server": "LUNAGRAPH_PORT=4002 lunagraph-dev"
  }
}
```

**For Next.js**, you can also use an environment variable:

```
# .env.local
NEXT_PUBLIC_LUNAGRAPH_DEV_SERVER=http://localhost:4002
```

**For Vite**, pass the URL directly or use Vite's env vars:

```tsx
<LunagraphEditor
  // ...other props
  devServerUrl={import.meta.env.VITE_LUNAGRAPH_DEV_SERVER || 'http://localhost:4001'}
/>
```

#### Run the editor

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

</details>

## Using with Vite

Lunagraph works with Vite projects. The main difference is how you configure the dev server URL.

### Editor page for Vite

Create `src/pages/Editor.tsx` (or wherever your routes are):

```tsx
import '@lunagraph/editor/styles.css';
import { LunagraphEditor } from "@lunagraph/editor";
import * as lunagraph from '../.lunagraph/components';
import { snapshots } from '../.lunagraph/snapshots';

export default function Editor() {
  return (
    <LunagraphEditor
      {...lunagraph}
      components={lunagraph.components}
      snapshots={snapshots}
      devServerUrl={import.meta.env.VITE_LUNAGRAPH_DEV_SERVER || 'http://localhost:4001'}
    />
  )
}
```

### Environment variable (optional)

Create `.env`:

```
VITE_LUNAGRAPH_DEV_SERVER=http://localhost:4001
```

### Tailwind configuration

For Vite with Tailwind, ensure your config includes the editor package:

```js
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@lunagraph/editor/src/**/*.{js,ts,jsx,tsx}",
    "./.lunagraph/**/*.json",
  ],
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

## Read-Only Mode (Required for Production)

The read-only editor page is **required** for production deployments. It allows users to:
- View canvas designs without editing
- Double-click components to see their layer structure and code
- Share designs with stakeholders

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

The `generate-snapshots` command pre-generates all component snapshots at build time, enabling the read-only editor to work without the dev server.

### Step 2: Create `app/editor-read-only/page.tsx`

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

For Vercel deployments, add the pre-build scripts to generate snapshots before building.

### Option 1: Use `prebuild` script (Recommended)

Add to `package.json`:

```json
{
  "scripts": {
    "prebuild": "pnpm scan && pnpm generate-snapshots",
    "build": "next build"
  }
}
```

Vercel automatically runs `prebuild` before `build`.

### Option 2: Configure in `vercel.json`

```json
{
  "buildCommand": "pnpm scan && pnpm generate-snapshots && pnpm build"
}
```

### Option 3: Override in Vercel Dashboard

In your Vercel project settings → Build & Development Settings:
- **Build Command:** `pnpm scan && pnpm generate-snapshots && pnpm build`

### What gets generated

The build process creates:
- `.lunagraph/ComponentIndex.json` - Component registry
- `.lunagraph/snapshots/*.snapshot.tsx` - Snapshot components
- `.lunagraph/snapshots/metadata.json` - Metadata for read-only mode
- `.lunagraph/snapshots/index.ts` - Snapshot exports

These files are bundled into your production build, enabling the read-only editor to work without a dev server.

## Share Links

Share links let you link directly to a specific element:

```
https://yoursite.com/editor?element=element-id-here
```

The canvas will automatically center on the element when opened.

## Packages

**Install these packages:**
- `@lunagraph/editor` - The visual editor component
- `@lunagraph/cli` - CLI for scanning components
- `@lunagraph/dev-server` - File operations
