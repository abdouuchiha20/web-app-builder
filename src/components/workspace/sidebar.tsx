"use client";

import {
  Cpu,
  FileCode2,
  FolderOpen,
  LayoutTemplate,
  Plus,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { templates } from "@/lib/templates";
import type { ProjectSummary } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  activeTemplateId: string | null;
  activeProjectId: string | null;
  projects: ProjectSummary[];
  isLoadingProjects: boolean;
  isGenerating: boolean;
  onSelectTemplate: (templateId: string, prompt: string) => void;
  onOpenProject: (projectId: string) => void;
  onNewProject: () => void;
}

function relativeTime(timestamp: number) {
  if (!timestamp) return "";

  const seconds = Math.round((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604_800) return `${Math.floor(seconds / 86_400)}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

export function Sidebar({
  activeTemplateId,
  activeProjectId,
  projects,
  isLoadingProjects,
  isGenerating,
  onSelectTemplate,
  onOpenProject,
  onNewProject,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col bg-[#0a0a0c] text-zinc-300">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 pb-5 pt-5">
        <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 shadow-[0_0_24px_-6px_rgba(251,146,60,0.7)]">
          <Sparkles className="size-4 text-black" strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-white">Atelier</p>
          <p className="truncate text-[11px] text-zinc-500">Design-first builder</p>
        </div>
      </div>

      {/* New project */}
      <div className="px-3">
        <Button
          size="sm"
          onClick={onNewProject}
          disabled={isGenerating}
          className="w-full justify-start gap-2 rounded-lg bg-white text-zinc-900 hover:bg-zinc-200 disabled:bg-white/10 disabled:text-zinc-500"
        >
          <Plus className="size-4" />
          New project
        </Button>
      </div>

      {/* Projects */}
      <div className="mt-5 flex min-h-0 flex-1 flex-col px-2">
        <div className="flex items-center justify-between px-2 pb-1.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">
            Projects
          </p>
          {projects.length > 0 && (
            <span className="text-[10px] text-zinc-600">{projects.length}</span>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-1 pb-2">
          {isLoadingProjects && (
            <div className="space-y-1.5">
              {[0, 1].map((key) => (
                <div
                  key={key}
                  className="h-[46px] animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.02]"
                />
              ))}
            </div>
          )}

          {!isLoadingProjects && projects.length === 0 && (
            <div className="mx-1 rounded-xl border border-dashed border-white/[0.07] px-3 py-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="size-3.5 text-zinc-600" />
                <p className="text-[11px] font-medium text-zinc-400">No builds yet</p>
              </div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-zinc-600">
                Your first page will appear here.
              </p>
            </div>
          )}

          {projects.map((project) => {
            const active = project.id === activeProjectId;

            return (
              <button
                key={project.id}
                type="button"
                onClick={() => onOpenProject(project.id)}
                disabled={isGenerating}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-all disabled:opacity-50",
                  active
                    ? "border-amber-400/30 bg-amber-400/[0.07]"
                    : "border-transparent hover:border-white/10 hover:bg-white/[0.04]",
                )}
              >
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg",
                    active ? "bg-amber-400/15 text-amber-300" : "bg-white/[0.04] text-zinc-500",
                  )}
                >
                  <FileCode2 className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium text-zinc-200">
                    {project.title}
                  </p>
                  <p className="truncate text-[10px] text-zinc-500">
                    {relativeTime(project.updatedAt)}
                    {project.builds > 1 ? ` · ${project.builds} builds` : ""}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Templates */}
      <div className="flex min-h-0 flex-1 flex-col border-t border-white/[0.06] px-2 pt-3">
        <div className="flex items-center justify-between px-2 pb-1.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">
            Templates
          </p>
          <LayoutTemplate className="size-3.5 text-zinc-600" />
        </div>

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-1 pb-2">
          {templates.map((template) => {
            const active = template.id === activeTemplateId;

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelectTemplate(template.id, template.prompt)}
                disabled={isGenerating}
                className={cn(
                  "group w-full rounded-xl border p-2.5 text-left transition-all disabled:opacity-50",
                  active
                    ? "border-amber-400/30 bg-amber-400/[0.07]"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05]",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-inner",
                      template.swatch,
                    )}
                  >
                    {template.category === "E-commerce" ? (
                      <ShoppingBag className="size-4" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-zinc-200">
                      {template.name}
                    </p>
                    <p className="truncate text-[10.5px] text-zinc-500">{template.category}</p>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-zinc-500">
                  {template.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-400/10">
            <Cpu className="size-3.5 text-emerald-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-zinc-300">Local engine</p>
            <p className="truncate text-[10px] text-zinc-500">Free models · OpenCode</p>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-400/20 bg-emerald-400/5 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300"
          >
            FREE
          </Badge>
        </div>
      </div>
    </aside>
  );
}
