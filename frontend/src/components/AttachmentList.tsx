"use client";

import React from "react";

interface Props {
  issueId: string;
}

export default function AttachmentList({ issueId }: Props) {
  return (
    <div data-issue={issueId} className="space-y-4">
      <div className="flex items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-xl hover:bg-white/[0.02] transition-colors cursor-pointer">
        <div className="text-center">
          <svg className="w-8 h-8 text-neutral-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm font-medium text-neutral-300">Click to upload or drag and drop</p>
          <p className="text-xs text-neutral-500 mt-1">SVG, PNG, JPG or PDF (max. 10MB)</p>
        </div>
      </div>
      
      <div className="text-sm text-neutral-500 text-center mt-4">
        No attachments yet.
      </div>
    </div>
  );
}
