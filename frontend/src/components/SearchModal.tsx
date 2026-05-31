"use client";

import React, { useState, useEffect } from "react";
import { searchAll } from "@/app/(dashboard)/actions";

export default function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ projects: any[], issues: any[] }>({ projects: [], issues: [] });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (query.length < 2) {
      setResults({ projects: [], issues: [] });
      return;
    }
    const timer = setTimeout(async () => {
      const res = await searchAll(query);
      if (res.success) {
        setResults(res.data);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-glow-lg overflow-hidden flex flex-col">
        <div className="flex items-center px-4 border-b border-zinc-800">
          <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            autoFocus
            type="text"
            className="w-full bg-transparent border-none text-white px-4 py-4 focus:outline-none focus:ring-0 placeholder-zinc-500"
            placeholder="Search issues, projects, members..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="text-xs font-mono px-2 py-1 bg-zinc-800 text-zinc-400 rounded-md" onClick={onClose}>ESC</button>
        </div>

        {(results.projects.length > 0 || results.issues.length > 0) && (
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {results.projects.length > 0 && (
              <div className="mb-4">
                <div className="px-3 py-1 text-xs font-semibold text-zinc-500 uppercase">Projects</div>
                {results.projects.map((p) => (
                  <div key={p.id} className="px-3 py-2 hover:bg-brand-500/10 hover:text-brand-400 text-zinc-300 rounded-lg cursor-pointer flex items-center">
                    <span className="w-2 h-2 rounded-full bg-brand-500 mr-3" />
                    {p.name} <span className="text-zinc-600 text-xs ml-2">{p.key}</span>
                  </div>
                ))}
              </div>
            )}
            
            {results.issues.length > 0 && (
              <div>
                <div className="px-3 py-1 text-xs font-semibold text-zinc-500 uppercase">Issues</div>
                {results.issues.map((i) => (
                  <div key={i.id} className="px-3 py-2 hover:bg-brand-500/10 hover:text-brand-400 text-zinc-300 rounded-lg cursor-pointer">
                    {i.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {query.length >= 2 && results.projects.length === 0 && results.issues.length === 0 && (
          <div className="p-8 text-center text-zinc-500">
            No results found for "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
