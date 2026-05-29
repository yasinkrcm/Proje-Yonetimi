"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/auth/actions";

export default function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData);

      if (result.success) {
        router.push("/");
        router.refresh(); // invalidates Server Component cache with new session
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="login-email"
          className="text-xs font-mono text-zinc-500 uppercase tracking-widest"
        >
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          disabled={isPending}
          placeholder="you@example.com"
          className="
            bg-transparent border border-zinc-800 px-3 py-2
            text-sm text-zinc-100 placeholder-zinc-700
            focus:border-zinc-600 focus:outline-none
            disabled:opacity-40
            transition-colors duration-75
          "
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="login-password"
          className="text-xs font-mono text-zinc-500 uppercase tracking-widest"
        >
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          disabled={isPending}
          placeholder="••••••••"
          className="
            bg-transparent border border-zinc-800 px-3 py-2
            text-sm text-zinc-100 placeholder-zinc-700
            focus:border-zinc-600 focus:outline-none
            disabled:opacity-40
            transition-colors duration-75
          "
        />
      </div>

      {/* Error */}
      {error !== null && (
        <p
          role="alert"
          className="
            text-xs font-mono text-red-400
            border border-red-900/50 bg-red-950/20 px-3 py-2
          "
        >
          ✗ {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="
          mt-1 px-4 py-2 text-sm font-medium
          bg-zinc-100 text-zinc-900
          hover:bg-white
          disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed
          transition-colors duration-75
        "
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
