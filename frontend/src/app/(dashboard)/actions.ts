"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api-client";
import type { ActionResult } from "@/app/actions";
import type { Issue, IssueWithDetails } from "@/types/issue";
import type { Project } from "@/types/project";
import type { Comment } from "@/types/comment";
import type { Label } from "@/types/label";
import type { Checklist } from "@/types/checklist";
import type { ChecklistItem } from "@/types/checklist";
import type { TimeEntry } from "@/types/time-entry";
import type { Attachment } from "@/types/attachment";
import type { Notification, UnreadCount } from "@/types/notification";
import type { WorkspaceMember } from "@/types/member";


// ─────────────────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────────────────

const uuidSchema = z.string().uuid("Invalid UUID");

const issueStatusSchema = z.enum(["todo", "in_progress", "done", "cancelled"]);
const issuePrioritySchema = z.enum(["no_priority", "urgent", "high", "medium", "low"]);
const memberRoleSchema = z.enum(["owner", "admin", "member", "viewer"]);

// ─────────────────────────────────────────────────────────────────────────────
// Auth / Me
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────





// ─────────────────────────────────────────────────────────────────────────────
// Issues
// ─────────────────────────────────────────────────────────────────────────────


const updateIssueSchema = z.object({
  title: z.string().min(1).max(512).optional(),
  description: z.string().max(10_000).nullable().optional(),
  status: issueStatusSchema.optional(),
  priority: issuePrioritySchema.optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  startAt: z.string().nullable().optional(),
  estimatedMinutes: z.number().min(0).nullable().optional(),
  cycleId: z.string().uuid().nullable().optional(),
  parentIssueId: z.string().uuid().nullable().optional(),
});

export async function updateIssue(
  issueId: string,
  data: z.infer<typeof updateIssueSchema>
): Promise<ActionResult<Issue>> {
  const id = uuidSchema.safeParse(issueId);
  if (!id.success) return { success: false, error: "Invalid issue ID" };

  const parsed = updateIssueSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const res = await apiFetch<Issue>(`/issues/${id.data}`, {
    method: "PATCH",
    body: JSON.stringify(parsed.data),
  });
  if (!res.success) return { success: false, error: res.error.message };

  revalidateTag(`project-issues-${res.data.projectId}`);
  revalidateTag("my-issues");
  revalidateTag("dashboard-stats");
  revalidatePath(`/projects/${res.data.projectId}`);

  return { success: true, data: res.data };
}

export async function deleteIssue(issueId: string): Promise<ActionResult<null>> {
  const id = uuidSchema.safeParse(issueId);
  if (!id.success) return { success: false, error: "Invalid issue ID" };

  const res = await apiFetch<null>(`/issues/${id.data}`, { method: "DELETE" });
  if (!res.success) return { success: false, error: res.error.message };

  revalidateTag("my-issues");
  revalidateTag("dashboard-stats");
  return { success: true, data: null };
}


// ─────────────────────────────────────────────────────────────────────────────
// Comments
// ─────────────────────────────────────────────────────────────────────────────


const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(5000),
});

