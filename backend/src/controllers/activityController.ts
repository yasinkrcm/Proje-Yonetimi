import { Elysia, t } from "elysia";
import { eq, desc } from "drizzle-orm";
import { db } from "@db/index";
import { activityLogs, users } from "@db/schema";
import { requireAuth } from "@/middleware/requireAuth";
import type { ApiSuccess } from "@/types/api";

const UUIDSchema = t.String({ format: "uuid", error: "Must be a valid UUID v4" });

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

export const activityController = new Elysia({ tags: ["Activity"] })
  .use(requireAuth)

  .get(
    "/projects/:id/activity",
    async ({ params }): Promise<ApiSuccess<ActivityWithActor[]>> => {
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
        .where(eq(activityLogs.projectId, params.id))
        .orderBy(desc(activityLogs.createdAt))
        .limit(50);
      return { success: true, data: rows };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "List activity for a project" },
    }
  )

  .get(
    "/issues/:id/activity",
    async ({ params }): Promise<ApiSuccess<ActivityWithActor[]>> => {
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
        .where(eq(activityLogs.issueId, params.id))
        .orderBy(desc(activityLogs.createdAt))
        .limit(50);
      return { success: true, data: rows };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "List activity for an issue" },
    }
  );
