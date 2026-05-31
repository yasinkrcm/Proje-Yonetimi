"use client";

import React, { useEffect, useState } from "react";
import CommentSection from "./CommentSection";
import ChecklistWidget from "./ChecklistWidget";
import AttachmentList from "./AttachmentList";
import ActivityLogFeed from "./ActivityLogFeed";


interface Props {
  issueId: string;
  projectId: string;
  projectKey: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function IssueDetailModal({ issueId, projectKey, isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"comments" | "checklists" | "attachments" | "activity">("comments");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    // In a real app, we would fetch the issue details here via server action
    // For now we simulate loading
    setLoading(true);
    // Replace with real fetch:
    // getIssueDetailsAction(issueId).then(...)
    setTimeout(() => {
      setLoading(false);
    }, 500);
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, issueId, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative flex flex-col md:flex-row w-full max-w-6xl h-full max-h-[90vh] bg-[#111111] rounded-2xl border border-white/10 shadow-2xl overflow-hidden shadow-black/50">
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Left Column (Main Content) */}
            <div className="flex-1 flex flex-col min-h-0 border-r border-white/5 bg-[#0A0A0A]">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
                <span className="text-xs font-mono text-neutral-500">{projectKey}-XYZ</span>
                <div className="ml-auto">
                  <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white rounded-md hover:bg-white/5 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <h1 className="text-2xl font-semibold text-white mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-2 -mx-2" contentEditable suppressContentEditableWarning>
                  Issue Title Placeholder
                </h1>
                
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-neutral-400 mb-2">Description</h3>
                  <div className="min-h-[100px] p-3 text-sm text-neutral-300 bg-white/[0.02] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50" contentEditable suppressContentEditableWarning>
                    Click to add description...
                  </div>
                </div>
                
                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-white/5 mb-6">
                  {(["comments", "checklists", "attachments", "activity"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                
                {/* Tab Content */}
                <div className="min-h-[200px] h-[calc(100%-12rem)] flex flex-col">
                  {activeTab === "comments" && <CommentSection issueId={issueId} />}
                  {activeTab === "checklists" && <ChecklistWidget issueId={issueId} />}
                  {activeTab === "attachments" && <AttachmentList issueId={issueId} />}
                  {activeTab === "activity" && <ActivityLogFeed issueId={issueId} />}
                </div>
              </div>
            </div>

            {/* Right Column (Sidebar) */}
            <div className="w-full md:w-80 flex flex-col min-h-0 bg-[#111111] overflow-y-auto">
              <div className="p-6 space-y-6">
                
                {/* Status & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-medium text-neutral-500 mb-1.5">Status</span>
                    <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-300 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-lg transition-colors">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> In Progress
                    </button>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-neutral-500 mb-1.5">Priority</span>
                    <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-300 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-lg transition-colors">
                      High
                    </button>
                  </div>
                </div>
                
                {/* Assignee */}
                <div>
                  <span className="block text-xs font-medium text-neutral-500 mb-1.5">Assignee</span>
                  <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-lg transition-colors">
                    <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center">?</div>
                    Unassigned
                  </button>
                </div>
                
                {/* Labels */}
                <div>
                  <span className="block text-xs font-medium text-neutral-500 mb-1.5">Labels</span>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="px-2 py-1 text-[11px] font-medium rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Frontend</span>
                    <span className="px-2 py-1 text-[11px] font-medium rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">Bug</span>
                  </div>
                  <button className="text-xs text-neutral-500 hover:text-neutral-300">+ Add label</button>
                </div>

                {/* Dates */}
                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div>
                    <span className="block text-xs font-medium text-neutral-500 mb-1.5">Due Date</span>
                    <button className="text-sm text-neutral-300 hover:text-white">Set date...</button>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-neutral-500 mb-1.5">Start Date</span>
                    <button className="text-sm text-neutral-300 hover:text-white">Set date...</button>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
