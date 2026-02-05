import { generateCompleteFile, type FEElement as CodegenFEElement, type ComponentIndex } from '@lunagraph/codegen'
import type { FEElement } from './types'
import { Button } from './ui/Button'
import { Text } from './ui/Text'
import { Tabs, TabsList, TabsTrigger } from './ui/Tabs'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { FloppyDisk, Trash, Cursor, FileTs } from '@phosphor-icons/react'
import { Badge } from './ui/Badge'
import { useDevServer } from '../hooks/useDevServer'
import { useState, useEffect, useMemo, useRef } from 'react'
import { findElement } from './utils/treeUtils'
import { githubLight } from '@uiw/codemirror-theme-github'

export interface EditorTab {
  id: string
  name: string
  type: 'canvas' | 'file'
  elements: FEElement[]

  // For canvas tabs:
  canvasId?: string              // Slug: "homepage-hero"
  canvasPath?: string            // ".lunagraph/canvases/homepage-hero/"
  canvasSaved?: boolean          // Track if canvas needs saving

  // For file tabs (snapshot rendering):
  filePath?: string
  variables?: string[]
  initialValues?: Record<string, any>
  props?: string[]
  mockValues?: Record<string, any>
  snapshotComponentName?: string  // e.g., "ButtonSnapshot" - for looking up in snapshots prop
  snapshotVersion?: number        // Incremented after save to force re-render
  snapshotProps?: Array<{         // Props metadata from snapshot generation
    name: string
    source: string  // 'originalProp' | 'useState' | 'useContext' | 'customHook' | 'internalConstant'
    initialValue?: any
    type?: string
    options?: string[]            // For union types, the available options
    hasImportDefault?: boolean
  }>
  sourceCode?: string             // Pre-loaded source code (for read-only mode)
  renderMode?: 'felement' | 'snapshot'  // Rendering mode: felement (editable) or snapshot (read-only fallback)
  hasUnsavedChanges?: boolean     // Track if file has unsaved changes (not yet "saved to code")
  lastSavedElements?: string      // JSON snapshot of elements when last saved (for comparison)
  loadedFromDraft?: boolean       // Skip snapshot merge on first render when loaded from draft

  // Internal components (non-exported helper components in the same file)
  internalComponents?: Array<{
    name: string
    startLine: number
    endLine: number
    props?: Record<string, { type: string; required: boolean }>
  }>

  // For editing internal components (subset of a file)
  isInternalComponent?: boolean           // True if editing an internal component
  parentFilePath?: string                 // Path to the file containing this internal component
  internalComponentName?: string          // Name of the internal component being edited
  internalComponentRange?: {              // Line range of the internal component in source file
    startLine: number
    endLine: number
  }

  // Canvas transform (zoom/pan) state per tab
  transform?: { scale: number; positionX: number; positionY: number }
}

interface BottomBarProps {
  tab: EditorTab
  onSaveSuccess?: (filePath: string) => void
  onDiscardDraft?: () => void
  readOnly?: boolean
  selectedElementId: string | null
  elements: FEElement[]
  componentIndex: ComponentIndex
}

