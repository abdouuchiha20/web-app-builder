# Atelier

A personal, design-first web app builder. Describe a site in plain language and get a complete, self-contained page in the preview panel — built locally by OpenCode on free models.

## Status

- **Phase 0–1** — Next.js 16 + Tailwind v4 + shadcn/ui scaffold, 3-pane workspace shell.
- **Phase 2** — live generation engine wired end to end. **Working.**
- **Phase 3** — in-place refine and local project persistence. **Working.**
  - Send a message after a build and it edits the *same* `index.html` instead of rebuilding.
  - Projects are listed in the sidebar; click one to reopen and keep refining.
  - New project resets the workspace.
- Next: per-build git commits, auth, and other output targets (Next.js apps, components).

## Run it

```bash
npm install
npm run dev
```

Open the port printed in the terminal (currently `http://localhost:3002`; port 3000 is used by another local app).

The engine is the local OpenCode server. `@opencode/client`'s `Service.ensure()` starts it if needed and discovers the running instance, so there is nothing extra to launch.

## How a build works

1. You type a brief, or pick a template in the left sidebar.
2. `POST /api/generate` creates a session in a folder under `.atelier/sites/<slug>-<id>` using the **`atelier-builder`** agent (`.opencode/agents/atelier-builder.md`).
3. The agent writes one `index.html`: inline CSS and JS, Google Fonts, `picsum.photos` images, real copy, responsive layout, scroll motion.
4. The route streams NDJSON events (`step`, `tick`, `result`, `error`) while it polls the session. No 300-second HTTP timeout.
5. The UI renders the returned HTML in a sandboxed iframe and offers download, open-in-tab, responsive preview and fullscreen.
6. **Refine:** once a site exists, the next message reuses the same folder and the same agent with an edit prompt. The agent reads `index.html` and applies the smallest set of edits, keeping everything else intact. The preview updates in place and the project's build count increments.
7. **Projects:** every successful build writes `.atelier/sites/<id>/meta.json`. The sidebar lists them (newest first); clicking one reopens it for further refining.

Generation usually takes 1–3 minutes on a free model. The timeout is 10 minutes.

## The agent

`.opencode/agents/atelier-builder.md` is the heart of quality control:

- **No skills, no web search, no shell** — skills were eating the output budget and research loops wasted minutes.
- Pinned to a free model with a 32k output window.
- A strict output contract: one file, real copy, high design bar.

Tune that file to change how every build behaves.

## Layout

```
src/app/api/generate/route.ts     streaming build + refine endpoint
src/app/api/projects/             project list + single project endpoints
src/lib/engine/opencode.ts        engine: sessions, polling, refine, HTML extraction
src/lib/engine/projects.ts        local project store (.atelier/sites)
src/components/workspace/         3-pane UI (sidebar, chat, preview)
.opencode/agents/                 atelier-builder agent
.atelier/sites/                   generated sites (gitignored)
scripts/                          engine + API probes used during development
docs/                             design notes
```

## Notes

- `.atelier/` and `workspace/` are gitignored: generated sites stay local.
- Free models only. A slower model is normal; the build log shows real elapsed time.
- The code view, download and fullscreen act on the current generated file.
