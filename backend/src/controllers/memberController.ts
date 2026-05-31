import { Elysia, t } from "elysia";
import { eq, and } from "drizzle-orm";
import { db } from "@db/index";
import { workspaceMembers, users } from "@db/schema";
import { requireAuth } from "@/middleware/requireAuth";
import { AppError, NotFoundError } from "@/types/api";
import type { ApiSuccess } from "@/types/api";
import { createNotification } from "@/lib/notifications";

const UUIDSchema = t.String({ format: "uuid", error: "Must be a valid UUID v4" });

type MemberWithUser = {
  workspaceId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  displayName: string;
  email: string;
  avatarUrl: string | null;
};

export const memberController = new Elysia({ tags: ["Members"] })
  .use(requireAuth)

  .get(
    "/workspaces/:workspaceId/members",
    async ({ params }): Promise<ApiSuccess<MemberWithUser[]>> => {
      const rows = await db
        .select({
          workspaceId: workspaceMembers.workspaceId,
          userId: workspaceMembers.userId,
          role: workspaceMembers.role,
          joinedAt: workspaceMembers.joinedAt,
          displayName: users.displayName,
          email: users.email,
          avatarUrl: users.avatarUrl,
        })
        .from(workspaceMembers)
        .innerJoin(users, eq(users.id, workspaceMembers.userId))
        .where(eq(workspaceMembers.workspaceId, params.workspaceId));
      return { success: true, data: rows };
    },
    {
      params: t.Object({ workspaceId: UUIDSchema }),
      detail: { summary: "List workspace members" },
    }
  )

  .post(
    "/workspaces/:workspaceId/members",
    async ({ params, body, user }): Promise<ApiSuccess<MemberWithUser>> => {
      // Check requester is admin/owner
      const [requester] = await db.select().from(workspaceMembers).where(
        and(eq(workspaceMembers.workspaceId, params.workspaceId), eq(workspaceMembers.userId, user.sub))
      );
      if (!requester || !['owner', 'admin'].includes(requester.role)) {
        throw new AppError(403, "FORBIDDEN", "Only owners and admins can add members");
      }

      // Find user by email
      const [targetUser] = await db.select().from(users).where(eq(users.email, body.email));
      if (!targetUser) throw new NotFoundError("User", body.email);

      // Add member
      const [created] = await db.insert(workspaceMembers).values({
        workspaceId: params.workspaceId,
        userId: targetUser.id,
        role: body.role ?? "member",
      }).returning();

      await createNotification({
        userId: targetUser.id,
        type: "workspace_invite",
        title: "Workspace davetiyesi",
        message: "Bir workspace'e eklendiniz",
      });

      return {
        success: true,
        data: {
          ...created!,
          displayName: targetUser.displayName,
          email: targetUser.email,
          avatarUrl: targetUser.avatarUrl,
        },
      };
    },
    {
      params: t.Object({ workspaceId: UUIDSchema }),
      body: t.Object({
        email: t.String({ format: "email" }),
        role: t.Optional(t.Union([t.Literal("admin"), t.Literal("member"), t.Literal("viewer")])),
      }),
      detail: { summary: "Add a member to workspace" },
    }
  )

  .patch(
    "/workspaces/:workspaceId/members/:userId",
    async ({ params, body, user }): Promise<ApiSuccess<MemberWithUser>> => {
      const [requester] = await db.select().from(workspaceMembers).where(
        and(eq(workspaceMembers.workspaceId, params.workspaceId), eq(workspaceMembers.userId, user.sub))
      );
      if (!requester || !['owner', 'admin'].includes(requester.role)) {
        throw new AppError(403, "FORBIDDEN", "Only owners and admins can change roles");
      }

      const [updated] = await db.update(workspaceMembers)
        .set({ role: body.role })
        .where(and(eq(workspaceMembers.workspaceId, params.workspaceId), eq(workspaceMembers.userId, params.userId)))
        .returning();
      if (!updated) throw new NotFoundError("Member", params.userId);

      const [targetUser] = await db.select().from(users).where(eq(users.id, params.userId));

      return {
        success: true,
        data: {
          ...updated,
          displayName: targetUser?.displayName ?? "",
          email: targetUser?.email ?? "",
          avatarUrl: targetUser?.avatarUrl ?? null,
        },
      };
    },
    {
      params: t.Object({ workspaceId: UUIDSchema, userId: UUIDSchema }),
      body: t.Object({ role: t.Union([t.Literal("admin"), t.Literal("member"), t.Literal("viewer")]) }),
      detail: { summary: "Change member role" },
    }
  )

  .delete(
    "/workspaces/:workspaceId/members/:userId",
    async ({ params, user }): Promise<ApiSuccess<null>> => {
      const [requester] = await db.select().from(workspaceMembers).where(
        and(eq(workspaceMembers.workspaceId, params.workspaceId), eq(workspaceMembers.userId, user.sub))
      );
      if (!requester || !['owner', 'admin'].includes(requester.role)) {
        throw new AppError(403, "FORBIDDEN", "Only owners and admins can remove members");
      }

      // Cannot remove owner
      const [target] = await db.select().from(workspaceMembers).where(
        and(eq(workspaceMembers.workspaceId, params.workspaceId), eq(workspaceMembers.userId, params.userId))
      );
      if (target?.role === "owner") throw new AppError(403, "FORBIDDEN", "Cannot remove workspace owner");

      await db.delete(workspaceMembers).where(
        and(eq(workspaceMembers.workspaceId, params.workspaceId), eq(workspaceMembers.userId, params.userId))
      );
      return { success: true, data: null };
    },
    {
      params: t.Object({ workspaceId: UUIDSchema, userId: UUIDSchema }),
      detail: { summary: "Remove a member from workspace" },
    }
  );
