"use client";

import React, { useState } from "react";
import type { Issue } from "@/types/issue";
import IssueCard from "./IssueCard";
import IssueDetailModal from "./IssueDetailModal";

interface Props {
  issues: Issue[];
  projectKey: string;
}

export default function ListView({ issues, projectKey }: Props) {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  return (
    <div className="flex flex-col flex-1 h-full bg-[#0A0A0A] overflow-hidden">
      <div className="flex-1 overflow-auto p-6 space-y-2">
        {issues.length === 0 ? (
          <div className="flex items-center justify-center h-48 border border-white/5 rounded-xl bg-[#111111]">
            <p className="text-neutral-500 font-mono text-sm">No issues found</p>
          </div>
        ) : (
          issues.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              projectKey={projectKey}
              onClick={() => setSelectedIssueId(issue.id)}
            />
          ))
        )}
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
