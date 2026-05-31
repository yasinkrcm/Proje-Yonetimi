import React from "react";
import { getProjectAction } from "@/app/data";
import { redirect } from "next/navigation";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const res = await getProjectAction(id);
  if (!res.success) {
    redirect("/");
  }
  const project = res.data;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">Project Settings: {project.name}</h1>
      </div>

      <div className="glass p-6 rounded-xl border border-zinc-800/50">
        <h2 className="text-lg font-semibold text-white mb-4">General Settings</h2>
        <p className="text-zinc-400 mb-6 text-sm">Update your project's basic information.</p>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Project Name</label>
            <input 
              type="text" 
              placeholder="Project Name"
              className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          
          <div className="mt-4 pt-4 border-t border-zinc-800/50">
            <button className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>
      
      <div className="glass p-6 rounded-xl border border-danger-500/30">
        <h2 className="text-lg font-semibold text-danger-400 mb-4">Danger Zone</h2>
        <div className="flex items-center justify-between p-4 border border-danger-500/20 rounded-lg bg-danger-500/5">
          <div>
            <h3 className="text-white font-medium">Archive Project</h3>
            <p className="text-zinc-400 text-sm">Archived projects are read-only and hidden from active views.</p>
          </div>
          <button className="px-4 py-2 border border-danger-500 text-danger-400 hover:bg-danger-500 hover:text-white rounded-lg transition-colors">
            Archive
          </button>
        </div>
      </div>
    </div>
  );
}
