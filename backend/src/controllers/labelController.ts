import { Elysia, t } from "elysia";
import { eq, and } from "drizzle-orm";
import { db } from "@db/index";
import { labels, issueLabels } from "@db/schema";
import { requireAuth } from "@/middleware/requireAuth";
import { NotFoundError } from "@/types/api";
import type { ApiSuccess } from "@/types/api";
import type { Label, IssueLabel } from "@db/schema";

const UUIDSchema = t.String({ format: "uuid", error: "Must be a valid UUID v4" });

export const labelController = new Elysia({ tags: ["Labels"] })
  .use(requireAuth)

  .get(
    "/projects/:id/labels",
    async ({ params }): Promise<ApiSuccess<Label[]>> => {
      const rows = await db.select().from(labels).where(eq(labels.projectId, params.id)).orderBy(asc(labels.name));
      return { success: true, data: rows };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "List labels for a project" },
    }
  )

  .post(
    "/projects/:id/labels",
    async ({ params, body }): Promise<ApiSuccess<Label>> => {
      const [created] = await db.insert(labels).values({
        projectId: params.id,
        name: body.name,
        color: body.color,
      }).returning();
      return { success: true, data: created! };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 64 }),
        color: t.String({ minLength: 4, maxLength: 7 }),
      }),
      detail: { summary: "Create a label" },
    }
  )

  .patch(
    "/labels/:id",
    async ({ params, body }): Promise<ApiSuccess<Label>> => {
      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.color !== undefined) updates.color = body.color;
      const [updated] = await db.update(labels).set(updates).where(eq(labels.id, params.id)).returning();
      if (!updated) throw new NotFoundError("Label", params.id);
      return { success: true, data: updated };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 64 })),
        color: t.Optional(t.String({ minLength: 4, maxLength: 7 })),
      }),
      detail: { summary: "Update a label" },
    }
  )

  .delete(
    "/labels/:id",
    async ({ params }): Promise<ApiSuccess<null>> => {
      const [deleted] = await db.delete(labels).where(eq(labels.id, params.id)).returning();
      if (!deleted) throw new NotFoundError("Label", params.id);
      return { success: true, data: null };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "Delete a label" },
    }
  )

  .post(
    "/issues/:id/labels",
    async ({ params, body }): Promise<ApiSuccess<IssueLabel>> => {
      const [created] = await db.insert(issueLabels).values({
        issueId: params.id,
        labelId: body.labelId,
      }).returning();
      return { success: true, data: created! };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      body: t.Object({ labelId: UUIDSchema }),
      detail: { summary: "Add a label to an issue" },
    }
  )

  .delete(
    "/issues/:id/labels/:labelId",
    async ({ params }): Promise<ApiSuccess<null>> => {
      await db.delete(issueLabels).where(
        and(eq(issueLabels.issueId, params.id), eq(issueLabels.labelId, params.labelId))
      );
      return { success: true, data: null };
    },
    {
      params: t.Object({ id: UUIDSchema, labelId: UUIDSchema }),
      detail: { summary: "Remove a label from an issue" },
    }
  );
