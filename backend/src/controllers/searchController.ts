import { Elysia, t } from "elysia";
import { eq, and, or, ilike, sql } from "drizzle-orm";
import { db } from "@db/index";
import { issues, projects, workspaceMembers } from "@db/schema";
import { requireAuth } from "@/middleware/requireAuth";
import type { ApiSuccess } from "@/types/api";
import type { Issue, Project } from "@db/schema";

export const searchController = new Elysia({ tags: ["Search"] })
  .use(requireAuth)

  .get(
    "/search",
    async ({ query, user }): Promise<ApiSuccess<{ issues: Issue[]; projects: Project[] }>> => {
      const q = query.q?.trim();
      if (!q || q.length < 2) {
        return { success: true, data: { issues: [], projects: [] } };
      }

      const searchPattern = `%${q}%`;

      // Get user's workspace
      const [membership] = await db.select({ workspaceId: workspaceMembers.workspaceId }).from(workspaceMembers).where(eq(workspaceMembers.userId, user.sub)).limit(1);
      if (!membership) return { success: true, data: { issues: [], projects: [] } };

      // Search projects
      const matchedProjects = await db
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.workspaceId, membership.workspaceId),
            or(ilike(projects.name, searchPattern), ilike(projects.key, searchPattern))
          )
        )
        .limit(10);

      // Search issues
      const projectRows = await db.select({ id: projects.id }).from(projects).where(eq(projects.workspaceId, membership.workspaceId));
      const projectIds = projectRows.map(p => p.id);

      let matchedIssues: Issue[] = [];
      if (projectIds.length > 0) {
        matchedIssues = await db
          .select()
          .from(issues)
          .where(
            and(
              sql`${issues.projectId} = ANY(ARRAY[${projectIds.map(id => `'${id}'`).join(', ')}]::uuid[])`,
              or(ilike(issues.title, searchPattern), ilike(issues.description, searchPattern))
            )
          )
          .limit(20);
      }

      return { success: true, data: { issues: matchedIssues, projects: matchedProjects } };
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
      }),
      detail: { summary: "Search issues and projects" },
    }
  );
