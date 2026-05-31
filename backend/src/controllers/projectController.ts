import { Elysia, t } from "elysia";
import { eq, and } from "drizzle-orm";
import { db } from "@db/index";
import { projects, workspaceMembers } from "@db/schema";
import { requireAuth } from "@/middleware/requireAuth";
import { NotFoundError, AppError } from "@/types/api";
import type { ApiSuccess } from "@/types/api";
import type { Project } from "@db/schema";

const UUIDSchema = t.String({ format: "uuid", error: "Must be a valid UUID v4" });

export const projectController = new Elysia({ tags: ["Projects"] })
  .use(requireAuth)

  // GET /projects — projects where the authed user is a workspace member
  .get(
    "/projects",
    async ({ user }): Promise<ApiSuccess<Project[]>> => {
      const rows = await db
        .selectDistinct({ project: projects })
        .from(projects)
        .innerJoin(
          workspaceMembers,
          eq(workspaceMembers.workspaceId, projects.workspaceId)
        )
        .where(eq(workspaceMembers.userId, user.sub));

      return { success: true, data: rows.map((r) => r.project) };
    },
    { detail: { summary: "List projects accessible to the authenticated user" } }
  )

  // GET /projects/:id
  .get(
    "/projects/:id",
    async ({ params, user }): Promise<ApiSuccess<Project>> => {
      const [row] = await db
        .selectDistinct({ project: projects })
        .from(projects)
        .innerJoin(
          workspaceMembers,
          eq(workspaceMembers.workspaceId, projects.workspaceId)
        )
        .where(
          and(
            eq(projects.id, params.id),
            eq(workspaceMembers.userId, user.sub)
          )
        )
        .limit(1);

      if (!row) throw new NotFoundError("Project", params.id);

      return { success: true, data: row.project };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "Get a single project" },
    }
  )

  // POST /projects — create a new project in the user's workspace
  .post(
    "/projects",
    async ({ body, user }): Promise<ApiSuccess<Project>> => {
      const [member] = await db
        .select({ workspaceId: workspaceMembers.workspaceId })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, user.sub))
        .limit(1);

      if (!member) {
        throw new AppError(403, "FORBIDDEN", "User does not belong to a workspace");
      }

      const [project] = await db
        .insert(projects)
        .values({
          workspaceId: member.workspaceId,
          key: body.key.toUpperCase(),
          name: body.name,
          description: body.description ?? null,
          createdById: user.sub,
        })
        .returning();

      return { success: true, data: project };
    },
    {
      body: t.Object({
        key: t.String({ minLength: 1, maxLength: 8 }),
        name: t.String({ minLength: 1, maxLength: 128 }),
        description: t.Optional(t.String({ maxLength: 1000 })),
      }),
      detail: { summary: "Create a new project" },
    }
  )

  // PATCH /projects/:id — update a project
  .patch(
    "/projects/:id",
    async ({ params, body, user }): Promise<ApiSuccess<Project>> => {
      const [row] = await db
        .selectDistinct({ project: projects })
        .from(projects)
        .innerJoin(
          workspaceMembers,
          eq(workspaceMembers.workspaceId, projects.workspaceId)
        )
        .where(
          and(
            eq(projects.id, params.id),
            eq(workspaceMembers.userId, user.sub)
          )
        )
        .limit(1);

      if (!row) throw new NotFoundError("Project", params.id);

      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;

      const [updated] = await db
        .update(projects)
        .set(updates)
        .where(eq(projects.id, params.id))
        .returning();

      return { success: true, data: updated! };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 128 })),
        description: t.Optional(t.String({ maxLength: 1000 })),
      }),
      detail: { summary: "Update a project" },
    }
  )

  // PATCH /projects/:id/archive — toggle archive status
  .patch(
    "/projects/:id/archive",
    async ({ params, user }): Promise<ApiSuccess<Project>> => {
      const [row] = await db
        .selectDistinct({ project: projects })
        .from(projects)
        .innerJoin(
          workspaceMembers,
          eq(workspaceMembers.workspaceId, projects.workspaceId)
        )
        .where(
          and(
            eq(projects.id, params.id),
            eq(workspaceMembers.userId, user.sub)
          )
        )
        .limit(1);

      if (!row) throw new NotFoundError("Project", params.id);

      const [updated] = await db
        .update(projects)
        .set({ isArchived: !row.project.isArchived })
        .where(eq(projects.id, params.id))
        .returning();

      return { success: true, data: updated! };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "Toggle archive status of a project" },
    }
  )

  // DELETE /projects/:id — delete a project (only creator)
  .delete(
    "/projects/:id",
    async ({ params, user }): Promise<ApiSuccess<null>> => {
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, params.id));

      if (!project) throw new NotFoundError("Project", params.id);

      if (project.createdById !== user.sub) {
        throw new AppError(403, "FORBIDDEN", "Only the project creator can delete it");
      }

      await db.delete(projects).where(eq(projects.id, params.id));

      return { success: true, data: null };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "Delete a project" },
    }
  );
