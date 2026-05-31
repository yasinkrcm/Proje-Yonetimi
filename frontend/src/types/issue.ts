// ─────────────────────────────────────────────────────────────────────────────
// Mirror of backend Drizzle schema inferred types.
// Dates are ISO strings here because JSON serialisation collapses Date objects.
// Keep in sync with backend/src/db/schema.ts — divergence is a compile error
// the moment these types are used in typed fetch calls.
// ─────────────────────────────────────────────────────────────────────────────

export type IssueStatus = "todo" | "in_progress" | "done" | "cancelled";
export type IssuePriority = "no_priority" | "urgent" | "high" | "medium" | "low";

export type Issue = {
  id: string;
  projectId: string;
  cycleId: string | null;
  parentIssueId: string | null;
  issueNumber: number;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  reporterId: string;
  assigneeId: string | null;
  dueAt: string | null;
  startAt: string | null;
  estimatedMinutes: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IssueWithDetails = Issue & {
  labels: { id: string; name: string; color: string }[];
  commentsCount: number;
  checklistsCount: number;
  checklistItemsTotal: number;
  checklistItemsDone: number;
  attachmentsCount: number;
  assigneeName: string | null;
  assigneeAvatarUrl: string | null;
  projectKey: string;
  projectName: string;
  subtasksCount: number;
};
