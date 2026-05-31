import { apiFetch } from "@/lib/api-client";
import { z } from "zod";
import type { ActionResult } from "@/app/actions";
import type { Issue } from "@/types/issue";
import type { Project } from "@/types/project";

const uuidSchema = z.string().uuid("Invalid UUID format");
export async function getProjectIssuesAction(
  projectId: string
): Promise<ActionResult<Issue[]>> {
  const idResult = uuidSchema.safeParse(projectId);
  if (!idResult.success) {
    return { success: false, error: "Invalid project ID" };
  }

  const res = await apiFetch<Issue[]>(
    `/projects/${idResult.data}/issues`,
    {
      // Next.js fetch cache: tag-based revalidation matches the write actions above
      next: { tags: [`project-issues-${idResult.data}`] },
    }
  );

  if (!res.success) {
    return { success: false, error: res.error.message };
  }

  return { success: true, data: res.data };
}

export async function getProjectsAction(): Promise<ActionResult<Project[]>> {
  const res = await apiFetch<Project[]>("/projects", {
    next: { tags: ["projects"] },
  });

  if (!res.success) {
    return { success: false, error: res.error.message };
  }

  return { success: true, data: res.data };
}

export async function getProjectAction(
  projectId: string
): Promise<ActionResult<Project>> {
  const idResult = z.string().uuid().safeParse(projectId);
  if (!idResult.success) {
    return { success: false, error: "Invalid project ID" };
  }

  const res = await apiFetch<Project>(`/projects/${idResult.data}`);

  if (!res.success) {
    return { success: false, error: res.error.message };
  }

  return { success: true, data: res.data };
}
