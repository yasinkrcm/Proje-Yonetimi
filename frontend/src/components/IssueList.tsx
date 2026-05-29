"use client";

import {
  useOptimistic,
  useTransition,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { updateIssueStatusAction } from "@/app/actions";
import type { Issue, IssueStatus, IssuePriority } from "@/types/issue";
import Toast from "./Toast";

// ─────────────────────────────────────────────────────────────────────────────
// Constants & Styling Tokens (Linear-Spec)
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_COLUMNS: ReadonlyArray<{ key: IssueStatus; label: string }> = [
  { key: "todo", label: "Todo" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
] as const;

// ── Status Icons (Linear Precise SVG Replicas) ──

function StatusIcon({ status }: { status: IssueStatus }) {
  switch (status) {
    case "todo":
      return (
        <svg className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6.25" />
        </svg>
      );
    case "in_progress":
      return (
        <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6.25" />
          <path d="M8 1.75C11.4518 1.75 14.25 4.54822 14.25 8C14.25 11.4518 11.4518 14.25 8 14.25V1.75Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "done":
      return (
        <svg className="w-3.5 h-3.5 text-[#5E6AD2] flex-shrink-0" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7.25" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8" cy="8" r="4.5" fill="currentColor" />
        </svg>
      );
    case "cancelled":
      return (
        <svg className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6.25" />
          <line x1="4.5" y1="4.5" x2="11.5" y2="11.5" />
        </svg>
      );
    default:
      return null;
  }
}

// ── Priority Icons (Linear Signal Bars) ──

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

// ─────────────────────────────────────────────────────────────────────────────
// IssueCard Component
// ─────────────────────────────────────────────────────────────────────────────

interface CardProps {
  issue: Issue;
  projectKey: string;
  isSelected: boolean;
  onSelect: () => void;
}

function IssueCard({ issue, projectKey, isSelected, onSelect }: CardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={`
        group flex items-center gap-3 px-3.5 py-2
        border-b border-white/[0.04] cursor-pointer select-none
        transition-colors duration-75 outline-none
        ${
          isSelected
            ? "bg-white/[0.06] ring-1 ring-inset ring-white/10"
            : "hover:bg-white/[0.03]"
        }
      `}
    >
      {/* Status icon */}
      <div className="flex-shrink-0 flex items-center justify-center w-4 h-4">
        <StatusIcon status={issue.status} />
      </div>

      {/* Issue ID */}
      <span className="flex-shrink-0 text-xs font-mono text-[#8A8F98] tracking-tight tabular-nums w-14">
        {projectKey}-{issue.issueNumber}
      </span>

      {/* Title */}
      <span className="flex-1 text-sm text-[#F2F2F2] truncate tracking-tight leading-tight">
        {issue.title}
      </span>

      {/* Priority */}
      <div className="flex-shrink-0 flex items-center justify-center w-4 h-4 opacity-75 group-hover:opacity-100 transition-opacity">
        <PriorityIcon priority={issue.priority} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main IssueList Component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  issues: Issue[];
  projectKey: string;
}

interface ToastState {
  text: string;
  type: "success" | "error";
}

type OptimisticAction = { id: string; status: IssueStatus };

export default function IssueList({ issues: initialIssues, projectKey }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [optimisticIssues, dispatchOptimistic] = useOptimistic<
    Issue[],
    OptimisticAction
  >(
    initialIssues,
    (state, { id, status }) =>
      state.map((i) => (i.id === id ? { ...i, status } : i))
  );

  const visibleIssues = useMemo(
    () =>
      STATUS_COLUMNS.flatMap(({ key }) =>
        optimisticIssues.filter((i) => i.status === key)
      ),
    [optimisticIssues]
  );

  const showToast = useCallback((text: string, type: "success" | "error") => {
    setToast({ text, type });
  }, []);

  const updateStatus = useCallback(
    (issue: Issue, status: IssueStatus) => {
      if (issue.status === status) return;

      startTransition(async () => {
        dispatchOptimistic({ id: issue.id, status });

        const result = await updateIssueStatusAction(issue.id, status);

        if (result.success) {
          showToast("Status updated", "success");
          router.refresh();
        } else {
          showToast(result.error, "error");
        }
      });
    },
    [dispatchOptimistic, showToast, router]
  );

  // Keyboard navigation
  useEffect(() => {
    const isEditable = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false;
      return (
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable
      );
    };

    const handler = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) =>
            i < visibleIssues.length - 1 ? i + 1 : i
          );
          break;

        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => (i > 0 ? i - 1 : 0));
          break;

        case "Escape":
          setSelectedIndex(-1);
          break;

        case "1":
        case "2":
        case "3": {
          const issue =
            selectedIndex >= 0 ? visibleIssues[selectedIndex] : undefined;
          if (!issue) break;
          const next: IssueStatus =
            e.key === "1" ? "todo" : e.key === "2" ? "in_progress" : "done";
          updateStatus(issue, next);
          break;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visibleIssues, selectedIndex, updateStatus]);

  return (
    <div className="flex flex-col flex-1 bg-black">
      {/* Keyboard navigation helper */}
      <div className="flex items-center gap-4 px-4 py-1.5 border-b border-white/[0.04] bg-[#0A0A0A]">
        {[
          { keys: ["↑", "↓"], label: "navigate" },
          { keys: ["1", "2", "3"], label: "set status" },
          { keys: ["Esc"], label: "deselect" },
        ].map(({ keys, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
            {keys.map((k) => (
              <kbd
                key={k}
                className="
                  px-1.5 py-0.5 border border-white/10 rounded-sm
                  bg-[#111111] text-[#F2F2F2] font-mono text-[9px] leading-none
                "
              >
                {k}
              </kbd>
            ))}
            <span className="text-[10px] tracking-tight">{label}</span>
          </div>
        ))}
      </div>

      {/* Board Columns Grid */}
      <div className="grid grid-cols-3 flex-1 divide-x divide-white/[0.06] bg-[#0A0A0A]">
        {STATUS_COLUMNS.map(({ key, label }) => {
          const columnIssues = optimisticIssues.filter((i) => i.status === key);

          return (
            <section key={key} aria-label={label} className="flex flex-col bg-black">
              {/* Column Header */}
              <div className="sticky top-[49px] z-10 flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-black/95 backdrop-blur-sm">
                <StatusIcon status={key} />
                <span className="text-xs font-medium text-[#8A8F98] tracking-widest uppercase">
                  {label}
                </span>
                <span className="ml-auto text-xs font-mono text-neutral-500 tabular-nums">
                  {columnIssues.length}
                </span>
              </div>

              {/* Column Issues list */}
              <div className="flex-1 min-h-[300px]">
                {columnIssues.length === 0 ? (
                  <p className="px-4 py-12 text-xs text-neutral-600 text-center font-mono">
                    No issues
                  </p>
                ) : (
                  columnIssues.map((issue) => {
                    const flatIndex = visibleIssues.findIndex(
                      (v) => v.id === issue.id
                    );
                    return (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        projectKey={projectKey}
                        isSelected={selectedIndex === flatIndex}
                        onSelect={() => setSelectedIndex(flatIndex)}
                      />
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>

      {toast && (
        <Toast
          message={toast.text}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
