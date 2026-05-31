import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in | Premium Workspace",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen relative items-center justify-center bg-zinc-950 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-600/20 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md px-6 z-10 animate-scale-in">
        <div className="glass-strong p-8 rounded-2xl shadow-glow-lg flex flex-col relative overflow-hidden">
          {/* Top border highlight */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-accent-500 to-brand-500" />
          
          <div className="mb-8 text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-brand-500 to-accent-600 rounded-xl flex items-center justify-center mb-6 shadow-glow">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-sm text-zinc-400">
              Sign in to your premium workspace
            </p>
          </div>

          <LoginForm />
        </div>
        
        <p className="text-center text-xs text-zinc-500 mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
