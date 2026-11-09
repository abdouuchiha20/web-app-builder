"use client";

import { useEffect, useRef } from "react";
import {
  AlertTriangle,
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
  messages: ChatMessage[];
  liveSteps: AgentStep[] | null;
  isGenerating: boolean;
  elapsedMs: number;
  onSend: () => void;
}

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

function AgentSteps({ steps, title }: { steps: AgentStep[]; title: string }) {
  return (
    <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="mb-2.5 flex items-center gap-2">
        <Sparkles className="size-3.5 text-amber-300" />
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          {title}
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

function formatElapsed(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  if (total < 60) return `${total}s`;

  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function ChatPanel({
  prompt,
  onPromptChange,
  messages,
  liveSteps,
  isGenerating,
  elapsedMs,
  onSend,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, liveSteps]);

  const canSend = prompt.trim().length > 0 && !isGenerating;

  function send() {
    if (!canSend) return;
    onSend();
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
            LIVE
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
                <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-zinc-200">
                  {message.content}
                </p>
                {message.steps && (
                  <AgentSteps steps={message.steps} title="Build log" />
                )}
              </div>
            </div>
          ))}

          {/* Live run */}
          {isGenerating && (
            <div className="flex gap-3">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 text-black">
                <Sparkles className="size-3.5" strokeWidth={2.4} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-[11px] font-medium text-zinc-500">Atelier</p>
                  <span className="flex items-center gap-1 text-[10.5px] text-amber-300/90">
                    <Loader2 className="size-3 animate-spin" />
                    {formatElapsed(elapsedMs)}
                  </span>
                </div>
                <p className="text-[13.5px] leading-relaxed text-zinc-300">
                  Building your page. This usually takes one to three minutes on a
                  free model.
                </p>
                {liveSteps && <AgentSteps steps={liveSteps} title="Build progress" />}
              </div>
            </div>
          )}

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
              placeholder={
                isGenerating
                  ? "Building… wait for this run to finish"
                  : "Describe the site you want to build…"
              }
              rows={2}
              disabled={isGenerating}
              className="min-h-0 resize-none border-0 bg-transparent px-2 py-1.5 text-[13.5px] text-zinc-100 shadow-none placeholder:text-zinc-600 focus-visible:ring-0 disabled:opacity-60 dark:bg-transparent"
            />
            <div className="flex items-center justify-between px-1 pb-0.5 pt-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="gap-1 border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-normal text-zinc-400"
                >
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Local engine
                </Badge>
                <span className="hidden text-[10px] text-zinc-600 sm:inline">
                  Enter to send · Shift + Enter for a new line
                </span>
              </div>
              <Button
                size="icon"
                onClick={send}
                disabled={!canSend}
                className="size-8 rounded-xl bg-white text-zinc-900 hover:bg-zinc-200 disabled:bg-white/10 disabled:text-zinc-500"
                aria-label="Send prompt"
              >
                {isGenerating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowUp className="size-4" strokeWidth={2.5} />
                )}
              </Button>
            </div>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-zinc-600">
            <AlertTriangle className="size-3" />
            First runs can take a few minutes. The site is written to
            .atelier/sites.
          </p>
        </div>
      </div>
    </section>
  );
}
