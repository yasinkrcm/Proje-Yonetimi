export type NotificationType =
  | "issue_assigned"
  | "issue_mentioned"
  | "comment_added"
  | "issue_due_soon"
  | "issue_overdue"
  | "project_update";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export type UnreadCount = {
  count: number;
};
