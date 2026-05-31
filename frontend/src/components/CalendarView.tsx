"use client";

import React, { useMemo, useState } from "react";
import type { Issue } from "@/types/issue";
import IssueDetailModal from "./IssueDetailModal";

interface Props {
  issues: Issue[];
  projectKey: string;
}

export default function CalendarView({ issues, projectKey }: Props) {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Simplified calendar logic for demo purposes
  const daysInMonth = 30; // Mock current month days
  const today = new Date().getDate();

  const issuesByDay = useMemo(() => {
    const map = new Map<number, Issue[]>();
    issues.forEach(issue => {
      if (issue.dueAt) {
        const date = new Date(issue.dueAt).getDate();
        if (!map.has(date)) map.set(date, []);
        map.get(date)!.push(issue);
      }
    });
    return map;
  }, [issues]);

  return (
    <div className="flex flex-col flex-1 h-full bg-[#0A0A0A] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <h3 className="text-white font-medium">This Month</h3>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs font-medium text-neutral-400 bg-white/5 hover:bg-white/10 rounded-md">&lt; Prev</button>
          <button className="px-3 py-1.5 text-xs font-medium text-neutral-400 bg-white/5 hover:bg-white/10 rounded-md">Next &gt;</button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-xl overflow-hidden">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="bg-[#111111] p-2 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayIssues = issuesByDay.get(day) || [];
            const isToday = day === today;
            
            return (
              <div key={day} className={`min-h-[100px] bg-[#0A0A0A] p-2 hover:bg-[#111111] transition-colors ${isToday ? 'ring-1 ring-inset ring-indigo-500/50' : ''}`}>
                <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-indigo-500 text-white' : 'text-neutral-500'}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayIssues.map(issue => (
                    <div 
                      key={issue.id} 
                      onClick={() => setSelectedIssueId(issue.id)}
                      className="px-1.5 py-1 text-[10px] truncate rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 cursor-pointer hover:bg-indigo-500/20 transition-colors"
                    >
                      {projectKey}-{issue.issueNumber}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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
