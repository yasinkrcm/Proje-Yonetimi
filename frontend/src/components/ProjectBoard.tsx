import { getProjectIssuesAction } from "@/app/actions";
import Link from "next/link";
import IssueList from "./IssueList";
import CreateIssueModal from "./CreateIssueModal";

interface Props {
  projectId: string;
  projectKey: string;
  projectName: string;
}

export default async function ProjectBoard({ projectId, projectKey, projectName }: Props) {
  const result = await getProjectIssuesAction(projectId);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Top bar */}
      <header className="
        flex items-center justify-between px-5 py-3
        border-b border-white/[0.06] sticky top-0 bg-black/95 backdrop-blur-sm z-10
      ">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#8A8F98] uppercase tracking-widest">
            {projectKey}
          </span>
          <span className="text-neutral-700">/</span>
          <h1 className="text-sm font-medium text-[#F2F2F2]">{projectName}</h1>
        </div>
        <div className="flex items-center gap-4 text-xs text-neutral-500 font-mono">
          <span className="flex items-center gap-1.5">
            <kbd className="
              px-1.5 py-0.5 border border-white/10 rounded-sm
              bg-[#111111] text-[#F2F2F2] font-mono text-[9px] leading-none
            ">
              C
            </kbd>{" "}
            new issue
          </span>
          {result.success && (
            <span className="text-neutral-600">
              {result.data.length} issue{result.data.length !== 1 ? "s" : ""}
            </span>
          )}
          <Link
            href="/"
            className="
              flex items-center gap-1.5 px-2.5 py-1.5 border border-white/10 rounded-sm
              bg-white/[0.02] hover:bg-white/[0.06] text-[#F2F2F2] text-xs font-mono
              transition-colors duration-75
            "
          >
            <svg
              className="w-3 h-3 text-neutral-400"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M2.75 8H13.25M2.75 8L6.75 4M2.75 8L6.75 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Switch Project
          </Link>
        </div>
      </header>

      {/* Content */}
      {result.success ? (
        <IssueList issues={result.data} projectKey={projectKey} />
      ) : (
        <div className="flex flex-1 items-center justify-center bg-black">
          <div className="border border-red-900/50 bg-red-950/20 px-6 py-4 max-w-sm">
            <p className="text-xs font-mono text-red-400 uppercase tracking-wider mb-1">
              Error
            </p>
            <p className="text-sm text-red-300">{result.error}</p>
          </div>
        </div>
      )}

      {/* Modal — renders as portal, always mounted to listen for 'C' globally */}
      <CreateIssueModal projectId={projectId} />
    </div>
  );
}
