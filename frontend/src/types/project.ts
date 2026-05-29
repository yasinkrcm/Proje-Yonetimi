// Mirror of backend Drizzle Project type
// Dates are ISO strings over HTTP — never Date objects

export type Project = {
  id: string;
  workspaceId: string;
  key: string;
  name: string;
  description: string | null;
  issueCounter: number;
  isArchived: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};
