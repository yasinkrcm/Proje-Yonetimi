"use client";

import React from "react";
import type { Issue, IssuePriority } from "@/types/issue";
import type { Label } from "@/types/label";

function PriorityIcon({ priority }: { priority: IssuePriority }) {
  switch (priority) {
    case "urgent":
      return (
        <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="10" width="2.5" height="3.5" rx="0.5" fill="currentColor" stroke="none" />
          <rect x="6.75" y="6.5" width="2.5" height="7" rx="0.5" fill="currentColor" stroke="none" />
          <rect x="11.5" y="3" width="2.5" height="10.5" rx="0.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "high":
      return (
        <svg className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="10" width="2.5" height="3.5" rx="0.5" fill="currentColor" stroke="none" />
          <rect x="6.75" y="6.5" width="2.5" height="7" rx="0.5" fill="currentColor" stroke="none" />
          <rect x="11.5" y="3" width="2.5" height="10.5" rx="0.5" />
        </svg>
      );
    case "medium":
      return (
        <svg className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="10" width="2.5" height="3.5" rx="0.5" fill="currentColor" stroke="none" />
          <rect x="6.75" y="6.5" width="2.5" height="7" rx="0.5" />
          <rect x="11.5" y="3" width="2.5" height="10.5" rx="0.5" stroke="currentColor" opacity="0.3" />
        </svg>
      );
    case "low":
      return (
        <svg className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="10" width="2.5" height="3.5" rx="0.5" fill="currentColor" stroke="none" />
          <rect x="6.75" y="6.5" width="2.5" height="7" rx="0.5" stroke="currentColor" opacity="0.3" />
          <rect x="11.5" y="3" width="2.5" height="10.5" rx="0.5" stroke="currentColor" opacity="0.3" />
        </svg>
      );
    case "no_priority":
    default:
      return (
        <svg className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="3" y1="8" x2="13" y2="8" strokeLinecap="round" />
        </svg>
      );
  }
}

interface IssueCardProps {
  issue: Issue;
  projectKey: string;
  onClick: () => void;
  isDragging?: boolean;
}

export default function IssueCard({ issue, projectKey, onClick, isDragging }: IssueCardProps) {
  // If we had a full `IssueWithDetails` we could display checklists & comments
  // For now we use basic `Issue` type data + any extended fields if available
  const anyIssue = issue as any; 
  const labels: Label[] = anyIssue.labels || [];
  const commentCount = anyIssue.commentsCount || 0;
  
  const isOverdue = issue.dueAt && new Date(issue.dueAt) < new Date();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      className={`
        group flex flex-col p-3.5 mb-2 rounded-xl
        bg-[#1A1B1E] border border-white/5 cursor-pointer
        hover:border-indigo-500/30 hover:bg-[#1E1F23]
        transition-all duration-200 outline-none
        ${isDragging ? "opacity-50 scale-95 shadow-2xl" : "shadow-md"}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
          <PriorityIcon priority={issue.priority} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-neutral-500 tracking-tight">
              {projectKey}-{issue.issueNumber}
            </span>
          </div>
          <p className="text-sm text-neutral-200 font-medium leading-snug break-words">
            {issue.title}
          </p>
        </div>
      </div>

      {/* Bottom row: Labels, Due Date, Assignee, Comments */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {labels.slice(0, 3).map((l) => (
            <span
              key={l.id}
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: l.color }}
              title={l.name}
            />
          ))}
          {labels.length > 3 && (
            <span className="text-[10px] text-neutral-500">+{labels.length - 3}</span>
          )}
          
          {issue.dueAt && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isOverdue ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-neutral-400'}`}>
              {new Date(issue.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-neutral-500">
          {commentCount > 0 && (
            <div className="flex items-center gap-1 text-[11px]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{commentCount}</span>
            </div>
          )}
          
          {issue.assigneeId && (
            <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-bold ring-1 ring-indigo-500/30">
              {/* Dummy initial */}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
