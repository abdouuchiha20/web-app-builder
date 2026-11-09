"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ChatPanel } from "@/components/workspace/chat-panel";
import { PreviewPanel } from "@/components/workspace/preview-panel";
import { Sidebar } from "@/components/workspace/sidebar";
import type { AgentStep, ChatMessage, ProjectSummary } from "@/lib/types";

type StepEvent = {
  type: "step";
  id: string;
  status: AgentStep["status"];
  detail?: string;
};

type GenerateEvent =
  | StepEvent
  | { type: "tick"; elapsedMs: number }
  | {
      type: "result";
      mode: "create" | "refine";
      siteId: string;
      html: string;
      title: string;
      elapsedMs: number;
    }
  | { type: "error"; message: string };

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Describe the site you want — the niche, the audience, and the feeling you're after. I'll build a complete first version as one self-contained page. Or pick a template on the left to start from a strong brief.",
};

function createSteps(mode: "create" | "refine"): AgentStep[] {
  if (mode === "refine") {
    return [
      {
        id: "brief",
        title: "Reading your change",
        detail: "Opening the current page and finding what to touch.",
        status: "pending",
      },
      {
        id: "build",
        title: "Editing the page",
        detail: "Applying the smallest set of edits that satisfies the request.",
        status: "pending",
      },
      {
        id: "preview",
        title: "Preview updated",
        detail: "The same index.html, refreshed on the right.",
        status: "pending",
      },
    ];
  }

  return [
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
}

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
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [liveSteps, setLiveSteps] = useState<AgentStep[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [site, setSite] = useState<{
    id: string;
    html: string;
    title: string;
  } | null>(null);

  const busyRef = useRef(false);
  const runStepsRef = useRef<AgentStep[]>(createSteps("create"));

  const refreshProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) return;

      const data = (await response.json()) as { projects?: ProjectSummary[] };
      setProjects(data.projects ?? []);
    } catch {
      // The sidebar simply stays empty if listing fails.
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  function handleSelectTemplate(id: string, templatePrompt: string) {
    setActiveTemplateId(id);
    setPrompt(templatePrompt);
  }

  function handleNewProject() {
    if (busyRef.current) return;

    setSite(null);
    setMessages([{ ...welcomeMessage, id: `welcome-${Date.now()}` }]);
    setPrompt("");
    setElapsedMs(0);
    setActiveTemplateId(null);
    setLiveSteps(null);
  }

  async function handleOpenProject(projectId: string) {
    if (busyRef.current || projectId === site?.id) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = (await response.json().catch(() => null)) as
        | { project?: { id: string; html: string; title: string }; error?: string }
        | null;

      if (!response.ok || !data?.project) {
        throw new Error(data?.error ?? "Could not open that project.");
      }

      setSite({
        id: data.project.id,
        html: data.project.html,
        title: data.project.title,
      });
      setActiveTemplateId(null);
      setPrompt("");
      setElapsedMs(0);
      setMessages([
        {
          id: `open-${Date.now()}`,
          role: "assistant",
          content: `Opened “${data.project.title}”. Tell me what to change — I'll edit this same page and keep the rest intact.`,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: error instanceof Error ? error.message : "Could not open that project.",
        },
      ]);
    }
  }

  function updateStep(event: StepEvent) {
    setLiveSteps((current) =>
      (current ?? runStepsRef.current).map((step) =>
        step.id === event.id
          ? { ...step, status: event.status, detail: event.detail ?? step.detail }
          : step,
      ),
    );
  }

  async function handleSend() {
    const brief = prompt.trim();
    if (!brief || busyRef.current) return;

    const mode = site ? "refine" : "create";

    busyRef.current = true;
    setPrompt("");
    setActiveTemplateId(null);
    setIsGenerating(true);
    setElapsedMs(0);

    const steps = createSteps(mode);
    runStepsRef.current = steps;
    setLiveSteps(steps.map((step) => ({ ...step })));

    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", content: brief },
    ]);

    let result: Extract<GenerateEvent, { type: "result" }> | null = null;
    let failure: string | null = null;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: brief, siteId: site?.id }),
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

      const doneSteps = runStepsRef.current.map((step) => ({
        ...step,
        status: "done" as const,
      }));

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            finished.mode === "refine"
              ? `Updated “${finished.title}” in ${formatElapsed(finished.elapsedMs)}. Same file, new version — the preview shows it now.`
              : `Built “${finished.title}” in ${formatElapsed(finished.elapsedMs)}. It's one self-contained index.html — the preview is on the right, and you can download the file from the toolbar.`,
          steps: doneSteps,
        },
      ]);

      void refreshProjects();
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
          activeProjectId={site?.id ?? null}
          projects={projects}
          isLoadingProjects={isLoadingProjects}
          isGenerating={isGenerating}
          onSelectTemplate={handleSelectTemplate}
          onOpenProject={handleOpenProject}
          onNewProject={handleNewProject}
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
          projectTitle={site?.title ?? null}
          hasSite={Boolean(site)}
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
