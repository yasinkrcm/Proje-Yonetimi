"use client";

import React from "react";
import type { ActivityLog } from "@/types/activity";

function getRelativeTime(date: string | Date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return past.toLocaleDateString();
}

export default function ActivityFeed({ activities }: { activities: ActivityLog[] }) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 text-sm">
        No recent activity found.
      </div>
    );
  }

  return (
    <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
      {activities.map((activity) => (
        <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          {/* Timeline dot */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-zinc-950 bg-zinc-800 text-zinc-400 group-hover:bg-brand-500 group-hover:text-white group-hover:border-brand-500/30 transition-all duration-300 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
            {activity.actorAvatarUrl ? (
              <img src={activity.actorAvatarUrl} alt={activity.actorName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-xs font-semibold">{activity.actorName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          
          {/* Content Card */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm card-hover shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-zinc-200 text-sm">{activity.actorName}</span>
              <span className="text-xs text-zinc-500 font-mono">{getRelativeTime(activity.createdAt)}</span>
            </div>
            <p className="text-zinc-400 text-sm">
              <span className="text-brand-400">{activity.action.split('.').join(' ')}</span>
              {activity.metadata && (activity.metadata as any).title && (
                <span className="text-zinc-300 ml-1">"{String((activity.metadata as any).title)}"</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
