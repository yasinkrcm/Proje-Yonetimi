import { getMeAction } from "@/app/(dashboard)/data";
import { getProjectsAction } from "@/app/data";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userResult, projectsResult] = await Promise.all([
    getMeAction(),
    getProjectsAction(),
  ]);

  if (!userResult.success) {
    redirect("/auth/login");
  }

  const user = userResult.data;
  const projects = projectsResult.success ? projectsResult.data : [];

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar projects={projects} user={user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
