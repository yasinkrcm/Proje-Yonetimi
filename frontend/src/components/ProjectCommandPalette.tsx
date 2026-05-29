"use client";

import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProjectAction } from "@/app/actions";
import type { Project } from "@/types/project";

interface Props {
  projects: Project[];
}

export default function ProjectCommandPalette({ projects }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Inline creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectKey, setNewProjectKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createNameInputRef = useRef<HTMLInputElement>(null);

  // Filter projects by query
  const filteredProjects = useMemo(() => {
    const term = query.toLowerCase().trim();
    const list = projects.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.key.toLowerCase().includes(term)
    );

    // Append virtual "Create Project" item
    const createLabel = term ? `Create project "${query}"` : "Create new project...";
    return [
      ...list,
      {
        id: "create-new-project",
        name: createLabel,
        key: "NEW",
        issueCounter: 0,
      } as unknown as Project,
    ];
  }, [projects, query]);

  // Keep index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredProjects]);

  // Auto-focus correct input
  useEffect(() => {
    if (isCreating) {
      createNameInputRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  }, [isCreating]);

  // Handle keys in Creation View
  const handleCreationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setIsCreating(false);
      setError(null);
      setNewProjectName("");
      setNewProjectKey("");
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newProjectKey.trim()) {
      setError("Name and Key are required");
      return;
    }

    const formData = new FormData();
    formData.append("name", newProjectName.trim());
    formData.append("key", newProjectKey.trim().toUpperCase());

    startTransition(async () => {
      setError(null);
      const res = await createProjectAction(formData);

      if (res.success) {
        setIsCreating(false);
        setNewProjectName("");
        setNewProjectKey("");
        router.push(`/${res.data.id}`);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  // Keyboard navigation for Selection View
  useEffect(() => {
    if (isCreating) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredProjects.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredProjects.length - 1 ? prev + 1 : 0
          );
          break;

        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredProjects.length - 1
          );
          break;

        case "Enter":
          e.preventDefault();
          const target = filteredProjects[selectedIndex];
          if (target) {
            if (target.id === "create-new-project") {
              setIsCreating(true);
              setNewProjectName(query);
              // Auto-generate key from first letters
              const suggestedKey = query
                .split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 4)
                .toUpperCase();
              setNewProjectKey(suggestedKey);
            } else {
              router.push(`/${target.id}`);
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredProjects, selectedIndex, router, isCreating, query]);

  // Keep selected element visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isCreating) return;

    const activeEl = container.children[selectedIndex] as HTMLElement;
    if (!activeEl) return;

    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;
    const elemTop = activeEl.offsetTop;
    const elemBottom = elemTop + activeEl.clientHeight;

    if (elemTop < containerTop) {
      container.scrollTop = elemTop;
    } else if (elemBottom > containerBottom) {
      container.scrollTop = elemBottom - container.clientHeight;
    }
  }, [selectedIndex, isCreating]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="
        w-full max-w-[560px] bg-[#0A0A0A] 
        border border-white/[0.08] rounded-lg 
        shadow-2xl shadow-black/90 flex flex-col overflow-hidden
      ">
        {!isCreating ? (
          /* ─── PROJECT SELECTION VIEW ─── */
          <>
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
              <svg
                className="w-4 h-4 text-neutral-500 flex-shrink-0"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="7" cy="7" r="4.25" />
                <line x1="10" y1="10" x2="14" y2="14" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search or create projects..."
                className="
                  flex-1 bg-transparent border-none text-sm text-[#F2F2F2]
                  placeholder-neutral-600 outline-none select-none
                "
              />
            </div>

            {/* List */}
            <div
              ref={containerRef}
              className="max-h-[300px] overflow-y-auto divide-y divide-white/[0.02]"
            >
              {filteredProjects.map((project, idx) => {
                const isSelected = idx === selectedIndex;
                const isCreateVirtual = project.id === "create-new-project";

                return (
                  <div
                    key={project.id}
                    onClick={() => {
                      if (isCreateVirtual) {
                        setIsCreating(true);
                        setNewProjectName(query);
                      } else {
                        router.push(`/${project.id}`);
                      }
                    }}
                    className={`
                      flex items-center gap-3 px-4 py-3 cursor-pointer select-none
                      transition-colors duration-75 outline-none
                      ${isSelected ? "bg-white/[0.05]" : "hover:bg-white/[0.02]"}
                    `}
                  >
                    {isCreateVirtual ? (
                      <>
                        <span className="text-xs font-mono text-[#5E6AD2] tracking-widest w-12 flex-shrink-0">
                          +
                        </span>
                        <span className="text-sm text-[#5E6AD2] font-medium flex-1 truncate">
                          {project.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-mono text-[#8A8F98] tracking-widest w-12 flex-shrink-0">
                          {project.key}
                        </span>
                        <span className="text-sm text-[#F2F2F2] font-medium flex-1 truncate">
                          {project.name}
                        </span>
                        <span className="text-xs font-mono text-neutral-600 tabular-nums">
                          {project.issueCounter} issue{project.issueCounter !== 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                    {isSelected && (
                      <span className="
                        px-1.5 py-0.5 border border-white/10 rounded-sm
                        bg-[#111111] text-[#8A8F98] font-mono text-[9px] leading-none ml-2
                      ">
                        Enter ↵
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="
              px-4 py-2 bg-black border-t border-white/[0.06]
              flex items-center justify-between text-[10px] text-neutral-600 font-mono
            ">
              <div className="flex items-center gap-2">
                <kbd className="px-1 py-0.5 border border-white/10 bg-[#111111] text-neutral-400">↑↓</kbd>
                <span>to navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1 py-0.5 border border-white/10 bg-[#111111] text-neutral-400">Enter ↵</kbd>
                <span>to select</span>
              </div>
            </div>
          </>
        ) : (
          /* ─── PROJECT CREATION INLINE VIEW ─── */
          <form onSubmit={handleCreateSubmit} className="flex flex-col">
            <div className="px-4 py-3.5 border-b border-white/[0.06]">
              <h2 className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
                Create New Project
              </h2>
            </div>

            <div className="p-4 flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                  Project Name
                </label>
                <input
                  ref={createNameInputRef}
                  type="text"
                  required
                  disabled={isPending}
                  value={newProjectName}
                  onKeyDown={handleCreationKeyDown}
                  onChange={(e) => {
                    setNewProjectName(e.target.value);
                    // Update suggested key if it hasn't been custom edited yet
                    const words = e.target.value.trim().split(" ");
                    const suggested = words
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 4)
                      .toUpperCase();
                    setNewProjectKey(suggested);
                  }}
                  placeholder="e.g. Marketing Site"
                  className="
                    bg-transparent border border-white/10 px-3 py-2 rounded-sm
                    text-sm text-[#F2F2F2] placeholder-neutral-700
                    focus:border-white/20 focus:outline-none
                    disabled:opacity-40
                  "
                />
              </div>

              {/* Key */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                  Project Key
                </label>
                <input
                  type="text"
                  required
                  disabled={isPending}
                  maxLength={8}
                  value={newProjectKey}
                  onKeyDown={handleCreationKeyDown}
                  onChange={(e) => setNewProjectKey(e.target.value)}
                  placeholder="e.g. MKTG"
                  className="
                    bg-transparent border border-white/10 px-3 py-2 rounded-sm
                    text-sm text-[#F2F2F2] placeholder-neutral-700
                    focus:border-white/20 focus:outline-none
                    disabled:opacity-40 font-mono uppercase
                  "
                />
              </div>

              {/* Error */}
              {error && (
                <p className="
                  text-xs font-mono text-red-400
                  border border-red-900/50 bg-red-950/20 px-3 py-2
                ">
                  ✗ {error}
                </p>
              )}
            </div>

            {/* Creation Footer */}
            <div className="
              px-4 py-3 bg-black border-t border-white/[0.06]
              flex items-center justify-between text-[10px] text-neutral-600 font-mono
            ">
              <div className="flex items-center gap-2">
                <kbd className="px-1 py-0.5 border border-white/10 bg-[#111111] text-neutral-400">Esc</kbd>
                <span>to cancel</span>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="
                  px-3 py-1 bg-[#F2F2F2] text-black font-medium text-xs rounded-sm
                  hover:bg-white transition-colors duration-75
                  disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed
                "
              >
                {isPending ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
