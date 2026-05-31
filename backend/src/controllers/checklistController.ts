import { Elysia, t } from "elysia";
import { eq, asc } from "drizzle-orm";
import { db } from "@db/index";
import { checklists, checklistItems } from "@db/schema";
import { requireAuth } from "@/middleware/requireAuth";
import { NotFoundError } from "@/types/api";
import type { ApiSuccess } from "@/types/api";
import type { Checklist, ChecklistItem } from "@db/schema";

const UUIDSchema = t.String({ format: "uuid", error: "Must be a valid UUID v4" });

type ChecklistWithItems = Checklist & { items: ChecklistItem[] };

export const checklistController = new Elysia({ tags: ["Checklists"] })
  .use(requireAuth)

  .get(
    "/issues/:id/checklists",
    async ({ params }): Promise<ApiSuccess<ChecklistWithItems[]>> => {
      const cls = await db.select().from(checklists).where(eq(checklists.issueId, params.id)).orderBy(asc(checklists.position));
      const result: ChecklistWithItems[] = [];
      for (const cl of cls) {
        const items = await db.select().from(checklistItems).where(eq(checklistItems.checklistId, cl.id)).orderBy(asc(checklistItems.position));
        result.push({ ...cl, items });
      }
      return { success: true, data: result };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "List checklists with items" },
    }
  )

  .post(
    "/issues/:id/checklists",
    async ({ params, body }): Promise<ApiSuccess<ChecklistWithItems>> => {
      const [created] = await db.insert(checklists).values({
        issueId: params.id,
        title: body.title,
      }).returning();
      return { success: true, data: { ...created!, items: [] } };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      body: t.Object({ title: t.String({ minLength: 1, maxLength: 256 }) }),
      detail: { summary: "Create a checklist" },
    }
  )

  .delete(
    "/checklists/:id",
    async ({ params }): Promise<ApiSuccess<null>> => {
      const [deleted] = await db.delete(checklists).where(eq(checklists.id, params.id)).returning();
      if (!deleted) throw new NotFoundError("Checklist", params.id);
      return { success: true, data: null };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "Delete a checklist" },
    }
  )

  .post(
    "/checklists/:id/items",
    async ({ params, body }): Promise<ApiSuccess<ChecklistItem>> => {
      const [created] = await db.insert(checklistItems).values({
        checklistId: params.id,
        content: body.content,
      }).returning();
      return { success: true, data: created! };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      body: t.Object({ content: t.String({ minLength: 1, maxLength: 512 }) }),
      detail: { summary: "Add an item to a checklist" },
    }
  )

  .patch(
    "/checklist-items/:id",
    async ({ params, body }): Promise<ApiSuccess<ChecklistItem>> => {
      const updates: Record<string, unknown> = {};
      if (body.content !== undefined) updates.content = body.content;
      if (body.isCompleted !== undefined) updates.isCompleted = body.isCompleted;
      const [updated] = await db.update(checklistItems).set(updates).where(eq(checklistItems.id, params.id)).returning();
      if (!updated) throw new NotFoundError("ChecklistItem", params.id);
      return { success: true, data: updated };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      body: t.Object({
        content: t.Optional(t.String({ minLength: 1, maxLength: 512 })),
        isCompleted: t.Optional(t.Boolean()),
      }),
      detail: { summary: "Update a checklist item" },
    }
  )

  .delete(
    "/checklist-items/:id",
    async ({ params }): Promise<ApiSuccess<null>> => {
      const [deleted] = await db.delete(checklistItems).where(eq(checklistItems.id, params.id)).returning();
      if (!deleted) throw new NotFoundError("ChecklistItem", params.id);
      return { success: true, data: null };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "Delete a checklist item" },
    }
  );
