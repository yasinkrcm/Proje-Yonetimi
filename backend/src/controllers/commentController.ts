import { Elysia, t } from "elysia";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@db/index";
import { comments, users, issues } from "@db/schema";
import { requireAuth } from "@/middleware/requireAuth";
import { AppError, NotFoundError } from "@/types/api";
import type { ApiSuccess } from "@/types/api";
import { createNotification } from "@/lib/notifications";

const UUIDSchema = t.String({ format: "uuid", error: "Must be a valid UUID v4" });

type CommentWithAuthor = {
  id: string;
  issueId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  authorName: string;
  authorAvatarUrl: string | null;
};

export const commentController = new Elysia({ tags: ["Comments"] })
  .use(requireAuth)

  .get(
    "/issues/:id/comments",
    async ({ params }): Promise<ApiSuccess<CommentWithAuthor[]>> => {
      const rows = await db
        .select({
          id: comments.id,
          issueId: comments.issueId,
          authorId: comments.authorId,
          content: comments.content,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
          authorName: users.displayName,
          authorAvatarUrl: users.avatarUrl,
        })
        .from(comments)
        .innerJoin(users, eq(users.id, comments.authorId))
        .where(eq(comments.issueId, params.id))
        .orderBy(asc(comments.createdAt));

      return { success: true, data: rows };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "List comments for an issue" },
    }
  )

  .post(
    "/issues/:id/comments",
    async ({ params, body, user }): Promise<ApiSuccess<CommentWithAuthor>> => {
      const [created] = await db
        .insert(comments)
        .values({
          issueId: params.id,
          authorId: user.sub,
          content: body.content,
        })
        .returning();

      // Fetch author info
      const [author] = await db.select({ displayName: users.displayName, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, user.sub));

      // Notify assignee if different from commenter
      const [issue] = await db.select({ assigneeId: issues.assigneeId, title: issues.title }).from(issues).where(eq(issues.id, params.id));
      if (issue?.assigneeId && issue.assigneeId !== user.sub) {
        await createNotification({
          userId: issue.assigneeId,
          type: "comment",
          title: "New comment",
          message: `${author?.displayName ?? "Someone"} commented on "${issue.title}"`,
          link: `/issues/${params.id}`,
        });
      }

      return {
        success: true,
        data: {
          ...created!,
          authorName: author?.displayName ?? "",
          authorAvatarUrl: author?.avatarUrl ?? null,
        },
      };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      body: t.Object({ content: t.String({ minLength: 1, maxLength: 10000 }) }),
      detail: { summary: "Add a comment to an issue" },
    }
  )

  .delete(
    "/comments/:id",
    async ({ params, user }): Promise<ApiSuccess<null>> => {
      const [comment] = await db.select().from(comments).where(eq(comments.id, params.id));
      if (!comment) throw new NotFoundError("Comment", params.id);
      if (comment.authorId !== user.sub) {
        throw new AppError(403, "FORBIDDEN", "You can only delete your own comments");
      }
      await db.delete(comments).where(eq(comments.id, params.id));
      return { success: true, data: null };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "Delete a comment" },
    }
  );
