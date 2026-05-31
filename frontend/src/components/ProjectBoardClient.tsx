"use client";

import React, { useState } from "react";
import type { Issue } from "@/types/issue";
import ViewSwitcher, { ViewType } from "./ViewSwitcher";
import FilterBar from "./FilterBar";
import KanbanBoard from "./KanbanBoard";
import ListView from "./ListView";
import CalendarView from "./CalendarView";
import GanttChart from "./GanttChart";

interface Props {
  issues: Issue[];
  projectKey: string;
}

export default function ProjectBoardClient({ issues, projectKey }: Props) {
  const [view, setView] = useState<ViewType>("kanban");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIssues = issues.filter(issue => 
    issue.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    `${projectKey}-${issue.issueNumber}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-black">
      <div className="flex items-center justify-between px-5 py-2 border-b border-white/[0.06] bg-black/95 backdrop-blur-sm z-10">
        <ViewSwitcher currentView={view} onChange={setView} />
      </div>
      <FilterBar onSearch={setSearchQuery} />

      <div className="flex-1 overflow-hidden relative">
        {view === "kanban" && <KanbanBoard issues={filteredIssues} projectKey={projectKey} />}
        {view === "list" && <ListView issues={filteredIssues} projectKey={projectKey} />}
        {view === "calendar" && <CalendarView issues={filteredIssues} projectKey={projectKey} />}
        {view === "gantt" && <GanttChart issues={filteredIssues} projectKey={projectKey} />}
      </div>
    </div>
  );
}
