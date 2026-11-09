"use client";

import { useMemo, useState } from "react";
import {
  Code2,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  Loader2,
  Maximize2,
  Monitor,
  RefreshCw,
  Smartphone,
  Sparkles,
  Tablet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Device = "desktop" | "tablet" | "mobile";
type View = "preview" | "code";

const deviceWidths: Record<Device, string> = {
  desktop: "w-full",
  tablet: "w-[768px] max-w-full",
  mobile: "w-[390px] max-w-full",
};

interface PreviewPanelProps {
  html: string | null;
  siteId: string | null;
  title: string | null;
  isGenerating: boolean;
  elapsedMs: number;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatElapsed(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  if (total < 60) return `${total}s`;

  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function SiteFrame({
  html,
  refreshKey,
  className,
}: {
  html: string;
  refreshKey: number;
  className?: string;
}) {
  return (
    <iframe
      key={refreshKey}
      title="Generated site preview"
      srcDoc={html}
      sandbox="allow-scripts allow-popups allow-forms allow-modals"
      className={cn("h-full w-full border-0 bg-white", className)}
    />
  );
}

function EmptyState({ isGenerating, elapsedMs }: { isGenerating: boolean; elapsedMs: number }) {
  if (isGenerating) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-white/[0.08] bg-[#0a0a0c]">
        <div className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500">
          <Loader2 className="size-5 animate-spin text-black" />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-medium text-zinc-200">Building your page</p>
          <p className="mt-1 text-[11px] text-zinc-500">
            {formatElapsed(elapsedMs)} · one self-contained index.html
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/[0.08] bg-[#0a0a0c] px-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.02]">
        <Sparkles className="size-5 text-zinc-500" />
      </div>
      <div>
        <p className="text-[13px] font-medium text-zinc-300">Nothing built yet</p>
        <p className="mt-1 max-w-[240px] text-[11.5px] leading-relaxed text-zinc-500">
          Describe a site in the chat, or pick a template on the left. The
          finished page shows up here.
        </p>
      </div>
    </div>
  );
}

export function PreviewPanel({
  html,
  siteId,
  title,
  isGenerating,
  elapsedMs,
}: PreviewPanelProps) {
  const [view, setView] = useState<View>("preview");
  const [device, setDevice] = useState<Device>("desktop");
  const [fullscreen, setFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const bytes = useMemo(() => (html ? new Blob([html]).size : 0), [html]);

  function openInNewTab() {
    if (!html) return;

    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function download() {
    if (!html) return;

    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${siteId ?? "site"}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="flex h-full min-w-0 flex-col bg-[#0b0b0d]">
      {/* Toolbar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-3">
        <div className="flex items-center rounded-lg border border-white/[0.07] bg-white/[0.02] p-0.5">
          <button
            type="button"
            onClick={() => setView("preview")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] transition-colors",
              view === "preview"
                ? "bg-white/[0.08] text-white"
                : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            <Eye className="size-3.5" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => setView("code")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] transition-colors",
              view === "code"
                ? "bg-white/[0.08] text-white"
                : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            <Code2 className="size-3.5" />
            Code
          </button>
        </div>

        <div className="flex items-center gap-0.5">
          {view === "preview" && html && (
            <div className="mr-1 hidden items-center gap-0.5 rounded-lg border border-white/[0.07] bg-white/[0.02] p-0.5 sm:flex">
              {(
                [
                  ["desktop", Monitor],
                  ["tablet", Tablet],
                  ["mobile", Smartphone],
                ] as const
              ).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDevice(key)}
                  className={cn(
                    "rounded-md p-1.5 transition-colors",
                    device === key
                      ? "bg-white/[0.08] text-white"
                      : "text-zinc-500 hover:text-zinc-300",
                  )}
                  aria-label={`${key} view`}
                >
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>
          )}

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRefreshKey((key) => key + 1)}
                  disabled={!html}
                  className="size-7 rounded-md text-zinc-500 hover:bg-white/[0.06] hover:text-white disabled:text-zinc-700"
                  aria-label="Refresh preview"
                />
              }
            >
              <RefreshCw className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Refresh preview</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openInNewTab}
                  disabled={!html}
                  className="size-7 rounded-md text-zinc-500 hover:bg-white/[0.06] hover:text-white disabled:text-zinc-700"
                  aria-label="Open in new tab"
                />
              }
            >
              <ExternalLink className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Open in a new tab</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFullscreen(true)}
                  disabled={!html}
                  className="size-7 rounded-md text-zinc-500 hover:bg-white/[0.06] hover:text-white disabled:text-zinc-700"
                  aria-label="Full screen"
                />
              }
            >
              <Maximize2 className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Full screen</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={download}
                  disabled={!html}
                  className="size-7 rounded-md text-zinc-500 hover:bg-white/[0.06] hover:text-white disabled:text-zinc-700"
                  aria-label="Download HTML"
                />
              }
            >
              <Download className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Download index.html</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Body */}
      <div className="min-h-0 flex-1 p-2">
        {view === "preview" ? (
          <div className="flex h-full justify-center">
            {html ? (
              <div
                className={cn(
                  "h-full overflow-hidden rounded-lg border border-white/[0.08] transition-[width] duration-300",
                  deviceWidths[device],
                )}
              >
                <SiteFrame html={html} refreshKey={refreshKey} />
              </div>
            ) : (
              <div className="h-full w-full">
                <EmptyState isGenerating={isGenerating} elapsedMs={elapsedMs} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-[#0a0a0c]">
            <div className="flex shrink-0 items-center gap-1.5 border-b border-white/[0.06] px-3 py-2 text-[10.5px] text-zinc-400">
              <FileCode2 className="size-3.5 text-amber-300" />
              index.html
              {bytes > 0 && (
                <span className="ml-auto text-zinc-600">{formatBytes(bytes)}</span>
              )}
            </div>
            {html ? (
              <pre className="min-h-0 flex-1 overflow-auto p-3 font-mono text-[10.5px] leading-relaxed text-zinc-300">
                <code>{html}</code>
              </pre>
            ) : (
              <div className="flex flex-1 items-center justify-center text-[11.5px] text-zinc-600">
                No code yet. Build a page first.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex h-7 shrink-0 items-center justify-between border-t border-white/[0.06] px-3 text-[10px] text-zinc-600">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              isGenerating ? "animate-pulse bg-amber-400" : html ? "bg-emerald-400" : "bg-zinc-600",
            )}
          />
          <span className="truncate">
            {isGenerating ? "Generating…" : title ?? "No preview yet"}
          </span>
        </div>
        <span className="shrink-0">
          {html ? `index.html · ${formatBytes(bytes)}` : "Waiting for a build"}
        </span>
      </div>

      {/* Fullscreen */}
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="flex h-[92vh] max-w-[92vw] flex-col gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">Full screen preview</DialogTitle>
          <div className="min-h-0 flex-1 p-2">
            {html && <SiteFrame html={html} refreshKey={refreshKey} />}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
