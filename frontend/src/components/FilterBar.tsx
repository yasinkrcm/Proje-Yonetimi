"use client";

import React from "react";

interface Props {
  onSearch: (q: string) => void;
}

export default function FilterBar({ onSearch }: Props) {
  return (
    <div className="flex items-center gap-3 px-5 py-2 border-b border-white/[0.06] bg-[#0A0A0A]">
      <div className="relative">
        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Filter issues..."
          onChange={(e) => onSearch(e.target.value)}
          className="pl-9 pr-4 py-1.5 bg-white/[0.02] border border-white/10 rounded-md text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 w-64 transition-all"
        />
      </div>

      <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-400 hover:text-white border border-white/5 rounded-md hover:bg-white/5 transition-colors">
        <span className="w-2 h-2 rounded-full bg-neutral-500" />
        Status
      </button>

      <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-400 hover:text-white border border-white/5 rounded-md hover:bg-white/5 transition-colors">
        Assignee
      </button>

      <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-400 hover:text-white border border-white/5 rounded-md hover:bg-white/5 transition-colors">
        Priority
      </button>
    </div>
  );
}
