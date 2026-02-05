"use client";

import { Text } from "./ui/Text";
import { Button } from "./ui/Button";
import { Plus, DotsThree, Trash, PencilSimple, Check, X } from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";

export interface PageInfo {
  id: string;
  name: string;
  elementCount?: number;
}

interface PagesPanelProps {
  pages: PageInfo[];
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onCreatePage: () => void;
  onRenamePage?: (pageId: string, newName: string) => void;
  onDeletePage?: (pageId: string) => void;
  readOnly?: boolean;
}

export function PagesPanel({
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
  onRenamePage,
  onDeletePage,
  readOnly = false,
}: PagesPanelProps) {
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingPageId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingPageId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    if (menuOpenId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpenId]);

  const handleStartRename = (page: PageInfo) => {
    setEditingPageId(page.id);
    setEditingName(page.name);
    setMenuOpenId(null);
  };

  const handleConfirmRename = () => {
    if (editingPageId && editingName.trim() && onRenamePage) {
      onRenamePage(editingPageId, editingName.trim());
    }
    setEditingPageId(null);
    setEditingName("");
  };

  const handleCancelRename = () => {
    setEditingPageId(null);
    setEditingName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirmRename();
    } else if (e.key === "Escape") {
      handleCancelRename();
    }
  };

  const handleDelete = (pageId: string) => {
    if (onDeletePage) {
      onDeletePage(pageId);
    }
    setMenuOpenId(null);
  };

  return (
    <div className="flex flex-col border-b border-ed-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Text size="xs" weight="semibold" variant="primary">
          Pages
        </Text>
        {!readOnly && (
          <Button
            variant="ghost"
            size="icon-2xs"
            onClick={onCreatePage}
            title="Create new page"
          >
            <Plus size={14} weight="bold" />
          </Button>
        )}
      </div>

      {/* Pages list */}
      <div className="pb-2">
        {pages.map((page) => {
          const isActive = page.id === activePageId;
          const isEditing = editingPageId === page.id;
          const isMenuOpen = menuOpenId === page.id;

          return (
            <div
              key={page.id}
              className={cn(
                "group flex items-center gap-2 px-4 py-1.5 cursor-pointer hover:bg-ed-accent/50 transition-colors relative",
                isActive && "bg-ed-accent font-medium"
              )}
              onClick={() => !isEditing && onSelectPage(page.id)}
            >
              {/* Page name */}
              {isEditing ? (
                <div className="flex-1 flex items-center gap-1">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleConfirmRename}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 min-w-0 px-1.5 py-0.5 text-sm bg-ed-background border border-ed-border rounded outline-none focus:border-ed-primary text-ed-foreground"
                  />
                </div>
              ) : (
                <>
                  <Text
                    size="sm"
                    variant={isActive ? "primary" : "secondary"}
                    className="flex-1 truncate select-none"
                  >
                    {page.name}
                  </Text>

                  {/* Context menu button */}
                  {!readOnly && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(isMenuOpen ? null : page.id);
                        }}
                        className={cn(
                          "opacity-0 group-hover:opacity-100 hover:bg-ed-accent rounded p-0.5 transition-opacity",
                          isMenuOpen && "opacity-100"
                        )}
                      >
                        <DotsThree size={16} weight="bold" className="text-ed-muted-foreground" />
                      </button>

                      {/* Dropdown menu */}
                      {isMenuOpen && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-full mt-1 z-50 min-w-[120px] bg-ed-popover border border-ed-border rounded-md shadow-md py-1"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(page);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-ed-accent text-left"
                          >
                            <PencilSimple size={14} />
                            Rename
                          </button>
                          {pages.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(page.id);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-ed-accent text-left text-red-600"
                            >
                              <Trash size={14} />
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
