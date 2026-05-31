import React from "react";
import { getMyIssues } from "@/app/(dashboard)/data";
import IssueList from "@/components/IssueList";

export default async function MyIssuesPage() {
  const res = await getMyIssues();
  const issues = res.success ? res.data : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">My Issues</h1>
      </div>

      <div className="glass p-6 rounded-xl border border-zinc-800/50">
        <IssueList issues={issues} projectKey="MY" />
      </div>
    </div>
  );
}
