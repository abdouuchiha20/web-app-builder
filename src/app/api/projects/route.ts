import { listProjects } from "@/lib/engine/projects";

export async function GET() {
  const projects = await listProjects();
  return Response.json({ projects });
}
