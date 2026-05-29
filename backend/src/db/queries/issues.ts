import { eq, sql } from "drizzle-orm";
import { db } from "@db/index";
import { issues, projects } from "@db/schema";
import type { Issue, IssueStatus } from "@db/schema";
import { NotFoundError } from "@/types/api";

// ─────────────────────────────────────────────
// Input shapes (validated upstream — no raw Request objects here)
// ─────────────────────────────────────────────

export type CreateIssueInput = {
  projectId: string;
  reporterId: string;
  title: string;
  description?: string;
  status?: IssueStatus;
};

export type UpdateIssueStatusInput = {
  id: string;
  status: IssueStatus;
};

// ─────────────────────────────────────────────
// Status sort weight — evaluated in SQL, not in JS
// ─────────────────────────────────────────────

const STATUS_ORDER = sql<number>`
  CASE status
    WHEN 'todo'        THEN 0
    WHEN 'in_progress' THEN 1
    WHEN 'done'        THEN 2
    WHEN 'cancelled'   THEN 3
    ELSE                    4
  END
`;

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

/**
 * Atomically increments projects.issueCounter and inserts the issue
 * within a single transaction to guarantee a race-free issueNumber.
 */
export async function createIssue(input: CreateIssueInput): Promise<Issue> {
  return db.transaction(async (tx) => {
    // 1. Increment counter and fetch new value atomically
    const [updatedProject] = await tx
      .update(projects)
      .set({ issueCounter: sql`${projects.issueCounter} + 1` })
      .where(eq(projects.id, input.projectId))
      .returning({ issueNumber: projects.issueCounter });

    if (!updatedProject) {
      throw new NotFoundError("Project", input.projectId);
    }

    // 2. Insert issue with the freshly reserved number
    const [created] = await tx
      .insert(issues)
      .values({
        projectId: input.projectId,
        reporterId: input.reporterId,
        issueNumber: updatedProject.issueNumber,
        title: input.title,
        description: input.description ?? null,
        status: input.status ?? "todo",
      })
      .returning();

    // created is guaranteed by .returning() — tx would have thrown otherwise
    return created!;
  });
}

/**
 * Updates only the status field of a single issue.
 * Automatically sets completedAt when transitioning to 'done'.
 */
export async function updateIssueStatus(
  input: UpdateIssueStatusInput
): Promise<Issue> {
  const completedAt =
    input.status === "done" ? new Date() : null;

  const [updated] = await db
    .update(issues)
    .set({
      status: input.status,
      completedAt,
    })
    .where(eq(issues.id, input.id))
    .returning();

  if (!updated) {
    throw new NotFoundError("Issue", input.id);
  }

  return updated;
}

/**
 * Returns all issues for a project ordered by the canonical status sort
 * (todo → in_progress → done → cancelled), then by createdAt descending
 * within each status bucket.
 */
export async function listIssuesByProject(
  projectId: string
): Promise<Issue[]> {
  return db
    .select()
    .from(issues)
    .where(eq(issues.projectId, projectId))
    .orderBy(STATUS_ORDER, sql`${issues.createdAt} DESC`);
}
