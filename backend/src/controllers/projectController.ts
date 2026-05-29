import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "@db/index";
import { projects, workspaceMembers } from "@db/schema";
import { requireAuth } from "@/middleware/requireAuth";
import { NotFoundError, AppError } from "@/types/api";
import type { ApiSuccess } from "@/types/api";
import type { Project } from "@db/schema";

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
        .where(eq(workspaceMembers.userId, user.sub))
        .limit(1);

      if (!row) throw new NotFoundError("Project", params.id);

      return { success: true, data: row.project };
    },
    { detail: { summary: "Get a single project" } }
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
  );
