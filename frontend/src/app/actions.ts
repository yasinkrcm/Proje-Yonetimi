"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api-client";
import type { Issue, IssueStatus } from "@/types/issue";
import type { Project } from "@/types/project";


// ─────────────────────────────────────────────────────────────────────────────
// Canonical action result — UI narrows on `success` to get typed data or error
// ─────────────────────────────────────────────────────────────────────────────

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─────────────────────────────────────────────────────────────────────────────
// Validation schemas (Zod) — only parsed values reach the backend
// ─────────────────────────────────────────────────────────────────────────────

const uuidSchema = z.string().uuid("Invalid UUID format");

const issueStatusSchema = z.enum([
  "todo",
  "in_progress",
  "done",
  "cancelled",
] as const satisfies readonly IssueStatus[]);

const createIssueSchema = z.object({
  projectId: uuidSchema,
  title: z.string().min(1, "Title is required").max(512),
  description: z.string().max(10_000).optional(),
  status: issueStatusSchema.optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// createIssueAction
// ─────────────────────────────────────────────────────────────────────────────

export async function createIssueAction(
  formData: FormData
): Promise<ActionResult<Issue>> {
  const parsed = createIssueSchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    status: formData.get("status") ?? undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const res = await apiFetch<Issue>("/issues", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });

  if (!res.success) {
    return { success: false, error: res.error.message };
  }

  revalidateTag(`project-issues-${parsed.data.projectId}`);
  revalidatePath(`/projects/${parsed.data.projectId}`);

  return { success: true, data: res.data };
}

// ─────────────────────────────────────────────────────────────────────────────
// updateIssueStatusAction
// ─────────────────────────────────────────────────────────────────────────────

export async function updateIssueStatusAction(
  issueId: string,
  newStatus: IssueStatus
): Promise<ActionResult<Issue>> {
  const idResult = uuidSchema.safeParse(issueId);
  if (!idResult.success) {
    return { success: false, error: "Invalid issue ID" };
  }

  const statusResult = issueStatusSchema.safeParse(newStatus);
  if (!statusResult.success) {
    return { success: false, error: "Invalid status value" };
  }

  const res = await apiFetch<Issue>(`/issues/${idResult.data}`, {
    method: "PATCH",
    body: JSON.stringify({ status: statusResult.data }),
  });

  if (!res.success) {
    return { success: false, error: res.error.message };
  }

  // Revalidate using the projectId from the backend response — no need to
  // accept projectId as a param and risk client-supplied spoofing.
  revalidateTag(`project-issues-${res.data.projectId}`);
  revalidatePath(`/projects/${res.data.projectId}`);

  return { success: true, data: res.data };
}

// ─────────────────────────────────────────────────────────────────────────────
// getProjectIssuesAction
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// getProjectsAction
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// getProjectAction
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// createProjectAction
// ─────────────────────────────────────────────────────────────────────────────

const createProjectSchema = z.object({
  key: z
    .string()
    .min(1, "Key is required")
    .max(8, "Key must be 8 characters or fewer"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(128, "Name must be 128 characters or fewer"),
  description: z.string().max(1000).optional(),
});

export async function createProjectAction(
  formData: FormData
): Promise<ActionResult<Project>> {
  const parsed = createProjectSchema.safeParse({
    key: formData.get("key"),
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(". "),
    };
  }

  const res = await apiFetch<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });

  if (!res.success) {
    return { success: false, error: res.error.message };
  }

  revalidateTag("projects");
  revalidatePath("/");

  return { success: true, data: res.data };
}