export function BottomBar({
  tab,
  onSaveSuccess,
  onDiscardDraft,
  readOnly = false,
  selectedElementId,
  elements,
  componentIndex
}: BottomBarProps) {
  const { saveFile, loadFile, isSaving, error } = useDevServer()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [activeCodeTab, setActiveCodeTab] = useState<'selection' | 'source'>('selection')
  const [sourceCode, setSourceCode] = useState<string>('')
  const [isLoadingSource, setIsLoadingSource] = useState(false)

  // Check if we're editing a component (file tab)
  const isEditingComponent = tab.type === 'file' && tab.filePath

  // Generate code for selected element (with imports for Create Component)
  const selectedElementCode = useMemo(() => {
    if (!selectedElementId) {
      return '// Select an element to see its code'
    }

    const selectedElement = findElement(elements, selectedElementId)
    if (!selectedElement) {
      return '// Element not found'
    }

    // Generate complete file with imports
    const code = generateCompleteFile({
      componentName: 'NewComponent',
      elements: [selectedElement as CodegenFEElement],
      componentIndex,
      includeReactImport: false
    })

    return code
  }, [selectedElementId, elements, componentIndex])

  // Load source code when editing a component
  // Track which file we've loaded to prevent re-fetching
  const loadedFileRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isEditingComponent || !tab.filePath) {
      setSourceCode('')
      loadedFileRef.current = null
      return
    }

    // Skip if we've already loaded this file
    if (loadedFileRef.current === tab.filePath) {
      return
    }

    // Use pre-loaded source code if available (for read-only mode)
    if (tab.sourceCode) {
      loadedFileRef.current = tab.filePath
      setSourceCode(tab.sourceCode)
      return
    }

    const loadSourceCode = async () => {
      setIsLoadingSource(true)
      loadedFileRef.current = tab.filePath!
      try {
        const result = await loadFile(tab.filePath!)
        if (result.success && result.raw) {
          setSourceCode(result.raw)
        } else {
          setSourceCode('// Failed to load source code')
        }
      } catch {
        setSourceCode('// Error loading source code')
      } finally {
        setIsLoadingSource(false)
      }
    }

    loadSourceCode()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab.filePath, tab.sourceCode, isEditingComponent])

  const handleSave = async () => {
    if (tab.type !== 'file' || !tab.filePath) {
      return
    }

    // Determine the actual file path (for internal components, use parentFilePath)
    const actualFilePath = tab.isInternalComponent && tab.parentFilePath
      ? tab.parentFilePath
      : tab.filePath

    const result = await saveFile({
      filePath: actualFilePath,
      elements: tab.elements,
      stateContext: tab.mockValues,  // Pass mock values to help Claude understand snapshot context
      // For internal components, include the range to update only that portion
      internalComponent: tab.isInternalComponent ? {
        name: tab.internalComponentName!,
        startLine: tab.internalComponentRange!.startLine,
        endLine: tab.internalComponentRange!.endLine,
      } : undefined,
    })

    if (result.success) {
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 2000)

      // Reload the file to get updated content
      // For internal components, we pass the parent file path so it refreshes
      if (onSaveSuccess) {
        onSaveSuccess(actualFilePath)
      }
    } else {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const canSave = !readOnly && tab.type === 'file' && tab.filePath

  // Get code for current active tab
  const currentCode = activeCodeTab === 'selection' ? selectedElementCode : sourceCode

  return (
    <div className="h-full flex flex-col border-t border-ed-border bg-ed-background">
      {/* Tab bar + Action bar */}
      <div className="flex items-center justify-between border-b border-ed-border bg-ed-muted/30 px-2 py-1">
        <div className="flex items-center gap-2">
          <Tabs value={activeCodeTab} onValueChange={(v) => setActiveCodeTab(v as 'selection' | 'source')}>
            <TabsList variant="simple" className="h-7 gap-0 border-0">
              <TabsTrigger value="selection" className="text-xs px-3 py-1 h-6 gap-1.5">
                <Cursor size={12} weight="bold" />
                Selection
              </TabsTrigger>
              {isEditingComponent && (
                <TabsTrigger value="source" className="text-xs px-3 py-1 h-6 gap-1.5">
                  <FileTs size={12} weight="bold" />
                  Source
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
          {activeCodeTab === 'source' && tab.filePath && (
            <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              {tab.filePath}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {error && saveStatus === 'error' && (
            <Text size="xs" className="text-red-600">
              {error}
            </Text>
          )}
          {saveStatus === 'success' && (
            <Text size="xs" className="text-green-600">
              Saved!
            </Text>
          )}
          {canSave && tab.hasUnsavedChanges && onDiscardDraft && (
            <Button
              variant="ghost"
              size="xs"
              onClick={onDiscardDraft}
              disabled={isSaving}
              LeftIcon={Trash}
            >
              Discard draft
            </Button>
          )}
          {canSave && (
            <Button
              variant="default"
              size="xs"
              onClick={handleSave}
              disabled={isSaving}
              LeftIcon={FloppyDisk}
              leftIconProps={{ weight: "fill" }}
            >
              {isSaving ? 'Saving...' : 'Save to code'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => navigator.clipboard.writeText(currentCode)}
          >
            Copy
          </Button>
        </div>
      </div>

      {/* Code editor */}
      <div className="flex-1 overflow-auto">
        {isLoadingSource && activeCodeTab === 'source' ? (
          <div className="flex items-center justify-center h-full">
            <Text size="sm" className="text-ed-muted-foreground">Loading source...</Text>
          </div>
        ) : (
          <CodeMirror
            value={currentCode || '// No code to display'}
            height="100%"
            extensions={[javascript({ jsx: true })]}
            editable={false}
            theme={githubLight}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: false,
              highlightActiveLine: false,
              foldGutter: false,
            }}
          />
        )}
      </div>
    </div>
  )
}
