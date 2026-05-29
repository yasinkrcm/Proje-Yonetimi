import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { AppError } from "@/types/api";
import type { JwtPayload } from "@/lib/jwt.types";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is not set");

// ─────────────────────────────────────────────────────────────────────────────
// Shared JWT plugin instance (name deduplication prevents double-registration)
// ─────────────────────────────────────────────────────────────────────────────

export const jwtPlugin = jwt({
  name: "jwt",
  secret: JWT_SECRET,
  exp: "7d",
  schema: t.Object({
    sub: t.String(),
    email: t.String(),
    displayName: t.String(),
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// requireAuth — Elysia derive-based guard
//
// Checks, in order:
//   1. HttpOnly cookie  (browser → Next.js → sets header)
//   2. Authorization: Bearer  (Next.js server → Elysia, forwarded by apiFetch)
//
// On success injects `user: JwtPayload` into the handler context.
// On failure throws AppError(401) — caught by the global onError handler.
// Use { as: "scoped" } so only plugins that explicitly .use(requireAuth)
// have the guard applied — other routes remain public.
// ─────────────────────────────────────────────────────────────────────────────

export const requireAuth = new Elysia({ name: "require-auth" })
  .use(jwtPlugin)
  .derive(
    { as: "scoped" },
    async ({
      jwt: jwtCtx,
      cookie,
      headers,
      set,
    }): Promise<{ user: JwtPayload }> => {
      const cookieToken: string | undefined = cookie.auth_token?.value;
      const authHeader: string | undefined =
        (headers as Record<string, string | undefined>).authorization;
      const bearerToken: string | undefined = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : undefined;

      const token = cookieToken ?? bearerToken;

      if (!token) {
        set.status = 401;
        throw new AppError(401, "UNAUTHORIZED", "Authentication required");
      }

      const payload = await jwtCtx.verify(token);

      if (!payload) {
        set.status = 401;
        throw new AppError(401, "INVALID_TOKEN", "Invalid or expired token");
      }

      // payload is { sub, email, displayName, iat, exp } — matches JwtPayload
      return { user: payload as unknown as JwtPayload };
    }
  );
