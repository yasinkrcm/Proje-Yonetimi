import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="w-full max-w-[360px] px-6">
        <div className="mb-8 border-b border-zinc-800 pb-6">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">
            Proje Yönetimi
          </p>
          <h1 className="text-base font-medium text-zinc-100">Sign in</h1>
          <p className="text-sm text-zinc-600 mt-1">
            Workspace access is invitation-only.
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
