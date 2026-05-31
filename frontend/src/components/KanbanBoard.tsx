"use client";

import React, { useState, useCallback, useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { updateIssueStatusAction } from "@/app/actions";
import type { Issue, IssueStatus } from "@/types/issue";
import IssueCard from "./IssueCard";
import Toast from "./Toast";
import IssueDetailModal from "./IssueDetailModal";

const STATUS_COLUMNS: ReadonlyArray<{ key: IssueStatus; label: string }> = [
  { key: "todo", label: "Todo" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

function StatusDot({ status }: { status: IssueStatus }) {
  switch (status) {
    case "todo":
      return <span className="w-2.5 h-2.5 rounded-full bg-neutral-500" />;
    case "in_progress":
      return <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />;
    case "done":
      return <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />;
    case "cancelled":
      return <span className="w-2.5 h-2.5 rounded-full bg-red-500" />;
    default:
      return null;
  }
}

interface Props {
  issues: Issue[];
  projectKey: string;
}

type OptimisticAction = { id: string; status: IssueStatus };

export default function KanbanBoard({ issues: initialIssues, projectKey }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [optimisticIssues, dispatchOptimistic] = useOptimistic<Issue[], OptimisticAction>(
    initialIssues,
    (state, { id, status }) => state.map((i) => (i.id === id ? { ...i, status } : i))
  );

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<IssueStatus | null>(null);
  
  // Modal state
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const updateStatus = useCallback(
    (issueId: string, status: IssueStatus) => {
      const issue = optimisticIssues.find((i) => i.id === issueId);
      if (!issue || issue.status === status) return;

      startTransition(async () => {
        dispatchOptimistic({ id: issueId, status });
        const result = await updateIssueStatusAction(issueId, status);
        if (result.success) {
          router.refresh();
        } else {
          setToast({ text: result.error, type: "error" });
        }
      });
    },
    [optimisticIssues, dispatchOptimistic, router]
  );

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent, status: IssueStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== status) setDragOverCol(status);
  };

  const handleDrop = (e: React.DragEvent, status: IssueStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setDragOverCol(null);
    if (id) {
      updateStatus(id, status);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#0A0A0A] overflow-hidden">
      {/* Toast */}
      {toast && <Toast message={toast.text} type={toast.type} onDismiss={() => setToast(null)} />}

      {/* Board Columns */}
      <div className="flex h-full p-6 gap-6 overflow-x-auto">
        {STATUS_COLUMNS.map(({ key, label }) => {
          const colIssues = optimisticIssues.filter((i) => i.status === key);
          const isOver = dragOverCol === key;

          return (
            <div
              key={key}
              onDragOver={(e) => handleDragOver(e, key)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, key)}
              className={`
                flex flex-col flex-shrink-0 w-[340px] h-full
                rounded-xl bg-[#111111] border transition-colors duration-200
                ${isOver ? "border-indigo-500/50 bg-[#16171A]" : "border-white/[0.05]"}
              `}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.05]">
                <StatusDot status={key} />
                <h3 className="text-sm font-medium text-neutral-200">{label}</h3>
                <span className="ml-auto text-xs font-mono text-neutral-500 bg-black/40 px-2 py-0.5 rounded-md">
                  {colIssues.length}
                </span>
              </div>

              {/* Card List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 relative">
                {colIssues.length === 0 && !isOver && (
                  <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-white/5 rounded-xl">
                    <p className="text-xs text-neutral-600 font-medium">Drop items here</p>
                  </div>
                )}
                {colIssues.map((issue) => (
                  <div
                    key={issue.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, issue.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <IssueCard
                      issue={issue}
                      projectKey={projectKey}
                      isDragging={draggingId === issue.id}
                      onClick={() => setSelectedIssueId(issue.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <IssueDetailModal
        issueId={selectedIssueId || ""}
        projectId={initialIssues[0]?.projectId || ""}
        projectKey={projectKey}
        isOpen={!!selectedIssueId}
        onClose={() => setSelectedIssueId(null)}
      />
    </div>
  );
}
