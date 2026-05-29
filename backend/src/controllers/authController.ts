import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "@db/index";
import { users } from "@db/schema";
import { verifyPassword } from "@/lib/password";
import { jwtPlugin, requireAuth } from "@/middleware/requireAuth";
import { AppError } from "@/types/api";
import type { ApiSuccess } from "@/types/api";
import type { JwtPayload, SessionUser } from "@/lib/jwt.types";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const COOKIE_NAME = "auth_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

type LoginResponseData = { token: string; user: SessionUser };

// ─────────────────────────────────────────────
// Public routes (no auth required)
// ─────────────────────────────────────────────

const publicRoutes = new Elysia()
  .use(jwtPlugin)

  // POST /auth/login
  .post(
    "/login",
    async ({
      body,
      jwt: jwtCtx,
      cookie,
      set,
    }): Promise<ApiSuccess<LoginResponseData>> => {
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          passwordHash: users.passwordHash,
        })
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);

      // Constant-time guard: always verify even on miss to prevent timing attacks
      const dummyHash =
        "$argon2id$v=19$m=65536,t=2,p=1$placeholder$placeholder";
      const valid = user
        ? await verifyPassword(body.password, user.passwordHash)
        : await verifyPassword(body.password, dummyHash).then(() => false);

      if (!user || !valid) {
        throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
      }

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        displayName: user.displayName,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE,
      };

      const token = await jwtCtx.sign(payload);

      // Set cookie for direct browser requests
      cookie[COOKIE_NAME].set({
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
      });

      set.status = 200;
      return {
        success: true,
        data: {
          token, // consumed by Next.js loginAction server-side; never forwarded to browser
          user: { userId: user.id, email: user.email, displayName: user.displayName },
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8, maxLength: 128 }),
      }),
      detail: { summary: "Authenticate — returns JWT in body + sets HttpOnly cookie" },
    }
  )

  // POST /auth/logout
  .post(
    "/logout",
    ({ cookie, set }): ApiSuccess<null> => {
      cookie[COOKIE_NAME].remove();
      set.status = 200;
      return { success: true, data: null };
    },
    { detail: { summary: "Clear session cookie" } }
  );

// ─────────────────────────────────────────────
// Protected routes
// ─────────────────────────────────────────────

const protectedRoutes = new Elysia()
  .use(requireAuth)
  .get(
    "/me",
    ({ user }): ApiSuccess<SessionUser> => ({
      success: true,
      data: { userId: user.sub, email: user.email, displayName: user.displayName },
    }),
    { detail: { summary: "Return authenticated user info" } }
  );

// ─────────────────────────────────────────────
// Composed controller
// ─────────────────────────────────────────────

export const authController = new Elysia({ prefix: "/auth", tags: ["Auth"] })
  .use(publicRoutes)
  .use(protectedRoutes);
