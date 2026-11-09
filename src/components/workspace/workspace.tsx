"use client";

import { useRef, useState } from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ChatPanel } from "@/components/workspace/chat-panel";
import { PreviewPanel } from "@/components/workspace/preview-panel";
import { Sidebar } from "@/components/workspace/sidebar";
import type { AgentStep, ChatMessage } from "@/lib/types";

type StepEvent = {
  type: "step";
  id: string;
  status: AgentStep["status"];
  detail?: string;
};

type GenerateEvent =
  | StepEvent
  | { type: "tick"; elapsedMs: number }
  | { type: "result"; siteId: string; html: string; title: string; elapsedMs: number }
  | { type: "error"; message: string };

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Describe the site you want — the niche, the audience, and the feeling you're after. I'll build a complete first version as one self-contained page. Or pick a template on the left to start from a strong brief.",
  },
];

const initialBuildSteps: AgentStep[] = [
  {
    id: "brief",
    title: "Reading the brief",
    detail: "Locking the niche, the audience and the one job the page has to do.",
    status: "pending",
  },
  {
    id: "build",
    title: "Building the page",
    detail: "Writing one self-contained index.html with real copy, type and motion.",
    status: "pending",
  },
  {
    id: "preview",
    title: "Preview ready",
    detail: "The site appears in the preview panel on the right.",
    status: "pending",
  },
];

function formatElapsed(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  if (total < 60) return `${total}s`;

  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function Workspace() {
  const [prompt, setPrompt] = useState("");
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [liveSteps, setLiveSteps] = useState<AgentStep[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [site, setSite] = useState<{
    id: string;
    html: string;
    title: string;
  } | null>(null);

  const busyRef = useRef(false);

  function handleSelectTemplate(id: string, templatePrompt: string) {
    setActiveTemplateId(id);
    setPrompt(templatePrompt);
  }

  function updateStep(event: StepEvent) {
    setLiveSteps((current) =>
      (current ?? initialBuildSteps).map((step) =>
        step.id === event.id
          ? { ...step, status: event.status, detail: event.detail ?? step.detail }
          : step,
      ),
    );
  }

  async function handleSend() {
    const brief = prompt.trim();
    if (!brief || busyRef.current) return;

    busyRef.current = true;
    setPrompt("");
    setActiveTemplateId(null);
    setIsGenerating(true);
    setElapsedMs(0);
    setLiveSteps(initialBuildSteps.map((step) => ({ ...step })));

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: brief,
    };

    setMessages((current) => [...current, userMessage]);

    let result: Extract<GenerateEvent, { type: "result" }> | null = null;
    let failure: string | null = null;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: brief }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? `Request failed with status ${response.status}.`);
      }

      if (!response.body) {
        throw new Error("The server returned no response stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;

          let event: GenerateEvent;
          try {
            event = JSON.parse(line) as GenerateEvent;
          } catch {
            continue;
          }

          if (event.type === "step") {
            updateStep(event);
          } else if (event.type === "tick") {
            setElapsedMs(event.elapsedMs);
          } else if (event.type === "result") {
            result = event;
            setElapsedMs(event.elapsedMs);
          } else if (event.type === "error") {
            failure = event.message;
          }
        }
      }
    } catch (error) {
      failure = error instanceof Error ? error.message : "The build failed.";
    }

    if (result) {
      const finished: Extract<GenerateEvent, { type: "result" }> = result;

      setSite({
        id: finished.siteId,
        html: finished.html,
        title: finished.title,
      });
      setLiveSteps(null);
      setElapsedMs(finished.elapsedMs);

      const doneSteps = initialBuildSteps.map((step) => ({
        ...step,
        status: "done" as const,
      }));

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `Built “${finished.title}” in ${formatElapsed(finished.elapsedMs)}. It's one self-contained index.html — the preview is on the right, and you can download the file from the toolbar.`,
          steps: doneSteps,
        },
      ]);
    } else {
      setLiveSteps(null);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `That build didn't finish. ${failure ?? "The model stopped before writing the page."}`,
        },
      ]);
    }

    busyRef.current = false;
    setIsGenerating(false);
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
        <ChatPanel
          prompt={prompt}
          onPromptChange={setPrompt}
          messages={messages}
          liveSteps={liveSteps}
          isGenerating={isGenerating}
          elapsedMs={elapsedMs}
          onSend={handleSend}
        />
      </ResizablePanel>

      <ResizableHandle withHandle className="bg-white/[0.06]" />

      <ResizablePanel id="preview" defaultSize="35%" minSize="24%">
        <PreviewPanel
          html={site?.html ?? null}
          siteId={site?.id ?? null}
          title={site?.title ?? null}
          isGenerating={isGenerating}
          elapsedMs={elapsedMs}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
