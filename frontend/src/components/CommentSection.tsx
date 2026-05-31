"use client";

import React, { useState } from "react";
import type { Comment } from "@/types/comment";
import { createComment } from "@/app/(dashboard)/actions";

interface Props {
  issueId: string;
}

export default function CommentSection({ issueId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    const res = await createComment(issueId, newComment);
    if (res.success) {
      setComments([...comments, res.data]);
      setNewComment("");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {comments.length === 0 ? (
          <p className="text-sm text-neutral-500">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">
                {c.authorName?.charAt(0) || "?"}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-neutral-300">{c.authorName}</span>
                  <span className="text-[10px] text-neutral-600">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-neutral-400 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                  {c.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2 mt-auto">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full bg-[#111111] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none h-20"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !newComment.trim()}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </div>
    </div>
  );
}
