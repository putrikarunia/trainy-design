import { useState } from "react"
import { MagnifyingGlassIcon, TextT, DeviceMobile, DeviceTablet, Desktop, Browser } from "@phosphor-icons/react"
import { Text } from "./ui/Text"
import { FEElement, ViewportElement, VIEWPORT_PRESETS } from "./types"
import { htmlTags, createElementFromTag } from "./htmlTagsData"
import { InsertItem } from "./InsertItem"
import { generatePrefixedId } from "./utils/idUtils"

interface InsertPanelProps {
  onAddElement: (element: FEElement) => void
  readOnly?: boolean
}

// Viewport preset data for the insert panel
const viewportPresets = [
  {
    key: 'desktop',
    title: 'Desktop',
    description: 'Large screen viewport (1512px)',
    icon: Desktop,
    color: '#3b82f6',
    ...VIEWPORT_PRESETS.desktop,
  },
  {
    key: 'laptop',
    title: 'Laptop',
    description: 'Medium screen viewport (1280px)',
    icon: Browser,
    color: '#8b5cf6',
    ...VIEWPORT_PRESETS.laptop,
  },
  {
    key: 'tablet',
    title: 'Tablet',
    description: 'Tablet viewport (768px)',
    icon: DeviceTablet,
    color: '#10b981',
    ...VIEWPORT_PRESETS.tablet,
  },
  {
    key: 'mobile',
    title: 'Mobile',
    description: 'Mobile viewport (390px)',
    icon: DeviceMobile,
    color: '#f59e0b',
    ...VIEWPORT_PRESETS.mobile,
  },
]

const createViewportElement = (preset: typeof viewportPresets[0]): ViewportElement => ({
  id: generatePrefixedId('viewport'),
  type: 'viewport',
  viewportWidth: preset.width,
  viewportHeight: preset.height,
  deviceName: preset.name,
  styles: {},
  children: [],
  canvasPosition: { x: 100, y: 100 },
})

export const InsertPanel = ({ onAddElement, readOnly = false }: InsertPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("")

  const createTextNode = (): FEElement => ({
    id: generatePrefixedId('text'),
    type: 'text',
    tag: 'span',
    text: 'Text',
    styles: {},
    canvasPosition: { x: 100, y: 100 }
  })

  const filteredTags = htmlTags.filter(tag =>
    tag.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter viewport presets based on search
  const filteredViewports = viewportPresets.filter(preset =>
    preset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    preset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'viewport'.includes(searchQuery.toLowerCase()) ||
    'responsive'.includes(searchQuery.toLowerCase())
  )

  // Check if "text" matches the search query
  const showTextNode = searchQuery === '' ||
    'text'.includes(searchQuery.toLowerCase())

  return (
    <div className="w-full flex flex-col flex-1 overflow-hidden">
      {readOnly && (
        <div className="px-4 py-2 bg-ed-muted/50 border-b border-ed-border">
          <Text size="xs" variant="secondary">View only - cannot add elements</Text>
        </div>
      )}
      {/* Search bar */}
      <div className={`px-4 py-3 border-b border-ed-border ${readOnly ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="relative">
          <MagnifyingGlassIcon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ed-muted-foreground"
            weight="bold"
          />
          <input
            type="text"
            placeholder="Search HTML elements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-ed-background border border-ed-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ed-ring focus:ring-offset-2 text-ed-foreground placeholder:text-ed-muted-foreground"
          />
        </div>
      </div>

      {/* Elements list */}
      <div className={`flex-1 overflow-y-auto ${readOnly ? 'opacity-50 pointer-events-none' : ''}`}>
        {!showTextNode && filteredTags.length === 0 && filteredViewports.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Text size="sm" variant="secondary">
              No elements found
            </Text>
          </div>
        ) : (
          <>
            {/* Viewport presets section */}
            {filteredViewports.length > 0 && (
              <>
                <div className="px-4 py-2 bg-ed-muted/30 border-b border-ed-border">
                  <Text size="xs" weight="medium" variant="secondary">Viewports</Text>
                </div>
                {filteredViewports.map((preset) => {
                  const IconComponent = preset.icon
                  return (
                    <div
                      key={preset.key}
                      className="py-3 px-4 hover:bg-ed-accent cursor-pointer transition-colors flex items-center gap-3 border-b border-ed-border"
                      onClick={() => onAddElement(createViewportElement(preset))}
                    >
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center shrink-0"
                        style={{ background: preset.color }}
                      >
                        <IconComponent size={20} weight="bold" className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ed-foreground">{preset.title}</div>
                        <div className="text-xs text-ed-muted-foreground">{preset.description}</div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}

            {/* Elements section header */}
            {(showTextNode || filteredTags.length > 0) && (
              <div className="px-4 py-2 bg-ed-muted/30 border-b border-ed-border">
                <Text size="xs" weight="medium" variant="secondary">Elements</Text>
              </div>
            )}

            {/* Text node */}
            {showTextNode && (
              <div
                className="py-3 px-4 hover:bg-ed-accent cursor-pointer transition-colors flex items-center gap-3 border-b border-ed-border"
                onClick={() => onAddElement(createTextNode())}
              >
                <div
                  className="w-10 h-10 rounded flex items-center justify-center shrink-0"
                  style={{ background: '#6b7280' }}
                >
                  <TextT size={20} weight="bold" className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ed-foreground">Text</div>
                  <div className="text-xs text-ed-muted-foreground">Plain text node</div>
                </div>
              </div>
            )}

            {/* HTML elements */}
            {filteredTags.map((tagData) => (
              <InsertItem
                key={tagData.tag}
                tagData={tagData}
                onClick={() => onAddElement(createElementFromTag(tagData))}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
