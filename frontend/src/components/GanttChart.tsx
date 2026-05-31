"use client";

import React, { useState } from "react";
import type { Issue } from "@/types/issue";
import IssueDetailModal from "./IssueDetailModal";

interface Props {
  issues: Issue[];
  projectKey: string;
}

export default function GanttChart({ issues, projectKey }: Props) {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  return (
    <div className="flex flex-col flex-1 h-full bg-[#0A0A0A] overflow-hidden">
      <div className="flex-1 overflow-auto p-6">
        <div className="min-w-[800px] border border-white/5 bg-[#111111] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex border-b border-white/5 bg-white/[0.02]">
            <div className="w-64 p-3 text-xs font-medium text-neutral-400 border-r border-white/5">Issue</div>
            <div className="flex-1 grid grid-cols-4 divide-x divide-white/5">
              {["Week 1", "Week 2", "Week 3", "Week 4"].map(w => (
                <div key={w} className="p-3 text-center text-xs font-medium text-neutral-400">{w}</div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/5">
            {issues.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-sm">No issues to display</div>
            ) : (
              issues.map((issue, i) => (
                <div key={issue.id} className="flex group hover:bg-white/[0.02] transition-colors">
                  <div 
                    className="w-64 p-3 text-xs text-neutral-300 border-r border-white/5 truncate cursor-pointer group-hover:text-white"
                    onClick={() => setSelectedIssueId(issue.id)}
                  >
                    <span className="text-neutral-500 mr-2">{projectKey}-{issue.issueNumber}</span>
                    {issue.title}
                  </div>
                  <div className="flex-1 relative border-l border-white/5">
                    <div className="absolute inset-0 grid grid-cols-4 divide-x divide-white/5 opacity-50">
                      <div /><div /><div /><div />
                    </div>
                    {/* Simulated Gantt Bar */}
                    <div className="relative py-2 px-4 h-full flex items-center">
                      <div 
                        className="h-5 rounded-full bg-indigo-500/20 border border-indigo-500/50" 
                        style={{ width: `${Math.max(20, (i % 4 + 1) * 20)}%`, marginLeft: `${(i % 3) * 10}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <IssueDetailModal
        issueId={selectedIssueId || ""}
        projectId={issues[0]?.projectId || ""}
        projectKey={projectKey}
        isOpen={!!selectedIssueId}
        onClose={() => setSelectedIssueId(null)}
      />
    </div>
  );
}
