import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export const SITES_ROOT = path.join(process.cwd(), ".atelier", "sites");

export interface ProjectMeta {
  id: string;
  title: string;
  brief: string;
  createdAt: number;
  updatedAt: number;
  builds: number;
}

const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/;

export function isSafeSiteId(id: string): boolean {
  return SAFE_ID.test(id) && id.length <= 120;
}

export async function writeProjectMeta(meta: ProjectMeta): Promise<void> {
  const target = path.join(SITES_ROOT, meta.id, "meta.json");
  await writeFile(target, JSON.stringify(meta, null, 2), "utf8");
}

export async function readProjectMeta(id: string): Promise<ProjectMeta | null> {
  if (!isSafeSiteId(id)) return null;

  try {
    const raw = await readFile(path.join(SITES_ROOT, id, "meta.json"), "utf8");
    const parsed = JSON.parse(raw) as Partial<ProjectMeta>;

    if (typeof parsed.title !== "string") return null;

    return {
      id,
      title: parsed.title,
      brief: typeof parsed.brief === "string" ? parsed.brief : "",
      createdAt: typeof parsed.createdAt === "number" ? parsed.createdAt : 0,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
      builds: typeof parsed.builds === "number" ? parsed.builds : 1,
    };
  } catch {
    return null;
  }
}

function titleFromHtml(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = match?.[1]?.replace(/\s+/g, " ").trim();
  return title || null;
}

export async function listProjects(): Promise<ProjectMeta[]> {
  let entries;

  try {
    entries = await readdir(SITES_ROOT, { withFileTypes: true });
  } catch {
    return [];
  }

  const projects: ProjectMeta[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !isSafeSiteId(entry.name)) continue;

    const htmlPath = path.join(SITES_ROOT, entry.name, "index.html");

    let htmlInfo;
    try {
      htmlInfo = await stat(htmlPath);
    } catch {
      continue;
    }

    if (!htmlInfo.isFile() || htmlInfo.size === 0) continue;

    const meta = await readProjectMeta(entry.name);

    if (meta) {
      projects.push(meta);
      continue;
    }

    const legacyTitle = await readFile(htmlPath, "utf8")
      .then((html) => titleFromHtml(html))
      .catch(() => null);

    projects.push({
      id: entry.name,
      title: legacyTitle ?? entry.name,
      brief: "",
      createdAt: htmlInfo.mtimeMs,
      updatedAt: htmlInfo.mtimeMs,
      builds: 1,
    });
  }

  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function readProjectHtml(id: string): Promise<string | null> {
  if (!isSafeSiteId(id)) return null;

  try {
    const html = await readFile(path.join(SITES_ROOT, id, "index.html"), "utf8");
    return html.trim() ? html : null;
  } catch {
    return null;
  }
}
