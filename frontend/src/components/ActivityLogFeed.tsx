"use client";

import React from "react";
import type { ActivityLog } from "@/types/activity";

interface Props {
  issueId: string;
}

export default function ActivityLogFeed({ issueId }: Props) {
  const activities: ActivityLog[] = [];

  return (
    <div data-issue={issueId} className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/5 before:to-transparent">
      {activities.length === 0 ? (
        <div className="text-center text-sm text-neutral-500 py-4">No activity yet.</div>
      ) : (
        <div className="text-center text-sm text-neutral-500 py-4">Activities will appear here.</div>
      )}
    </div>
  );
}
