"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/Dialog"
import { WarningCircle, Code, PencilSimple } from "@phosphor-icons/react"

interface DraftConflictDialogProps {
  isOpen: boolean
  componentName: string
  onLoadFromCode: () => void
  onContinueWithDraft: () => void
}

export function DraftConflictDialog({
  isOpen,
  componentName,
  onLoadFromCode,
  onContinueWithDraft,
}: DraftConflictDialogProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-500/10">
              <WarningCircle size={24} weight="fill" className="text-yellow-500" />
            </div>
            <DialogTitle>Draft Conflict</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            The component <span className="font-medium text-ed-foreground">{componentName}</span> was
            modified in code since your last draft was saved. What would you like to do?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          <button
            onClick={onLoadFromCode}
            className="flex items-start gap-3 p-4 rounded-lg border border-ed-border hover:bg-ed-accent text-left transition-colors"
          >
            <Code size={20} weight="bold" className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-sm text-ed-foreground">Load from code</div>
              <div className="text-xs text-ed-muted-foreground mt-0.5">
                Discard your draft and start fresh with the latest code changes.
              </div>
            </div>
          </button>

          <button
            onClick={onContinueWithDraft}
            className="flex items-start gap-3 p-4 rounded-lg border border-ed-border hover:bg-ed-accent text-left transition-colors"
          >
            <PencilSimple size={20} weight="bold" className="text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-sm text-ed-foreground">Continue with draft</div>
              <div className="text-xs text-ed-muted-foreground mt-0.5">
                Keep your draft changes. Your draft may not reflect the latest code.
              </div>
            </div>
          </button>
        </div>

        <DialogFooter className="text-xs text-ed-muted-foreground">
          <span>Tip: Save to code frequently to avoid conflicts.</span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

