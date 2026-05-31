"use client";

import React from "react";

export type ViewType = "kanban" | "list" | "calendar" | "gantt";

interface Props {
  currentView: ViewType;
  onChange: (view: ViewType) => void;
}

export default function ViewSwitcher({ currentView, onChange }: Props) {
  const views: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    {
      id: "kanban",
      label: "Board",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="4" y="4" width="6" height="16" rx="1" strokeWidth="2" />
          <rect x="14" y="4" width="6" height="10" rx="1" strokeWidth="2" />
        </svg>
      )
    },
    {
      id: "list",
      label: "List",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
          <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
        </svg>
      )
    },
    {
      id: "gantt",
      label: "Gantt",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h8M4 12h14M4 18h10" />
        </svg>
      )
    }
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-black/50 border border-white/10 rounded-lg">
      {views.map(view => (
        <button
          key={view.id}
          onClick={() => onChange(view.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            currentView === view.id
              ? "bg-white/10 text-white shadow-sm"
              : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
          }`}
        >
          {view.icon}
          {view.label}
        </button>
      ))}
    </div>
  );
}
