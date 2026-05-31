export type ActivityAction =
  | "issue_created"
  | "issue_updated"
  | "issue_deleted"
  | "comment_added"
  | "comment_deleted"
  | "label_added"
  | "label_removed"
  | "checklist_created"
  | "checklist_item_completed"
  | "attachment_uploaded"
  | "member_added"
  | "member_removed"
  | "status_changed"
  | "priority_changed"
  | "assignee_changed";

export type ActivityLog = {
  id: string;
  workspaceId: string;
  projectId: string | null;
  issueId: string | null;
  actorId: string;
  actorName: string;
  actorAvatarUrl: string | null;
  action: ActivityAction;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};
