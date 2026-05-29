// Server-only — never imported in client components.
// Reads the auth cookie from Next.js headers and forwards it as a Bearer token
// to the Elysia backend, which accepts both formats (cookie + Authorization header).

import { cookies } from "next/headers";

type BackendSuccess<T> = { success: true; data: T };
type BackendError = { success: false; error: { code: string; message: string } };
export type BackendResponse<T> = BackendSuccess<T> | BackendError;

function getBaseUrl(): string {
  const url = process.env.BACKEND_API_URL;
  if (!url) throw new Error("BACKEND_API_URL environment variable is not set");
  return url;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<BackendResponse<T>> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  console.log(`[apiFetch] Path: ${path}, Has Token: ${!!authToken}`);

  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      // Forward session token — the backend requireAuth checks this header
      ...(authToken !== undefined
        ? { Authorization: `Bearer ${authToken}` }
        : {}),
      ...init?.headers,
    },
  });

  const json = (await res.json()) as BackendResponse<T>;
  console.log(`[apiFetch] Path: ${path}, Response Success: ${json.success}`);
  return json;
}
