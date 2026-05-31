import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "@db/index";
import { timeEntries, users } from "@db/schema";
import { requireAuth } from "@/middleware/requireAuth";
import { AppError, NotFoundError } from "@/types/api";
import type { ApiSuccess } from "@/types/api";
import type { TimeEntry } from "@db/schema";

const UUIDSchema = t.String({ format: "uuid", error: "Must be a valid UUID v4" });

export const timeTrackingController = new Elysia({ tags: ["TimeTracking"] })
  .use(requireAuth)

  .get(
    "/issues/:id/time-entries",
    async ({ params }): Promise<ApiSuccess<TimeEntry[]>> => {
      const rows = await db.select().from(timeEntries).where(eq(timeEntries.issueId, params.id));
      return { success: true, data: rows };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "List time entries for an issue" },
    }
  )

  .post(
    "/issues/:id/time-entries",
    async ({ params, body, user }): Promise<ApiSuccess<TimeEntry>> => {
      const [created] = await db.insert(timeEntries).values({
        issueId: params.id,
        userId: user.sub,
        startedAt: new Date(body.startedAt),
        endedAt: body.endedAt ? new Date(body.endedAt) : null,
        durationMinutes: body.durationMinutes ?? null,
        description: body.description ?? null,
      }).returning();
      return { success: true, data: created! };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      body: t.Object({
        startedAt: t.String(),
        endedAt: t.Optional(t.String()),
        durationMinutes: t.Optional(t.Number({ minimum: 1 })),
        description: t.Optional(t.String({ maxLength: 1000 })),
      }),
      detail: { summary: "Create a time entry" },
    }
  )

  .delete(
    "/time-entries/:id",
    async ({ params, user }): Promise<ApiSuccess<null>> => {
      const [entry] = await db.select().from(timeEntries).where(eq(timeEntries.id, params.id));
      if (!entry) throw new NotFoundError("TimeEntry", params.id);
      if (entry.userId !== user.sub) throw new AppError(403, "FORBIDDEN", "You can only delete your own time entries");
      await db.delete(timeEntries).where(eq(timeEntries.id, params.id));
      return { success: true, data: null };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "Delete a time entry" },
    }
  );
