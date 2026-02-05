// Main exports
export { LunagraphEditor } from './components/LunagraphEditor'
export type { LunagraphEditorProps, ComponentIndex } from './components/LunagraphEditor'

// Types
export type {
  FEElement,
  ComponentElement,
  HtmlElement,
  TextLeafNode,
  IconElement,
  ViewportElement,
  IconLibraryConfig,
  IconPropsSchema
} from './components/types'

// Presets and schemas for common libraries
export { PHOSPHOR_PROPS_SCHEMA, LUCIDE_PROPS_SCHEMA, VIEWPORT_PRESETS } from './components/types'

// History/Undo-Redo (for advanced usage)
export { useHistory, useTabHistory } from './hooks/useHistory'
export type { HistoryState, UseHistoryOptions, UseHistoryResult } from './hooks/useHistory'
export type { Operation } from './components/utils/operations'
