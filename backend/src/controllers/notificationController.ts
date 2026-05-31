import { Elysia, t } from "elysia";
import { eq, and, desc, count } from "drizzle-orm";
import { db } from "@db/index";
import { notifications } from "@db/schema";
import { requireAuth } from "@/middleware/requireAuth";
import { NotFoundError } from "@/types/api";
import type { ApiSuccess } from "@/types/api";
import type { Notification } from "@db/schema";

const UUIDSchema = t.String({ format: "uuid", error: "Must be a valid UUID v4" });

export const notificationController = new Elysia({ tags: ["Notifications"] })
  .use(requireAuth)

  .get(
    "/notifications",
    async ({ user }): Promise<ApiSuccess<Notification[]>> => {
      const rows = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, user.sub))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
      return { success: true, data: rows };
    },
    { detail: { summary: "List notifications" } }
  )

  .get(
    "/notifications/unread-count",
    async ({ user }): Promise<ApiSuccess<{ count: number }>> => {
      const [result] = await db
        .select({ value: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, user.sub), eq(notifications.isRead, false)));
      return { success: true, data: { count: Number(result?.value ?? 0) } };
    },
    { detail: { summary: "Get unread notification count" } }
  )

  .patch(
    "/notifications/:id/read",
    async ({ params, user }): Promise<ApiSuccess<Notification>> => {
      const [updated] = await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, params.id), eq(notifications.userId, user.sub)))
        .returning();
      if (!updated) throw new NotFoundError("Notification", params.id);
      return { success: true, data: updated };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "Mark notification as read" },
    }
  )

  .post(
    "/notifications/read-all",
    async ({ user }): Promise<ApiSuccess<null>> => {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.userId, user.sub), eq(notifications.isRead, false)));
      return { success: true, data: null };
    },
    { detail: { summary: "Mark all notifications as read" } }
  );
