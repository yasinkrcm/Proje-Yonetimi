import type { Metadata } from "next";
import { getProjectsAction } from "@/app/data";
import ProjectCommandPalette from "@/components/ProjectCommandPalette";

export const metadata: Metadata = { title: "Select Project" };

export default async function HomePage() {
  const result = await getProjectsAction();

  if (!result.success) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="border border-red-900/50 bg-red-950/20 px-6 py-4 max-w-sm rounded">
          <p className="text-xs font-mono text-red-400 uppercase tracking-wider mb-1">
            Error
          </p>
          <p className="text-sm text-red-300">{result.error}</p>
        </div>
      </main>
    );
  }

  return <ProjectCommandPalette projects={result.data} />;
}
