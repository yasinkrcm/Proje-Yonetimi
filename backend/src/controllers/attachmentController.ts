import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "@db/index";
import { attachments } from "@db/schema";
import { requireAuth } from "@/middleware/requireAuth";
import { AppError, NotFoundError } from "@/types/api";
import type { ApiSuccess } from "@/types/api";
import type { Attachment } from "@db/schema";

const UUIDSchema = t.String({ format: "uuid", error: "Must be a valid UUID v4" });

export const attachmentController = new Elysia({ tags: ["Attachments"] })
  .use(requireAuth)

  .get(
    "/issues/:id/attachments",
    async ({ params }): Promise<ApiSuccess<Omit<Attachment, "storageKey">[]>> => {
      const rows = await db
        .select({
          id: attachments.id,
          issueId: attachments.issueId,
          uploaderId: attachments.uploaderId,
          filename: attachments.filename,
          mimeType: attachments.mimeType,
          sizeBytes: attachments.sizeBytes,
          createdAt: attachments.createdAt,
        })
        .from(attachments)
        .where(eq(attachments.issueId, params.id));
      return { success: true, data: rows };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "List attachments for an issue" },
    }
  )

  .post(
    "/issues/:id/attachments",
    async ({ params, body, user }): Promise<ApiSuccess<Omit<Attachment, "storageKey">>> => {
      const [created] = await db.insert(attachments).values({
        issueId: params.id,
        uploaderId: user.sub,
        filename: body.filename,
        mimeType: body.mimeType,
        sizeBytes: body.sizeBytes,
        storageKey: body.data,
      }).returning();
      const { storageKey, ...rest } = created!;
      return { success: true, data: rest };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      body: t.Object({
        filename: t.String({ minLength: 1, maxLength: 256 }),
        mimeType: t.String({ minLength: 1, maxLength: 128 }),
        sizeBytes: t.Number({ minimum: 1 }),
        data: t.String({ minLength: 1 }),
      }),
      detail: { summary: "Upload an attachment" },
    }
  )

  .delete(
    "/attachments/:id",
    async ({ params, user }): Promise<ApiSuccess<null>> => {
      const [att] = await db.select().from(attachments).where(eq(attachments.id, params.id));
      if (!att) throw new NotFoundError("Attachment", params.id);
      if (att.uploaderId !== user.sub) throw new AppError(403, "FORBIDDEN", "You can only delete your own attachments");
      await db.delete(attachments).where(eq(attachments.id, params.id));
      return { success: true, data: null };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "Delete an attachment" },
    }
  );
