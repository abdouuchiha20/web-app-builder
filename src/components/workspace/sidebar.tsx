"use client";

import {
  ChevronRight,
  Cpu,
  FolderOpen,
  History,
  LayoutTemplate,
  Plus,
  Settings2,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { templates } from "@/lib/templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  activeTemplateId: string | null;
  onSelectTemplate: (templateId: string, prompt: string) => void;
}

const navItems = [
  { label: "New project", icon: Plus },
  { label: "Projects", icon: FolderOpen },
  { label: "History", icon: History },
  { label: "Settings", icon: Settings2 },
];

export function Sidebar({ activeTemplateId, onSelectTemplate }: SidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col bg-[#0a0a0c] text-zinc-300">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 pb-5 pt-5">
        <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 shadow-[0_0_24px_-6px_rgba(251,146,60,0.7)]">
          <Sparkles className="size-4 text-black" strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-white">
            Atelier
          </p>
          <p className="truncate text-[11px] text-zinc-500">
            Design-first builder
          </p>
        </div>
      </div>

      {/* New project */}
      <div className="px-3">
        <Button
          size="sm"
          className="w-full justify-start gap-2 rounded-lg bg-white text-zinc-900 hover:bg-zinc-200"
        >
          <Plus className="size-4" />
          New project
        </Button>
      </div>

      {/* Menu */}
      <nav className="mt-4 space-y-0.5 px-2">
        <p className="px-2 pb-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">
          Workspace
        </p>
        {navItems.slice(1).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <Icon className="size-4 text-zinc-500 transition-colors group-hover:text-amber-300" />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight className="size-3.5 text-zinc-700 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          );
        })}
      </nav>

      {/* Templates folder */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col px-2">
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
                className={cn(
                  "group w-full rounded-xl border p-2.5 text-left transition-all",
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
                    <p className="truncate text-[10.5px] text-zinc-500">
                      {template.category}
                    </p>
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
            <p className="truncate text-[11px] font-medium text-zinc-300">
              Free models
            </p>
            <p className="truncate text-[10px] text-zinc-500">
              Omniroute · Ollama
            </p>
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
