import { Elysia, t } from "elysia";
import {
  createIssue,
  updateIssueStatus,
  listIssuesByProject,
} from "@/db/queries/issues";
import { requireAuth } from "@/middleware/requireAuth";
import type { ApiSuccess } from "@/types/api";
import type { Issue } from "@db/schema";

// ─────────────────────────────────────────────
// Reusable TypeBox schemas
// ─────────────────────────────────────────────

const StatusSchema = t.Union([
  t.Literal("todo"),
  t.Literal("in_progress"),
  t.Literal("done"),
  t.Literal("cancelled"),
]);

const UUIDSchema = t.String({
  format: "uuid",
  error: "Must be a valid UUID v4",
});

// ─────────────────────────────────────────────
// Plugin
// ─────────────────────────────────────────────

export const issueController = new Elysia({ tags: ["Issues"] })
  .use(requireAuth)

  // ── POST /issues ───────────────────────────
  .post(
    "/issues",
    async ({ body, user }): Promise<ApiSuccess<Issue>> => {
      const issue = await createIssue({
        projectId: body.projectId,
        reporterId: user.sub, // sourced from verified JWT — cannot be spoofed
        title: body.title,
        description: body.description,
        status: body.status,
      });

      return { success: true, data: issue };
    },
    {
      body: t.Object({
        projectId: UUIDSchema,
        title: t.String({ minLength: 1, maxLength: 512 }),
        description: t.Optional(t.String({ maxLength: 10_000 })),
        status: t.Optional(StatusSchema),
      }),
      detail: { summary: "Create a new issue" },
    }
  )

  // ── PATCH /issues/:id ──────────────────────
  .patch(
    "/issues/:id",
    async ({ params, body }): Promise<ApiSuccess<Issue>> => {
      const issue = await updateIssueStatus({
        id: params.id,
        status: body.status,
      });

      return { success: true, data: issue };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      body: t.Object({ status: StatusSchema }),
      detail: { summary: "Update issue status" },
    }
  )

  // ── GET /projects/:id/issues ────────
  .get(
    "/projects/:id/issues",
    async ({ params }): Promise<ApiSuccess<Issue[]>> => {
      const result = await listIssuesByProject(params.id);
      return { success: true, data: result };
    },
    {
      params: t.Object({ id: UUIDSchema }),
      detail: { summary: "List all issues for a project ordered by status" },
    }
  );
