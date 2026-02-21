import fs from 'fs'
import path from 'path'
import type { FEElement } from "@lunagraph/editor"
import EditorReadOnlyClient from './EditorReadOnlyClient'

function getPages(): Array<{ id: string; name: string; elements: FEElement[] }> {
  const canvasesDir = path.join(process.cwd(), '.lunagraph', 'canvases')
  const pages: Array<{ id: string; name: string; elements: FEElement[] }> = []

  try {
    const entries = fs.readdirSync(canvasesDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          const canvasFile = path.join(canvasesDir, entry.name, 'canvas.json')
          const content = fs.readFileSync(canvasFile, 'utf-8')
          const canvasData = JSON.parse(content)
          pages.push({
            id: canvasData.id || entry.name,
            name: canvasData.name || entry.name,
            elements: canvasData.elements || []
          })
        } catch {
          // Skip canvases that can't be read
        }
      }
    }
  } catch {
    // Canvases directory doesn't exist yet
  }

  pages.sort((a, b) => a.name.localeCompare(b.name))
  return pages
}

export default function EditorReadOnlyPage() {
  const pages = getPages()
  return <EditorReadOnlyClient initialPages={pages} />
}
