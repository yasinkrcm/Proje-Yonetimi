import React from "react";
import { getMeAction } from "@/app/(dashboard)/data";

export default async function SettingsPage() {
  const res = await getMeAction();
  const user = res.success ? res.data : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">Account Settings</h1>
      </div>

      <div className="glass p-8 rounded-xl border border-zinc-800/50">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-brand-500/20 flex items-center justify-center border-2 border-brand-500/30 text-2xl font-bold text-brand-400">
            {user?.displayName?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{user?.displayName}</h2>
            <p className="text-zinc-400">{user?.email}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Display Name</label>
            <input 
              type="text" 
              defaultValue={user?.displayName || ""} 
              disabled
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500 transition-colors opacity-70 cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Email Address</label>
            <input 
              type="email" 
              defaultValue={user?.email || ""} 
              disabled
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500 transition-colors opacity-70 cursor-not-allowed"
            />
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-zinc-800/50 flex justify-end">
          <button className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors opacity-50 cursor-not-allowed" disabled>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
