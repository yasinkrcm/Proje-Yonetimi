import { Elysia, t } from "elysia";
import { eq, and, desc, sql, count, lt, not, inArray } from "drizzle-orm";
import { db } from "@db/index";
import { issues, projects, workspaceMembers, activityLogs, users } from "@db/schema";
import { requireAuth } from "@/middleware/requireAuth";
import type { ApiSuccess } from "@/types/api";
import type { Issue } from "@db/schema";

type DashboardStats = {
  totalIssues: number;
  completedIssues: number;
  inProgressIssues: number;
  overdueIssues: number;
};

type ActivityWithActor = {
  id: string;
  workspaceId: string;
  projectId: string | null;
  issueId: string | null;
  actorId: string;
  action: string;
  metadata: unknown;
  createdAt: Date;
  actorName: string;
  actorAvatarUrl: string | null;
};

export const dashboardController = new Elysia({ tags: ["Dashboard"] })
  .use(requireAuth)

  .get(
    "/dashboard/stats",
    async ({ user }): Promise<ApiSuccess<DashboardStats>> => {
      // Get user's workspace
      const [membership] = await db.select({ workspaceId: workspaceMembers.workspaceId }).from(workspaceMembers).where(eq(workspaceMembers.userId, user.sub)).limit(1);
      if (!membership) return { success: true, data: { totalIssues: 0, completedIssues: 0, inProgressIssues: 0, overdueIssues: 0 } };

      // Get all project IDs in workspace
      const projectRows = await db.select({ id: projects.id }).from(projects).where(eq(projects.workspaceId, membership.workspaceId));
      const projectIds = projectRows.map(p => p.id);
      if (projectIds.length === 0) return { success: true, data: { totalIssues: 0, completedIssues: 0, inProgressIssues: 0, overdueIssues: 0 } };

      const [total] = await db.select({ value: count() }).from(issues).where(inArray(issues.projectId, projectIds));
      const [completed] = await db.select({ value: count() }).from(issues).where(and(inArray(issues.projectId, projectIds), eq(issues.status, "done")));
      const [inProgress] = await db.select({ value: count() }).from(issues).where(and(inArray(issues.projectId, projectIds), eq(issues.status, "in_progress")));
      const [overdue] = await db.select({ value: count() }).from(issues).where(
        and(
          inArray(issues.projectId, projectIds),
          not(inArray(issues.status, ["done", "cancelled"])),
          lt(issues.dueAt, new Date())
        )
      );

      return {
        success: true,
        data: {
          totalIssues: Number(total?.value ?? 0),
          completedIssues: Number(completed?.value ?? 0),
          inProgressIssues: Number(inProgress?.value ?? 0),
          overdueIssues: Number(overdue?.value ?? 0),
        },
      };
    },
    { detail: { summary: "Get dashboard statistics" } }
  )

  .get(
    "/dashboard/my-issues",
    async ({ user }): Promise<ApiSuccess<Issue[]>> => {
      const PRIORITY_ORDER = sql<number>`
        CASE priority
          WHEN 'urgent'      THEN 0
          WHEN 'high'        THEN 1
          WHEN 'medium'      THEN 2
          WHEN 'low'         THEN 3
          WHEN 'no_priority' THEN 4
          ELSE                    5
        END
      `;
      const rows = await db
        .select()
        .from(issues)
        .where(and(eq(issues.assigneeId, user.sub), not(inArray(issues.status, ["done", "cancelled"]))))
        .orderBy(PRIORITY_ORDER, sql`${issues.dueAt} ASC NULLS LAST`);
      return { success: true, data: rows };
    },
    { detail: { summary: "Get issues assigned to me" } }
  )

  .get(
    "/dashboard/recent-activity",
    async ({ user }): Promise<ApiSuccess<ActivityWithActor[]>> => {
      const [membership] = await db.select({ workspaceId: workspaceMembers.workspaceId }).from(workspaceMembers).where(eq(workspaceMembers.userId, user.sub)).limit(1);
      if (!membership) return { success: true, data: [] };

      const rows = await db
        .select({
          id: activityLogs.id,
          workspaceId: activityLogs.workspaceId,
          projectId: activityLogs.projectId,
          issueId: activityLogs.issueId,
          actorId: activityLogs.actorId,
          action: activityLogs.action,
          metadata: activityLogs.metadata,
          createdAt: activityLogs.createdAt,
          actorName: users.displayName,
          actorAvatarUrl: users.avatarUrl,
        })
        .from(activityLogs)
        .innerJoin(users, eq(users.id, activityLogs.actorId))
        .where(eq(activityLogs.workspaceId, membership.workspaceId))
        .orderBy(desc(activityLogs.createdAt))
        .limit(20);
      return { success: true, data: rows };
    },
    { detail: { summary: "Get recent activity" } }
  )

  .get(
    "/dashboard/overdue",
    async ({ user }): Promise<ApiSuccess<Issue[]>> => {
      const rows = await db
        .select()
        .from(issues)
        .where(
          and(
            eq(issues.assigneeId, user.sub),
            not(inArray(issues.status, ["done", "cancelled"])),
            lt(issues.dueAt, new Date())
          )
        )
        .orderBy(sql`${issues.dueAt} ASC`);
      return { success: true, data: rows };
    },
    { detail: { summary: "Get overdue issues" } }
  );
