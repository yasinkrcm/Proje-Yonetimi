"use client";

import { useEffect, useCallback } from "react";

interface Props {
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: Props) {
  const dismiss = useCallback(onDismiss, [onDismiss]);

  useEffect(() => {
    const timer = window.setTimeout(dismiss, 2500);
    return () => window.clearTimeout(timer);
  }, [dismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed bottom-5 right-5 z-50
        flex items-center gap-2.5
        px-4 py-2.5
        border text-sm font-mono
        animate-in fade-in slide-in-from-bottom-2 duration-150
        ${
          type === "success"
            ? "bg-zinc-900 border-zinc-700 text-zinc-100"
            : "bg-zinc-900 border-red-700/60 text-red-400"
        }
      `}
    >
      <span aria-hidden>{type === "success" ? "✓" : "✗"}</span>
      {message}
    </div>
  );
}
