"use client"

import { useState, useMemo, useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { Text } from "./ui/Text"
import { Input } from "./ui/Input"
import { Button } from "./ui/Button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/Select"
import { IconElement, IconLibraryConfig } from "./types"
import { extractIconNames, searchIcons } from "./utils/iconUtils"
import { generatePrefixedId } from "./utils/idUtils"

interface IconsPanelProps {
  iconLibraries: Record<string, IconLibraryConfig>
  onAddElement: (element: IconElement) => void
  readOnly?: boolean
}

const GRID_COLUMNS = 4
const ICON_CELL_SIZE = 64  // px

export function IconsPanel({ iconLibraries, onAddElement, readOnly = false }: IconsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLibrary, setSelectedLibrary] = useState<string>(
    Object.keys(iconLibraries)[0] || ""
  )
  const parentRef = useRef<HTMLDivElement>(null)

  const libraryConfig = iconLibraries[selectedLibrary]

  // Extract and cache icon names
  const allIconNames = useMemo(() => {
    if (!libraryConfig) return []
    return extractIconNames(libraryConfig.icons, libraryConfig.iconNames)
  }, [libraryConfig])

  // Filter by search query
  const filteredIcons = useMemo(() => {
    return searchIcons(allIconNames, searchQuery)
  }, [allIconNames, searchQuery])

  // Calculate rows for virtualization
  const rowCount = Math.ceil(filteredIcons.length / GRID_COLUMNS)

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ICON_CELL_SIZE,
    overscan: 5,
  })

  const createIconElement = (iconName: string): IconElement => ({
    id: generatePrefixedId('icon'),
    type: 'icon',
    library: selectedLibrary,
    iconName,
    props: { ...libraryConfig?.defaultProps },
    styles: {},
    canvasPosition: { x: 100, y: 100 }
  })

  const handleIconClick = (iconName: string) => {
    onAddElement(createIconElement(iconName))
  }

  if (Object.keys(iconLibraries).length === 0) {
    return (
      <div className="p-4 text-center">
        <Text size="sm" variant="tertiary">
          No icon libraries registered. Pass iconLibraries prop to LunagraphEditor.
        </Text>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col flex-1 overflow-hidden">
      {readOnly && (
        <div className="px-4 py-2 bg-ed-muted/50 border-b border-ed-border">
          <Text size="xs" variant="tertiary">View only - cannot add icons</Text>
        </div>
      )}
      {/* Search bar */}
      <div className={`px-4 py-3 border-b border-ed-border space-y-3 ${readOnly ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Library selector */}
        {Object.keys(iconLibraries).length > 1 && (
          <Select value={selectedLibrary} onValueChange={setSelectedLibrary}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select library" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(iconLibraries).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.displayName || key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Search input */}
        <div className="relative">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ed-muted-foreground pointer-events-none"
            weight="bold"
          />
          <Input
            type="text"
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Icon count */}
        <Text size="xs" variant="tertiary">
          {filteredIcons.length} icons
        </Text>
      </div>

      {/* Virtualized icon grid */}
      <div ref={parentRef} className={`flex-1 overflow-auto ${readOnly ? 'opacity-50 pointer-events-none' : ''}`}>
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const startIndex = virtualRow.index * GRID_COLUMNS
            const rowIcons = filteredIcons.slice(startIndex, startIndex + GRID_COLUMNS)

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: ICON_CELL_SIZE,
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
                }}
              >
                {rowIcons.map((iconName) => {
                  const IconComponent = libraryConfig?.icons?.[iconName]

                  // Skip rendering if icon component not found
                  if (!IconComponent) return null

                  return (
                    <Button
                      key={iconName}
                      variant="ghost"
                      size="text"
                      onClick={() => handleIconClick(iconName)}
                      className="flex flex-col items-center justify-center p-2 h-auto rounded hover:bg-ed-accent"
                      title={iconName}
                      isChildText={false}
                    >
                      <IconComponent
                        size={24}
                        {...libraryConfig?.defaultProps}
                      />
                      <Text size="3xs" variant="tertiary" className="mt-1 truncate max-w-full">
                        {iconName.length > 8 ? iconName.slice(0, 7) + '…' : iconName}
                      </Text>
                    </Button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
