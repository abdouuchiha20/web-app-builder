"use client";

import { useState } from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ChatPanel } from "@/components/workspace/chat-panel";
import { PreviewPanel } from "@/components/workspace/preview-panel";
import { Sidebar } from "@/components/workspace/sidebar";

export function Workspace() {
  const [prompt, setPrompt] = useState("");
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  function handleSelectTemplate(id: string, templatePrompt: string) {
    setActiveTemplateId(id);
    setPrompt(templatePrompt);
  }

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
      <ResizablePanel
        id="sidebar"
        defaultSize="20%"
        minSize="15%"
        maxSize="30%"
        className="border-r border-white/[0.06]"
      >
        <Sidebar
          activeTemplateId={activeTemplateId}
          onSelectTemplate={handleSelectTemplate}
        />
      </ResizablePanel>

      <ResizableHandle withHandle className="bg-white/[0.06]" />

      <ResizablePanel id="chat" defaultSize="45%" minSize="28%">
        <ChatPanel prompt={prompt} onPromptChange={setPrompt} />
      </ResizablePanel>

      <ResizableHandle withHandle className="bg-white/[0.06]" />

      <ResizablePanel id="preview" defaultSize="35%" minSize="24%">
        <PreviewPanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
