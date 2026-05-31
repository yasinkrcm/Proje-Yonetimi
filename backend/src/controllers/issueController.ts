import { Elysia, t } from "elysia";
import { eq, and, sql, ilike, inArray, count } from "drizzle-orm";
import { db } from "@db/index";
import {
  issues,
  projects,
  comments,
  issueLabels,
  labels,
  checklists,
  attachments,
  workspaceMembers,
} from "@db/schema";
import { requireAuth } from "@/middleware/requireAuth";
import { NotFoundError } from "@/types/api";
import type { ApiSuccess } from "@/types/api";
import type { Issue } from "@db/schema";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";

// ─────────────────────────────────────────────
// Reusable TypeBox schemas
// ─────────────────────────────────────────────

const StatusSchema = t.Union([
  t.Literal("todo"),
  t.Literal("in_progress"),
  t.Literal("done"),
  t.Literal("cancelled"),
]);

const PrioritySchema = t.Union([
  t.Literal("no_priority"),
  t.Literal("urgent"),
  t.Literal("high"),
  t.Literal("medium"),
  t.Literal("low"),
]);

const UUIDSchema = t.String({
  format: "uuid",
  error: "Must be a valid UUID v4",
});

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
// Plugin
// ─────────────────────────────────────────────

export const issueController = new Elysia({ tags: ["Issues"] })
  .use(requireAuth)

  // ── POST /issues ───────────────────────────
  .post(
    "/issues",
    async ({ body, user }): Promise<ApiSuccess<Issue>> => {
      const issue = await db.transaction(async (tx) => {
        const [updatedProject] = await tx
          .update(projects)
          .set({ issueCounter: sql`${projects.issueCounter} + 1` })
          .where(eq(projects.id, body.projectId))
          .returning({ issueNumber: projects.issueCounter, workspaceId: projects.workspaceId });

        if (!updatedProject) throw new NotFoundError("Project", body.projectId);

        const [created] = await tx
          .insert(issues)
          .values({
            projectId: body.projectId,
            reporterId: user.sub,
            issueNumber: updatedProject.issueNumber,
            title: body.title,
            description: body.description ?? null,
            status: body.status ?? "todo",
            priority: body.priority ?? "no_priority",
            assigneeId: body.assigneeId ?? null,
            dueAt: body.dueAt ? new Date(body.dueAt) : null,
            startAt: body.startAt ? new Date(body.startAt) : null,
            estimatedMinutes: body.estimatedMinutes ?? null,
            parentIssueId: body.parentIssueId ?? null,
          })
          .returning();

        // Log activity
        await logActivity({
          workspaceId: updatedProject.workspaceId,
          projectId: body.projectId,
          issueId: created!.id,
          actorId: user.sub,
          action: "issue.created",
          metadata: { title: body.title },
        });

        return created!;
      });

      return { success: true, data: issue };
    },
    {
      body: t.Object({
        projectId: UUIDSchema,
        title: t.String({ minLength: 1, maxLength: 512 }),
        description: t.Optional(t.String({ maxLength: 10_000 })),
        status: t.Optional(StatusSchema),
        priority: t.Optional(PrioritySchema),
        assigneeId: t.Optional(t.String()),
        dueAt: t.Optional(t.String()),
        startAt: t.Optional(t.String()),
        estimatedMinutes: t.Optional(t.Number({ minimum: 1 })),
        parentIssueId: t.Optional(t.String()),
      }),
      detail: { summary: "Create a new issue" },
    }
  )

  // ── GET /issues/:id ────────────────────────
  .get(
    "/issues/:id",
    async ({ params }): Promise<ApiSuccess<Issue & {
      commentsCount: number;
      checklistsCount: number;
      attachmentsCount: number;
      labels: { id: string; name: string; color: string }[];
    }>> => {
      const [issue] = await db.select().from(issues).where(eq(issues.id, params.id));
      if (!issue) throw new NotFoundError("Issue", params.id);

      const [commentsResult] = await db.select({ value: count() }).from(comments).where(eq(comments.issueId, params.id));
      const [checklistsResult] = await db.select({ value: count() }).from(checklists).where(eq(checklists.issueId, params.id));
      const [attachmentsResult] = await db.select({ value: count() }).from(attachments).where(eq(attachments.issueId, params.id));

      // Get labels
      const labelRows = await db
        .select({ id: labels.id, name: labels.name, color: labels.color })
        .from(issueLabels)
        .innerJoin(labels, eq(labels.id, issueLabels.labelId))
        .where(eq(issueLabels.issueId, params.id));

      return {
        success: true,
        data: {
          ...issue,
          commentsCount: Number(commentsResult?.value ?? 0),
          checklistsCount: Number(checklistsResult?.value ?? 0),
          attachmentsCount: Number(attachmentsResult?.value ?? 0),
          labels: labelRows,
        },
      };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "Get issue detail with counts" },
    }
  )

  // ── PATCH /issues/:id ──────────────────────
  .patch(
    "/issues/:id",
    async ({ params, body, user }): Promise<ApiSuccess<Issue>> => {
      const [existing] = await db.select().from(issues).where(eq(issues.id, params.id));
      if (!existing) throw new NotFoundError("Issue", params.id);

      const updates: Record<string, unknown> = {};
      if (body.status !== undefined) {
        updates.status = body.status;
        updates.completedAt = body.status === "done" ? new Date() : null;
      }
      if (body.title !== undefined) updates.title = body.title;
      if (body.description !== undefined) updates.description = body.description;
      if (body.priority !== undefined) updates.priority = body.priority;
      if (body.assigneeId !== undefined) updates.assigneeId = body.assigneeId || null;
      if (body.dueAt !== undefined) updates.dueAt = body.dueAt ? new Date(body.dueAt) : null;
      if (body.startAt !== undefined) updates.startAt = body.startAt ? new Date(body.startAt) : null;
      if (body.estimatedMinutes !== undefined) updates.estimatedMinutes = body.estimatedMinutes;
      if (body.cycleId !== undefined) updates.cycleId = body.cycleId || null;
      if (body.parentIssueId !== undefined) updates.parentIssueId = body.parentIssueId || null;

      const [updated] = await db
        .update(issues)
        .set(updates)
        .where(eq(issues.id, params.id))
        .returning();

      // Get project's workspace for activity log
      const [project] = await db.select({ workspaceId: projects.workspaceId }).from(projects).where(eq(projects.id, existing.projectId));

      if (project) {
        await logActivity({
          workspaceId: project.workspaceId,
          projectId: existing.projectId,
          issueId: params.id,
          actorId: user.sub,
          action: "issue.updated",
          metadata: { fields: Object.keys(updates) },
        });
      }

      // Notify new assignee
      if (body.assigneeId && body.assigneeId !== existing.assigneeId && body.assigneeId !== user.sub) {
        await createNotification({
          userId: body.assigneeId,
          type: "assignment",
          title: "Issue atandı",
          message: `"${updated!.title}" size atandı`,
          link: `/issues/${params.id}`,
        });
      }

      return { success: true, data: updated! };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      body: t.Object({
        status: t.Optional(StatusSchema),
        title: t.Optional(t.String({ minLength: 1, maxLength: 512 })),
        description: t.Optional(t.String({ maxLength: 10_000 })),
        priority: t.Optional(PrioritySchema),
        assigneeId: t.Optional(t.String()),
        dueAt: t.Optional(t.String()),
        startAt: t.Optional(t.String()),
        estimatedMinutes: t.Optional(t.Number({ minimum: 1 })),
        cycleId: t.Optional(t.String()),
        parentIssueId: t.Optional(t.String()),
      }),
      detail: { summary: "Update an issue" },
    }
  )

  // ── DELETE /issues/:id ─────────────────────
  .delete(
    "/issues/:id",
    async ({ params, user }): Promise<ApiSuccess<null>> => {
      const [issue] = await db.select().from(issues).where(eq(issues.id, params.id));
      if (!issue) throw new NotFoundError("Issue", params.id);

      await db.delete(issues).where(eq(issues.id, params.id));

      const [project] = await db.select({ workspaceId: projects.workspaceId }).from(projects).where(eq(projects.id, issue.projectId));
      if (project) {
        await logActivity({
          workspaceId: project.workspaceId,
          projectId: issue.projectId,
          actorId: user.sub,
          action: "issue.deleted",
          metadata: { title: issue.title },
        });
      }

      return { success: true, data: null };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "Delete an issue" },
    }
  )

  // ── GET /projects/:id/issues ────────
  .get(
    "/projects/:id/issues",
    async ({ params, query }): Promise<ApiSuccess<Issue[]>> => {
      const conditions = [eq(issues.projectId, params.id)];

      if (query.status) conditions.push(eq(issues.status, query.status as any));
      if (query.priority) conditions.push(eq(issues.priority, query.priority as any));
      if (query.assigneeId) conditions.push(eq(issues.assigneeId, query.assigneeId));
      if (query.q) conditions.push(ilike(issues.title, `%${query.q}%`));

      const result = await db
        .select()
        .from(issues)
        .where(and(...conditions))
        .orderBy(STATUS_ORDER, sql`${issues.createdAt} DESC`);

      return { success: true, data: result };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      query: t.Object({
        status: t.Optional(t.String()),
        priority: t.Optional(t.String()),
        assigneeId: t.Optional(t.String()),
        q: t.Optional(t.String()),
      }),
      detail: { summary: "List all issues for a project with optional filters" },
    }
  );
