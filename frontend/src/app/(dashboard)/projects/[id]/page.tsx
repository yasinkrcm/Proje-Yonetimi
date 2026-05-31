import React from "react";
import { getProjectAction } from "@/app/data";
import ProjectBoard from "@/components/ProjectBoard";
import { redirect } from "next/navigation";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const res = await getProjectAction(id);
  
  if (!res.success) {
    redirect("/"); // if project not found or no access
  }

  const project = res.data;

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex-1 min-h-0 bg-black/40 rounded-xl border border-zinc-800/50 overflow-hidden">
        <ProjectBoard projectId={project.id} projectKey={project.key} projectName={project.name} />
      </div>
    </div>
  );
}