export async function createComment(
  issueId: string,
  content: string
): Promise<ActionResult<Comment>> {
  const id = uuidSchema.safeParse(issueId);
  if (!id.success) return { success: false, error: "Invalid issue ID" };

  const parsed = createCommentSchema.safeParse({ content });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const res = await apiFetch<Comment>(`/issues/${id.data}/comments`, {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
  if (!res.success) return { success: false, error: res.error.message };

  revalidateTag(`issue-comments-${id.data}`);
  return { success: true, data: res.data };
}

export async function deleteComment(commentId: string): Promise<ActionResult<null>> {
  const id = uuidSchema.safeParse(commentId);
  if (!id.success) return { success: false, error: "Invalid comment ID" };

  const res = await apiFetch<null>(`/comments/${id.data}`, { method: "DELETE" });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// Labels
// ─────────────────────────────────────────────────────────────────────────────


const createLabelSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color"),
});

export async function createLabel(
  projectId: string,
  data: { name: string; color: string }
): Promise<ActionResult<Label>> {
  const id = uuidSchema.safeParse(projectId);
  if (!id.success) return { success: false, error: "Invalid project ID" };

  const parsed = createLabelSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const res = await apiFetch<Label>(`/projects/${id.data}/labels`, {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
  if (!res.success) return { success: false, error: res.error.message };

  revalidateTag(`project-labels-${id.data}`);
  return { success: true, data: res.data };
}

export async function updateLabel(
  labelId: string,
  data: { name?: string; color?: string }
): Promise<ActionResult<Label>> {
  const id = uuidSchema.safeParse(labelId);
  if (!id.success) return { success: false, error: "Invalid label ID" };

  const res = await apiFetch<Label>(`/labels/${id.data}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.success) return { success: false, error: res.error.message };

  revalidateTag(`project-labels-${res.data.projectId}`);
  return { success: true, data: res.data };
}

export async function deleteLabel(labelId: string): Promise<ActionResult<null>> {
  const id = uuidSchema.safeParse(labelId);
  if (!id.success) return { success: false, error: "Invalid label ID" };

  const res = await apiFetch<null>(`/labels/${id.data}`, { method: "DELETE" });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: null };
}

export async function addIssueLabel(
  issueId: string,
  labelId: string
): Promise<ActionResult<null>> {
  const iid = uuidSchema.safeParse(issueId);
  const lid = uuidSchema.safeParse(labelId);
  if (!iid.success || !lid.success) return { success: false, error: "Invalid ID" };

  const res = await apiFetch<null>(`/issues/${iid.data}/labels`, {
    method: "POST",
    body: JSON.stringify({ labelId: lid.data }),
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: null };
}

export async function removeIssueLabel(
  issueId: string,
  labelId: string
): Promise<ActionResult<null>> {
  const iid = uuidSchema.safeParse(issueId);
  const lid = uuidSchema.safeParse(labelId);
  if (!iid.success || !lid.success) return { success: false, error: "Invalid ID" };

  const res = await apiFetch<null>(`/issues/${iid.data}/labels/${lid.data}`, {
    method: "DELETE",
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// Checklists
// ─────────────────────────────────────────────────────────────────────────────


export async function createChecklist(
  issueId: string,
  title: string
): Promise<ActionResult<Checklist>> {
  const id = uuidSchema.safeParse(issueId);
  if (!id.success) return { success: false, error: "Invalid issue ID" };

  const titleParsed = z.string().min(1).max(200).safeParse(title);
  if (!titleParsed.success) return { success: false, error: "Invalid title" };

  const res = await apiFetch<Checklist>(`/issues/${id.data}/checklists`, {
    method: "POST",
    body: JSON.stringify({ title: titleParsed.data }),
  });
  if (!res.success) return { success: false, error: res.error.message };

  revalidateTag(`issue-checklists-${id.data}`);
  return { success: true, data: res.data };
}

export async function deleteChecklist(checklistId: string): Promise<ActionResult<null>> {
  const id = uuidSchema.safeParse(checklistId);
  if (!id.success) return { success: false, error: "Invalid checklist ID" };

  const res = await apiFetch<null>(`/checklists/${id.data}`, { method: "DELETE" });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: null };
}

export async function addChecklistItem(
  checklistId: string,
  content: string
): Promise<ActionResult<ChecklistItem>> {
  const id = uuidSchema.safeParse(checklistId);
  if (!id.success) return { success: false, error: "Invalid checklist ID" };

  const contentParsed = z.string().min(1).max(500).safeParse(content);
  if (!contentParsed.success) return { success: false, error: "Invalid content" };

  const res = await apiFetch<ChecklistItem>(`/checklists/${id.data}/items`, {
    method: "POST",
    body: JSON.stringify({ content: contentParsed.data }),
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}

export async function updateChecklistItem(
  itemId: string,
  data: { content?: string; isCompleted?: boolean }
): Promise<ActionResult<ChecklistItem>> {
  const id = uuidSchema.safeParse(itemId);
  if (!id.success) return { success: false, error: "Invalid item ID" };

  const res = await apiFetch<ChecklistItem>(`/checklist-items/${id.data}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}

export async function deleteChecklistItem(itemId: string): Promise<ActionResult<null>> {
  const id = uuidSchema.safeParse(itemId);
  if (!id.success) return { success: false, error: "Invalid item ID" };

  const res = await apiFetch<null>(`/checklist-items/${id.data}`, { method: "DELETE" });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// Time Entries
// ─────────────────────────────────────────────────────────────────────────────


const createTimeEntrySchema = z.object({
  durationMinutes: z.number().min(1, "Must be at least 1 minute"),
  description: z.string().max(500).optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
});

export async function createTimeEntry(
  issueId: string,
  data: z.infer<typeof createTimeEntrySchema>
): Promise<ActionResult<TimeEntry>> {
  const id = uuidSchema.safeParse(issueId);
  if (!id.success) return { success: false, error: "Invalid issue ID" };

  const parsed = createTimeEntrySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const res = await apiFetch<TimeEntry>(`/issues/${id.data}/time-entries`, {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
  if (!res.success) return { success: false, error: res.error.message };

  revalidateTag(`issue-time-${id.data}`);
  return { success: true, data: res.data };
}

export async function deleteTimeEntry(entryId: string): Promise<ActionResult<null>> {
  const id = uuidSchema.safeParse(entryId);
  if (!id.success) return { success: false, error: "Invalid entry ID" };

  const res = await apiFetch<null>(`/time-entries/${id.data}`, { method: "DELETE" });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// Attachments
// ─────────────────────────────────────────────────────────────────────────────


export async function uploadAttachment(
  issueId: string,
  formData: FormData
): Promise<ActionResult<Attachment>> {
  const id = uuidSchema.safeParse(issueId);
  if (!id.success) return { success: false, error: "Invalid issue ID" };

  // apiFetch sets Content-Type to JSON by default. For file uploads we need
  // the browser/server to set multipart boundary automatically.
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;
  const baseUrl = process.env.BACKEND_API_URL;
  if (!baseUrl) return { success: false, error: "Server misconfigured" };

  const res = await fetch(`${baseUrl}/issues/${id.data}/attachments`, {
    method: "POST",
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: formData,
  });

  const json = await res.json();
  if (!json.success) return { success: false, error: json.error?.message || "Upload failed" };

  revalidateTag(`issue-attachments-${id.data}`);
  return { success: true, data: json.data };
}

export async function deleteAttachment(attachmentId: string): Promise<ActionResult<null>> {
  const id = uuidSchema.safeParse(attachmentId);
  if (!id.success) return { success: false, error: "Invalid attachment ID" };

  const res = await apiFetch<null>(`/attachments/${id.data}`, { method: "DELETE" });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity
// ─────────────────────────────────────────────────────────────────────────────



// ─────────────────────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────────────────────

export async function getNotifications(): Promise<ActionResult<Notification[]>> {
  const res = await apiFetch<Notification[]>("/notifications", {
    cache: "no-store",
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}

export async function getUnreadCount(): Promise<ActionResult<UnreadCount>> {
  const res = await apiFetch<UnreadCount>("/notifications/unread-count", {
    cache: "no-store",
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}
export async function markNotificationRead(
  notificationId: string
): Promise<ActionResult<null>> {
  const id = uuidSchema.safeParse(notificationId);
  if (!id.success) return { success: false, error: "Invalid notification ID" };

  const res = await apiFetch<null>(`/notifications/${id.data}/read`, {
    method: "PATCH",
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: null };
}

export async function markAllNotificationsRead(): Promise<ActionResult<null>> {
  const res = await apiFetch<null>("/notifications/read-all", {
    method: "POST",
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: null };
}


// ─────────────────────────────────────────────────────────────────────────────
// Members
// ─────────────────────────────────────────────────────────────────────────────


export async function addWorkspaceMember(
  workspaceId: string,
  email: string,
  role: string
): Promise<ActionResult<WorkspaceMember>> {
  const wid = uuidSchema.safeParse(workspaceId);
  if (!wid.success) return { success: false, error: "Invalid workspace ID" };

  const emailParsed = z.string().email().safeParse(email);
  if (!emailParsed.success) return { success: false, error: "Invalid email" };

  const roleParsed = memberRoleSchema.safeParse(role);
  if (!roleParsed.success) return { success: false, error: "Invalid role" };

  const res = await apiFetch<WorkspaceMember>(
    `/workspaces/${wid.data}/members`,
    {
      method: "POST",
      body: JSON.stringify({ email: emailParsed.data, role: roleParsed.data }),
    }
  );
  if (!res.success) return { success: false, error: res.error.message };

  revalidateTag(`workspace-members-${wid.data}`);
  return { success: true, data: res.data };
}

export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  role: string
): Promise<ActionResult<WorkspaceMember>> {
  const wid = uuidSchema.safeParse(workspaceId);
  const uid = uuidSchema.safeParse(userId);
  if (!wid.success || !uid.success) return { success: false, error: "Invalid ID" };

  const roleParsed = memberRoleSchema.safeParse(role);
  if (!roleParsed.success) return { success: false, error: "Invalid role" };

  const res = await apiFetch<WorkspaceMember>(
    `/workspaces/${wid.data}/members/${uid.data}`,
    {
      method: "PATCH",
      body: JSON.stringify({ role: roleParsed.data }),
    }
  );
  if (!res.success) return { success: false, error: res.error.message };

  revalidateTag(`workspace-members-${wid.data}`);
  return { success: true, data: res.data };
}

export async function removeMember(
  workspaceId: string,
  userId: string
): Promise<ActionResult<null>> {
  const wid = uuidSchema.safeParse(workspaceId);
  const uid = uuidSchema.safeParse(userId);
  if (!wid.success || !uid.success) return { success: false, error: "Invalid ID" };

  const res = await apiFetch<null>(
    `/workspaces/${wid.data}/members/${uid.data}`,
    { method: "DELETE" }
  );
  if (!res.success) return { success: false, error: res.error.message };

  revalidateTag(`workspace-members-${wid.data}`);
  return { success: true, data: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────────────────────────────

type SearchResults = {
  projects: Project[];
  issues: IssueWithDetails[];
};

export async function searchAll(
  query: string,
  workspaceId?: string
): Promise<ActionResult<SearchResults>> {
  const q = z.string().min(1).max(200).safeParse(query);
  if (!q.success) return { success: false, error: "Invalid query" };

  const params = new URLSearchParams({ q: q.data });
  if (workspaceId) params.set("workspaceId", workspaceId);

  const res = await apiFetch<SearchResults>(`/search?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}


// ─────────────────────────────────────────────────────────────────────────────
// Projects (additional mutations)
// ─────────────────────────────────────────────────────────────────────────────

const updateProjectSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(1000).nullable().optional(),
});

export async function updateProject(
  projectId: string,
  data: z.infer<typeof updateProjectSchema>
): Promise<ActionResult<Project>> {
  const id = uuidSchema.safeParse(projectId);
  if (!id.success) return { success: false, error: "Invalid project ID" };

  const parsed = updateProjectSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const res = await apiFetch<Project>(`/projects/${id.data}`, {
    method: "PATCH",
    body: JSON.stringify(parsed.data),
  });
  if (!res.success) return { success: false, error: res.error.message };

  revalidateTag("projects");
  revalidatePath(`/projects/${id.data}`);
  return { success: true, data: res.data };
}

export async function deleteProject(projectId: string): Promise<ActionResult<null>> {
  const id = uuidSchema.safeParse(projectId);
  if (!id.success) return { success: false, error: "Invalid project ID" };

  const res = await apiFetch<null>(`/projects/${id.data}`, { method: "DELETE" });
  if (!res.success) return { success: false, error: res.error.message };

  revalidateTag("projects");
  revalidatePath("/");
  return { success: true, data: null };
}

export async function archiveProject(projectId: string): Promise<ActionResult<Project>> {
  const id = uuidSchema.safeParse(projectId);
  if (!id.success) return { success: false, error: "Invalid project ID" };

  const res = await apiFetch<Project>(`/projects/${id.data}/archive`, {
    method: "PATCH",
  });
  if (!res.success) return { success: false, error: res.error.message };

  revalidateTag("projects");
  revalidatePath(`/projects/${id.data}`);
  return { success: true, data: res.data };
}
