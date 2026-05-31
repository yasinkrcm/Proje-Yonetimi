import { apiFetch } from "@/lib/api-client";
import { z } from "zod";
import type { ActionResult } from "@/app/actions";
import type { IssueWithDetails } from "@/types/issue";

import type { Comment } from "@/types/comment";
import type { Label } from "@/types/label";
import type { Checklist } from "@/types/checklist";
import type { TimeEntry } from "@/types/time-entry";
import type { Attachment } from "@/types/attachment";
import type { ActivityLog } from "@/types/activity";
import type { Notification, UnreadCount } from "@/types/notification";
import type { WorkspaceMember } from "@/types/member";
import type { DashboardStats } from "@/types/dashboard";
import type { SessionUser } from "@/types/auth";

const uuidSchema = z.string().uuid("Invalid UUID");

export async function getMeAction(): Promise<ActionResult<SessionUser>> {
  const res = await apiFetch<SessionUser>("/auth/me", {
    cache: "no-store",
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}

export async function getDashboardStats(): Promise<ActionResult<DashboardStats>> {
  const res = await apiFetch<DashboardStats>("/dashboard/stats", {
    next: { tags: ["dashboard-stats"] },
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}

export async function getMyIssues(): Promise<ActionResult<IssueWithDetails[]>> {
  const res = await apiFetch<IssueWithDetails[]>("/dashboard/my-issues", {
    next: { tags: ["my-issues"] },
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}

export async function getRecentActivity(): Promise<ActionResult<ActivityLog[]>> {
  const res = await apiFetch<ActivityLog[]>("/dashboard/recent-activity", {
    next: { tags: ["recent-activity"] },
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}

export async function getOverdueIssues(): Promise<ActionResult<IssueWithDetails[]>> {
  const res = await apiFetch<IssueWithDetails[]>("/dashboard/overdue", {
    next: { tags: ["overdue-issues"] },
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}

export async function getIssue(issueId: string): Promise<ActionResult<IssueWithDetails>> {
  const id = uuidSchema.safeParse(issueId);
  if (!id.success) return { success: false, error: "Invalid issue ID" };

  const res = await apiFetch<IssueWithDetails>(`/issues/${id.data}`, {
    cache: "no-store",
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}

export async function getProjectIssues(
  projectId: string,
  filters?: { status?: string; priority?: string; assigneeId?: string; q?: string }
): Promise<ActionResult<IssueWithDetails[]>> {
  const id = uuidSchema.safeParse(projectId);
  if (!id.success) return { success: false, error: "Invalid project ID" };

  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.priority) params.set("priority", filters.priority);
  if (filters?.assigneeId) params.set("assigneeId", filters.assigneeId);
  if (filters?.q) params.set("q", filters.q);

  const qs = params.toString();
  const path = `/projects/${id.data}/issues${qs ? `?${qs}` : ""}`;

  const res = await apiFetch<IssueWithDetails[]>(path, {
    next: { tags: [`project-issues-${id.data}`] },
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}
export async function getComments(issueId: string): Promise<ActionResult<Comment[]>> {
  const id = uuidSchema.safeParse(issueId);
  if (!id.success) return { success: false, error: "Invalid issue ID" };

  const res = await apiFetch<Comment[]>(`/issues/${id.data}/comments`, {
    next: { tags: [`issue-comments-${id.data}`] },
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}

export async function getLabels(projectId: string): Promise<ActionResult<Label[]>> {
  const id = uuidSchema.safeParse(projectId);
  if (!id.success) return { success: false, error: "Invalid project ID" };

  const res = await apiFetch<Label[]>(`/projects/${id.data}/labels`, {
    next: { tags: [`project-labels-${id.data}`] },
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}

export async function getChecklists(issueId: string): Promise<ActionResult<Checklist[]>> {
  const id = uuidSchema.safeParse(issueId);
  if (!id.success) return { success: false, error: "Invalid issue ID" };

  const res = await apiFetch<Checklist[]>(`/issues/${id.data}/checklists`, {
    next: { tags: [`issue-checklists-${id.data}`] },
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}

export async function getTimeEntries(issueId: string): Promise<ActionResult<TimeEntry[]>> {
  const id = uuidSchema.safeParse(issueId);
  if (!id.success) return { success: false, error: "Invalid issue ID" };

  const res = await apiFetch<TimeEntry[]>(`/issues/${id.data}/time-entries`, {
    next: { tags: [`issue-time-${id.data}`] },
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}

export async function getAttachments(issueId: string): Promise<ActionResult<Attachment[]>> {
  const id = uuidSchema.safeParse(issueId);
  if (!id.success) return { success: false, error: "Invalid issue ID" };

  const res = await apiFetch<Attachment[]>(`/issues/${id.data}/attachments`, {
    next: { tags: [`issue-attachments-${id.data}`] },
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}

export async function getProjectActivity(
  projectId: string
): Promise<ActionResult<ActivityLog[]>> {
  const id = uuidSchema.safeParse(projectId);
  if (!id.success) return { success: false, error: "Invalid project ID" };

  const res = await apiFetch<ActivityLog[]>(`/projects/${id.data}/activity`, {
    next: { tags: [`project-activity-${id.data}`] },
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}

export async function getIssueActivity(
  issueId: string
): Promise<ActionResult<ActivityLog[]>> {
  const id = uuidSchema.safeParse(issueId);
  if (!id.success) return { success: false, error: "Invalid issue ID" };

  const res = await apiFetch<ActivityLog[]>(`/issues/${id.data}/activity`, {
    next: { tags: [`issue-activity-${id.data}`] },
  });
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}

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

export async function getWorkspaceMembers(
  workspaceId: string
): Promise<ActionResult<WorkspaceMember[]>> {
  const id = uuidSchema.safeParse(workspaceId);
  if (!id.success) return { success: false, error: "Invalid workspace ID" };

  const res = await apiFetch<WorkspaceMember[]>(
    `/workspaces/${id.data}/members`,
    { next: { tags: [`workspace-members-${id.data}`] } }
  );
  if (!res.success) return { success: false, error: res.error.message };
  return { success: true, data: res.data };
}


