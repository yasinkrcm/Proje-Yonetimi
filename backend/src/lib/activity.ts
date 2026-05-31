import { db } from "@db/index";
import { activityLogs } from "@db/schema";

export async function logActivity(params: {
  workspaceId: string;
  projectId?: string;
  issueId?: string;
  actorId: string;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(activityLogs).values({
    workspaceId: params.workspaceId,
    projectId: params.projectId ?? null,
    issueId: params.issueId ?? null,
    actorId: params.actorId,
    action: params.action,
    metadata: params.metadata ?? {},
  });
}
