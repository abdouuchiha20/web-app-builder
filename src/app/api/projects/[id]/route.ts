import { readProjectHtml, readProjectMeta } from "@/lib/engine/projects";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const html = await readProjectHtml(id);

  if (!html) {
    return Response.json({ error: "Project not found." }, { status: 404 });
  }

  const meta = await readProjectMeta(id);

  return Response.json({
    project: {
      id,
      html,
      title: meta?.title ?? "Untitled site",
      brief: meta?.brief ?? "",
      updatedAt: meta?.updatedAt ?? Date.now(),
      builds: meta?.builds ?? 1,
    },
  });
}
