# Web App Builder — Design Doc

Date: 2026-11-09
Owner: Abdou
Status: Draft (awaiting approval)

---

## 1. What we're building

A personal **design-first web app builder** — your own workspace with a live browser preview, chat-driven generation, and a code/edits view. Think Google AI Studio Build, but focused on **top-end creative design + motion**, not generic templates.

You describe an idea (or pick a template) → the AI agent builds a complete website in a few steps → you preview it live → you make edits → you download the code or push to GitHub.

**Not** a "regular web app" generator. Design quality and motion are the core, not an afterthought.

---

## 2. Goals

- Research/idea → complete site, in as few edits as possible (save credits).
- Top-level design + motion, powered by the best design skills available.
- A real workspace: sidebar + chat + live preview.
- Flexible backend, ready to link with anything.
- GitHub linked, with changes saved as commits.
- Teach-as-you-go: the agent path/steps shown in plain human language.

## 3. Non-goals (for now)

- Multi-user / auth (later).
- Becoming a full SaaS product (architect for it, but build personal first).
- Billing, teams, public template marketplace.
- Niche/website-type filtering of skills (later enhancement).

---

## 4. The layout (locked)

```
┌───────────────┬─────────────────────────────┬──────────────────────┐
│   LEFT        │        CENTER               │        RIGHT         │
│  Sidebar      │        Chat                 │      Preview         │
│               │                             │                      │
│ • App menu    │ • Prompt holder             │ • Live preview       │
│   sections    │ • Conversation history      │ • Download code      │
│ • Templates   │ • AI agent path & steps     │ • Preview code       │
│   folder      │   in human language         │ • Full-screen page   │
│   (niche      │   (the fun/special parts,   │ • Responsive toggles │
│   starter     │   backend wired correctly   │ • Other controls     │
│   designs)    │   under the hood)           │                      │
└───────────────┴─────────────────────────────┴──────────────────────┘
```

- **Left:** app menu sections + **Templates folder** (ready-made niche designs to start from).
- **Center:** chat + prompt + agent steps explained simply, while it wires the backend properly.
- **Right:** preview with download, code preview, full-screen, responsive views, and more controls.

---

## 5. How it works — Approach A (OpenCode-as-engine)

The builder UI is a **workspace wrapper around OpenCode**:

```
User prompt / template
      → Builder UI (Next.js)
      → OpenCode engine (server/API/SDK) with our Primary / Plan / Build agents
      → Generated app code
      → Live preview (dev server + browser)
      → Edits loop (prompt → diff → apply → re-preview)
      → Download / GitHub commit
```

We reuse what already exists (agents + skills + model pool) instead of rebuilding an agent loop from scratch.

---

## 6. Stack

- **Frontend/app:** Next.js
- **Database:** Supabase (auth later; DB used for projects/templates/versions)
- **Engine:** OpenCode server/API/SDK
- **Preview:** local dev server + browser screenshot/preview
- **Versioning:** git-based, commits per change
- **Export:** download zip + push to GitHub

---

## 7. Model routing

- Prefer a strong coding model for design-heavy generations.
- Free-tier fallbacks (Omnirouter, Ollama, etc.) when needed.
- Goal: **one complete site in few edits** — minimize retries/credit burn.

---

## 8. Design skills baked in

Start set (enhance/filter later by niche + website type):

- `top-design`
- `frontend-design`
- `impeccable`
- `ux-heuristics`
- `web-typography`
- `refactoring-ui`
- `react-best-practices`
- `microinteractions`
- `web-design-guidelines`

---

## 9. GitHub & commits (simple explanation)

- **Git** = a version recorder. Each **commit** is a snapshot of your project with a short message ("added hero section").
- **GitHub** = cloud storage for those snapshots (a **repo**), so you can back up, share, and see history.
- In the builder: each AI edit can become a commit → easy rollback, clean history.
- Flow: connect GitHub → create/choose repo → commit changes from the app.

---

## 10. Future (later)

- Auth + multi-user (Supabase).
- Product/SaaS packaging.
- Niche + website-type skill filtering.
- Template marketplace.
- More preview controls.

---

## 11. Next step

Approve this doc → write the implementation plan (Plan mode / writing-plans) → build.
