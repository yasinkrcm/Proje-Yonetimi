"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { createIssueAction } from "@/app/actions";
import type { IssueStatus } from "@/types/issue";
import Toast from "./Toast";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Props {
  projectId: string;
}

interface ToastState {
  text: string;
  type: "success" | "error";
}

const STATUS_OPTIONS: ReadonlyArray<{ value: IssueStatus; label: string }> = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
] as const;

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function CreateIssueModal({ projectId }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<ToastState | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Auto-focus title when modal opens
  useEffect(() => {
    if (isOpen) {
      // rAF ensures the element is visible before focusing
      const id = requestAnimationFrame(() => titleRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [isOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    formRef.current?.reset();
  }, []);

  const open = useCallback(() => setIsOpen(true), []);

  // Global keyboard listener — 'C' opens, Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (e.key === "Escape" && isOpen) {
        close();
        return;
      }

      if ((e.key === "c" || e.key === "C") && !isTyping && !isOpen) {
        open();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, open, close]);

  // Click outside overlay to close
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) close();
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("projectId", projectId);

    startTransition(async () => {
      const result = await createIssueAction(formData);

      if (result.success) {
        close();
        router.refresh();
        setToast({ text: "Issue created", type: "success" });
      } else {
        setToast({ text: result.error, type: "error" });
      }
    });
  };

  if (!isOpen) {
    return toast ? (
      <Toast message={toast.text} type={toast.type} onDismiss={() => setToast(null)} />
    ) : null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        aria-hidden
        className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-[2px]"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
        className="fixed z-50 left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl"
      >
        <div className="border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h2
              id="modal-title"
              className="text-xs font-mono text-zinc-400 uppercase tracking-widest"
            >
              New Issue
            </h2>
            <div className="flex items-center gap-3 text-xs text-zinc-600 font-mono">
              <span>
                <kbd className="px-1 border border-zinc-700 text-zinc-500">
                  Esc
                </kbd>{" "}
                cancel
              </span>
              <span>
                <kbd className="px-1 border border-zinc-700 text-zinc-500">
                  ⌘↵
                </kbd>{" "}
                submit
              </span>
            </div>
          </div>

          {/* Form */}
          <form ref={formRef} onSubmit={handleSubmit}>
            <div className="px-4 pt-4 pb-3 flex flex-col gap-3">
              {/* Title */}
              <input
                ref={titleRef}
                id="issue-title"
                name="title"
                type="text"
                required
                maxLength={512}
                placeholder="Issue title…"
                disabled={isPending}
                className="
                  w-full bg-transparent text-zinc-100 text-base placeholder-zinc-600
                  border-0 border-b border-zinc-800 pb-2
                  focus:border-zinc-500 focus:outline-none
                  transition-colors duration-100
                  disabled:opacity-50
                "
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />

              {/* Description */}
              <textarea
                id="issue-description"
                name="description"
                rows={3}
                maxLength={10000}
                placeholder="Add description… (optional)"
                disabled={isPending}
                className="
                  w-full bg-transparent text-sm text-zinc-300 placeholder-zinc-700
                  border border-zinc-800 px-3 py-2
                  focus:border-zinc-600 focus:outline-none resize-none
                  transition-colors duration-100
                  disabled:opacity-50
                "
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
              {/* Status selector */}
              <div className="flex items-center gap-1">
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="status"
                      value={value}
                      defaultChecked={value === "todo"}
                      disabled={isPending}
                      className="sr-only peer"
                    />
                    <span
                      className="
                        px-2 py-1 text-xs font-mono border border-zinc-800 text-zinc-600
                        peer-checked:border-zinc-500 peer-checked:text-zinc-200
                        hover:border-zinc-700 hover:text-zinc-400
                        transition-colors duration-75 cursor-pointer
                      "
                    >
                      {label}
                    </span>
                  </label>
                ))}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending}
                className="
                  px-4 py-1.5 text-xs font-mono
                  bg-zinc-100 text-zinc-900
                  hover:bg-white
                  disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed
                  transition-colors duration-75
                "
              >
                {isPending ? "Creating…" : "Create issue"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.text}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}
