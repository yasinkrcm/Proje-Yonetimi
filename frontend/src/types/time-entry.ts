export type TimeEntry = {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  description: string | null;
  createdAt: string;
};
