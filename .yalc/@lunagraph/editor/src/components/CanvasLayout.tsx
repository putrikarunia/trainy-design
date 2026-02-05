"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import React, { PropsWithChildren } from "react";

export default function CanvasLayout({
  leftChildren,
  rightChildren,
  bottomChildren,
  children
}: PropsWithChildren<{
  leftChildren: React.ReactNode;
  rightChildren?: React.ReactNode;
  bottomChildren?: React.ReactNode;
}>) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-ed-background">
      <PanelGroup direction="horizontal">
        {/* Left Sidebar */}
        <Panel defaultSize={20} minSize={10} maxSize={40}>
          <div className="h-full w-full bg-ed-background border-r border-ed-border overflow-hidden">
            {leftChildren}
          </div>
        </Panel>

        <PanelResizeHandle className="w-px bg-ed-border hover:bg-ed-muted-foreground transition-colors" />

        {/* Main Content Area */}
        <Panel defaultSize={60} minSize={30}>
          <PanelGroup direction="vertical">
            {/* Canvas Area */}
            <Panel defaultSize={70} minSize={30} className="bg-neutral-200">
              <div className="relative h-full">
                {children}
              </div>
            </Panel>

            <PanelResizeHandle className="h-px bg-ed-border hover:bg-ed-muted-foreground transition-colors" />

            {/* Code Editor Area */}
            <Panel defaultSize={30} minSize={15} maxSize={70}>
              <div className="h-full w-full bg-ed-background">
                {bottomChildren}
              </div>
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="w-px bg-ed-border hover:bg-ed-muted-foreground transition-colors" />

        {/* Right Sidebar */}
        <Panel defaultSize={20} minSize={10} maxSize={40}>
          <div className="h-full w-full bg-ed-background border-l border-ed-border">
            {rightChildren}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
