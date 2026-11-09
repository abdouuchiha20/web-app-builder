"use client";

import { useState } from "react";
import {
  Code2,
  Download,
  ExternalLink,
  Eye,
  Maximize2,
  Monitor,
  RefreshCw,
  ShoppingBag,
  Smartphone,
  Tablet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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

const files = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/globals.css",
  "components/hero.tsx",
  "components/product-grid.tsx",
  "components/cart-drawer.tsx",
  "lib/products.ts",
];

const snippet = `export default function Page() {
  return (
    <main className="bg-[#0b0b0d] text-white">
      <Hero
        eyebrow="New collection — 2026"
        title="Objects that feel inevitable."
        cta="Shop the collection"
      />
      <ProductGrid source={products} />
      <CartDrawer />
    </main>
  );
}`;

function SampleSite() {
  return (
    <div className="relative min-h-full bg-[#0a0a0c] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(251,146,60,0.22),transparent_70%)]" />

      {/* Nav */}
      <div className="relative flex items-center justify-between px-6 py-4">
        <span className="text-[13px] font-semibold tracking-[0.3em]">NOVA</span>
        <div className="hidden items-center gap-5 text-[10px] text-zinc-400 sm:flex">
          <span>Shop</span>
          <span>Collections</span>
          <span>Philosophy</span>
        </div>
        <div className="flex size-7 items-center justify-center rounded-full border border-white/15">
          <ShoppingBag className="size-3.5" />
        </div>
      </div>

      {/* Hero */}
      <div className="relative mx-auto max-w-3xl px-6 pb-10 pt-8 text-center">
        <p className="mb-3 text-[9px] uppercase tracking-[0.3em] text-amber-300/90">
          New collection — 2026
        </p>
        <h2 className="text-balance text-3xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          Objects that feel
          <br />
          <span className="bg-gradient-to-r from-amber-200 via-orange-300 to-rose-300 bg-clip-text text-transparent">
            inevitable.
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[11px] leading-relaxed text-zinc-400">
          A small collection of home objects designed to disappear into daily
          life — and make it feel considered.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button className="rounded-full bg-white px-4 py-2 text-[10px] font-semibold text-zinc-900 transition-transform hover:scale-[1.03]">
            Shop the collection
          </button>
          <button className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-medium text-zinc-300 transition-colors hover:bg-white/5">
            Our philosophy
          </button>
        </div>
      </div>

      {/* Products */}
      <div className="relative grid grid-cols-3 gap-3 px-6 pb-8">
        {[
          { name: "Vessel 01", price: "$68", swatch: "from-amber-200/80 to-orange-400/60" },
          { name: "Lamp 04", price: "$124", swatch: "from-zinc-200/70 to-zinc-500/50" },
          { name: "Tray 02", price: "$42", swatch: "from-rose-200/70 to-rose-400/50" },
        ].map((product) => (
          <div key={product.name} className="group cursor-pointer">
            <div
              className={cn(
                "aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-[1.02]",
                product.swatch,
              )}
            >
              <div className="flex h-full items-end p-2">
                <span className="rounded-full bg-black/40 px-2 py-0.5 text-[8px] text-white/90 backdrop-blur">
                  Quick add
                </span>
              </div>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[10px] text-zinc-300">{product.name}</span>
              <span className="text-[10px] text-zinc-500">{product.price}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute right-3 top-3">
        <Badge className="border border-amber-400/30 bg-amber-400/10 px-1.5 py-0 text-[8px] font-medium text-amber-200">
          SAMPLE
        </Badge>
      </div>
    </div>
  );
}

function PreviewBody() {
  return (
    <div className="relative h-full overflow-hidden rounded-lg border border-white/[0.08] bg-[#0a0a0c]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#101013] px-3 py-2">
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-white/10" />
          <span className="size-2 rounded-full bg-white/10" />
          <span className="size-2 rounded-full bg-white/10" />
        </div>
        <div className="mx-auto flex items-center gap-1.5 rounded-md bg-white/[0.04] px-3 py-1 text-[9px] text-zinc-500">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          preview.atelier.app
        </div>
      </div>
      <div className="h-[calc(100%-2.25rem)] overflow-auto">
        <SampleSite />
      </div>
    </div>
  );
}

export function PreviewPanel() {
  const [view, setView] = useState<View>("preview");
  const [device, setDevice] = useState<Device>("desktop");
  const [fullscreen, setFullscreen] = useState(false);

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
          {view === "preview" && (
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
                  className="size-7 rounded-md text-zinc-500 hover:bg-white/[0.06] hover:text-white"
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
                  className="size-7 rounded-md text-zinc-500 hover:bg-white/[0.06] hover:text-white"
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
                  className="size-7 rounded-md text-zinc-500 hover:bg-white/[0.06] hover:text-white"
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
                  disabled
                  className="size-7 rounded-md text-zinc-600"
                  aria-label="Download code"
                />
              }
            >
              <Download className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Download arrives in Phase 4</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Body */}
      <div className="min-h-0 flex-1 p-2">
        {view === "preview" ? (
          <div className="flex h-full justify-center">
            <div className={cn("h-full transition-[width] duration-300", deviceWidths[device])}>
              <PreviewBody />
            </div>
          </div>
        ) : (
          <div className="flex h-full overflow-hidden rounded-lg border border-white/[0.08] bg-[#0a0a0c]">
            <div className="hidden w-48 shrink-0 border-r border-white/[0.06] p-2 sm:block">
              <p className="px-2 pb-2 text-[9px] uppercase tracking-[0.14em] text-zinc-600">
                Files
              </p>
              <ul className="space-y-0.5">
                {files.map((file) => (
                  <li
                    key={file}
                    className={cn(
                      "truncate rounded-md px-2 py-1 text-[10.5px]",
                      file === "app/page.tsx"
                        ? "bg-white/[0.06] text-zinc-200"
                        : "text-zinc-500",
                    )}
                  >
                    {file}
                  </li>
                ))}
              </ul>
            </div>
            <pre className="min-w-0 flex-1 overflow-auto p-3 font-mono text-[10.5px] leading-relaxed text-zinc-300">
              <code>{snippet}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex h-7 shrink-0 items-center justify-between border-t border-white/[0.06] px-3 text-[10px] text-zinc-600">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          <span>Sample preview</span>
        </div>
        <span>Next.js · Tailwind v4 · 1440px</span>
      </div>

      {/* Fullscreen */}
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="flex h-[92vh] max-w-[92vw] flex-col gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">Full screen preview</DialogTitle>
          <div className="min-h-0 flex-1 p-2">
            <PreviewBody />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
