"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/app/actions";
import type { SessionUser } from "@/types/auth";

// ─────────────────────────────────────────────
// Constants (server-only — never in client bundle)
// ─────────────────────────────────────────────

const COOKIE_NAME = "auth_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: COOKIE_MAX_AGE,
};

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
});

// ─────────────────────────────────────────────
// Backend response shapes (internal — not exported)
// ─────────────────────────────────────────────

type BackendOk<T> = { success: true; data: T };
type BackendFail = { success: false; error: { code: string; message: string } };
type BackendRes<T> = BackendOk<T> | BackendFail;

type BackendLoginData = {
  token: string;
  user: SessionUser & { userId: string };
};

// ─────────────────────────────────────────────
// loginAction
// ─────────────────────────────────────────────

export async function loginAction(
  formData: FormData
): Promise<ActionResult<SessionUser>> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(". "),
    };
  }

  const baseUrl = process.env.BACKEND_API_URL;
  if (!baseUrl) throw new Error("BACKEND_API_URL not set");

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
  } catch {
    return { success: false, error: "Cannot reach authentication server" };
  }

  const body = (await res.json()) as BackendRes<BackendLoginData>;

  if (!res.ok || !body.success) {
    return {
      success: false,
      error: (body as BackendFail).error.message,
    };
  }

  // token is consumed here, server-side — it never travels to the browser
  const { token, user } = body.data;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS);

  return {
    success: true,
    data: { userId: user.userId, email: user.email, displayName: user.displayName },
  };
}

// ─────────────────────────────────────────────
// logoutAction
// ─────────────────────────────────────────────

export async function logoutAction(): Promise<never> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  // Best-effort: invalidate backend session if reachable
  const baseUrl = process.env.BACKEND_API_URL;
  if (baseUrl && token) {
    await fetch(`${baseUrl}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => {
      // silently ignore — local cookie deletion is the authoritative action
    });
  }

  cookieStore.delete(COOKIE_NAME);
  redirect("/auth/login");
}
