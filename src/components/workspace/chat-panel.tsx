"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  Circle,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";

import type { AgentStep, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

interface ChatPanelProps {
  prompt: string;
  onPromptChange: (value: string) => void;
}

const exampleSteps: AgentStep[] = [
  {
    id: "brief",
    title: "Reading the brief",
    detail: "Locked the niche, the audience and the one job the page has to do.",
    status: "done",
  },
  {
    id: "direction",
    title: "Choosing a design direction",
    detail: "Editorial type, warm neutrals, restrained motion — not a template look.",
    status: "done",
  },
  {
    id: "layout",
    title: "Building the layout",
    detail: "Hero, product grid, cart drawer and checkout, section by section.",
    status: "done",
  },
  {
    id: "backend",
    title: "Wiring the backend",
    detail: "Product data, cart state and checkout plumbing ready to connect.",
    status: "active",
  },
  {
    id: "motion",
    title: "Polishing motion",
    detail: "Scroll reveals, hover states and page transitions.",
    status: "pending",
  },
  {
    id: "preview",
    title: "Preview ready",
    detail: "The full site appears in the preview panel on the right.",
    status: "pending",
  },
];

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Ready when you are. Describe the site you want — or pick a template on the left. I'll build a complete first version, then we refine it together.",
    steps: exampleSteps,
  },
];

function StepIcon({ status }: { status: AgentStep["status"] }) {
  if (status === "done") {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
        <Check className="size-3" strokeWidth={3} />
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
        <Loader2 className="size-3 animate-spin" strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span className="flex size-5 items-center justify-center rounded-full text-zinc-600">
      <Circle className="size-2.5" />
    </span>
  );
}

function AgentSteps({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="mb-2.5 flex items-center gap-2">
        <Sparkles className="size-3.5 text-amber-300" />
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          Example agent run
        </span>
      </div>
      <ol className="space-y-2.5">
        {steps.map((step, index) => (
          <li key={step.id} className="flex gap-2.5">
            <div className="flex flex-col items-center">
              <StepIcon status={step.status} />
              {index < steps.length - 1 && (
                <span className="mt-1 w-px flex-1 bg-white/[0.07]" />
              )}
            </div>
            <div className="min-w-0 pb-0.5">
              <p
                className={cn(
                  "text-[12.5px] font-medium leading-tight",
                  step.status === "pending" ? "text-zinc-500" : "text-zinc-200",
                )}
              >
                {step.title}
              </p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-zinc-500">
                {step.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ChatPanel({ prompt, onPromptChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function send() {
    const text = prompt.trim();
    if (!text) return;

    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", content: text },
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          "Got it. The generation engine comes in the next phase — right now this is the Phase 1 workspace shell. Once OpenCode is wired in, this exact prompt becomes a real build.",
      },
    ]);
    onPromptChange("");
  }

  return (
    <section className="flex h-full min-w-0 flex-col bg-[#0b0b0d]">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-medium text-white">Untitled project</h1>
          <Badge
            variant="outline"
            className="border-amber-400/25 bg-amber-400/[0.06] px-1.5 py-0 text-[9px] font-medium text-amber-300"
          >
            PHASE 1
          </Badge>
        </div>
        <p className="text-[11px] text-zinc-500">Chat</p>
      </header>

      {/* Messages */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto w-full max-w-2xl space-y-6 px-5 py-6">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <div
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                  message.role === "assistant"
                    ? "bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 text-black"
                    : "bg-white/[0.08] text-zinc-300",
                )}
              >
                {message.role === "assistant" ? (
                  <Sparkles className="size-3.5" strokeWidth={2.4} />
                ) : (
                  <User className="size-3.5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[11px] font-medium text-zinc-500">
                  {message.role === "assistant" ? "Atelier" : "You"}
                </p>
                <p className="text-[13.5px] leading-relaxed text-zinc-200">
                  {message.content}
                </p>
                {message.steps && <AgentSteps steps={message.steps} />}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className="shrink-0 border-t border-white/[0.06] p-4">
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_12px_32px_-16px_rgba(0,0,0,0.9)] transition-colors focus-within:border-amber-400/30">
            <Textarea
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder="Describe the site you want to build…"
              rows={2}
              className="min-h-0 resize-none border-0 bg-transparent px-2 py-1.5 text-[13.5px] text-zinc-100 shadow-none placeholder:text-zinc-600 focus-visible:ring-0 dark:bg-transparent"
            />
            <div className="flex items-center justify-between px-1 pb-0.5 pt-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="gap-1 border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-normal text-zinc-400"
                >
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Free models
                </Badge>
                <span className="hidden text-[10px] text-zinc-600 sm:inline">
                  Enter to send · Shift + Enter for a new line
                </span>
              </div>
              <Button
                size="icon"
                onClick={send}
                disabled={!prompt.trim()}
                className="size-8 rounded-xl bg-white text-zinc-900 hover:bg-zinc-200 disabled:bg-white/10 disabled:text-zinc-500"
                aria-label="Send prompt"
              >
                <ArrowUp className="size-4" strokeWidth={2.5} />
              </Button>
            </div>
          </div>
          <p className="mt-2 text-center text-[10px] text-zinc-600">
            Phase 1 shell · engine wiring comes next
          </p>
        </div>
      </div>
    </section>
  );
}
