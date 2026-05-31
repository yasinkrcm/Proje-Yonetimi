"use client";

import React, { useState } from "react";
import type { Checklist } from "@/types/checklist";

interface Props {
  issueId: string;
}

export default function ChecklistWidget({ issueId }: Props) {
  const [checklists] = useState<Checklist[]>([]);

  return (
    <div data-issue={issueId} className="space-y-6">
      {checklists.length === 0 ? (
        <div className="text-center p-6 border border-dashed border-white/10 rounded-xl">
          <p className="text-sm text-neutral-500 mb-3">No checklists yet</p>
          <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-md transition-colors">
            Add Checklist
          </button>
        </div>
      ) : (
        checklists.map(list => (
          <div key={list.id} className="border border-white/5 rounded-xl bg-white/[0.01] p-4">
            <h4 className="text-sm font-medium text-white mb-3">{list.title}</h4>
            <div className="space-y-2">
              {list.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 group">
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    className="w-4 h-4 rounded border-white/10 bg-black/50 checked:bg-indigo-500 focus:ring-indigo-500/50"
                    readOnly
                  />
                  <span className={`text-sm ${item.isCompleted ? 'text-neutral-500 line-through' : 'text-neutral-300'}`}>
                    {item.content}
                  </span>
                </div>
              ))}
            </div>
            <button className="mt-3 text-xs text-neutral-500 hover:text-white">
              + Add item
            </button>
          </div>
        ))
      )}
    </div>
  );
}
