export type MemberRole = "owner" | "admin" | "member" | "viewer";

export type WorkspaceMember = {
  workspaceId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
};
