"use client";

import React, { useState, useEffect } from "react";
import { getUnreadCount } from "@/app/(dashboard)/actions";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      const res = await getUnreadCount();
      if (res.success) {
        setUnreadCount(res.data.count);
      }
    }
    fetchCount();
    // In a real app we'd poll or use WebSockets here
  }, []);

  return (
    <button className="relative p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger-500 border-2 border-zinc-950 rounded-full animate-pulse"></span>
      )}
    </button>
  );
}
