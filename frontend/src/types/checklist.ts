export type ChecklistItem = {
  id: string;
  checklistId: string;
  content: string;
  isCompleted: boolean;
  position: number;
  createdAt: string;
};

export type Checklist = {
  id: string;
  issueId: string;
  title: string;
  position: number;
  createdAt: string;
  items: ChecklistItem[];
};
