import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authController } from "@/controllers/authController";
import { issueController } from "@/controllers/issueController";
import { projectController } from "@/controllers/projectController";
import { commentController } from "@/controllers/commentController";
import { labelController } from "@/controllers/labelController";
import { checklistController } from "@/controllers/checklistController";
import { timeTrackingController } from "@/controllers/timeTrackingController";
import { attachmentController } from "@/controllers/attachmentController";
import { activityController } from "@/controllers/activityController";
import { notificationController } from "@/controllers/notificationController";
import { dashboardController } from "@/controllers/dashboardController";
import { memberController } from "@/controllers/memberController";
import { searchController } from "@/controllers/searchController";

import { AppError } from "@/types/api";
import type { ApiError } from "@/types/api";

const app = new Elysia()

  // ─── CORS ──────────────────────────────────────────────────────────────────
  .use(
    cors({
      origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    })
  )

  // ─── Global error handler ──────────────────────────────────────────────────
  .onError(({ code, error, set }): ApiError => {
    // Application-level errors (NotFoundError, ConflictError, etc.)
    if (error instanceof AppError) {
      set.status = error.statusCode;
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }

    // Elysia validation errors (TypeBox schema mismatch)
    if (code === "VALIDATION") {
      set.status = 422;
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request body or params failed validation",
          // error.all is the full TypeBox error list
          details: Object.fromEntries(
            (error as { all?: Array<{ path: string; message: string }> }).all?.map(
              (e) => [e.path || "root", e.message]
            ) ?? []
          ),
        },
      };
    }

    // Elysia 404 for unknown routes
    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        success: false,
        error: { code: "ROUTE_NOT_FOUND", message: "Route not found" },
      };
    }

    // Unhandled exceptions — never leak internals
    set.status = 500;
    console.error("[UNHANDLED]", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    };
  })

  // ─── Plugins ───────────────────────────────────────────────────────────────
  .use(authController)
  .use(projectController)
  .use(issueController)
  .use(commentController)
  .use(labelController)
  .use(checklistController)
  .use(timeTrackingController)
  .use(attachmentController)
  .use(activityController)
  .use(notificationController)
  .use(dashboardController)
  .use(memberController)
  .use(searchController)

  // ─── Health check ──────────────────────────────────────────────────────────
  .get("/health", () => ({ success: true, data: { status: "ok" } }))

  .listen(process.env.PORT ?? 3001);

console.log(
  `Backend running at http://${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
