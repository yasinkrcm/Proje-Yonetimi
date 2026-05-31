import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  index,
  uniqueIndex,
  primaryKey,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export const issueStatusEnum = pgEnum("issue_status", [
  "todo",
  "in_progress",
  "done",
  "cancelled",
]);

export const issuePriorityEnum = pgEnum("issue_priority", [
  "no_priority",
  "urgent",
  "high",
  "medium",
  "low",
]);

export const workspaceMemberRoleEnum = pgEnum("workspace_member_role", [
  "owner",
  "admin",
  "member",
  "viewer",
]);

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: varchar("email", { length: 320 }).notNull(),
    displayName: varchar("display_name", { length: 128 }).notNull(),
    avatarUrl: text("avatar_url"),
    passwordHash: varchar("password_hash", { length: 256 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("users_email_uidx").on(t.email)]
);

// ─────────────────────────────────────────────
// WORKSPACES
// ─────────────────────────────────────────────

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    /** URL-safe identifier: my-team, acme-corp */
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("workspaces_slug_uidx").on(t.slug)]
);

// ─────────────────────────────────────────────
// WORKSPACE MEMBERS  (many-to-many: users ↔ workspaces)
// ─────────────────────────────────────────────

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: workspaceMemberRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.userId] }),
    index("wm_workspace_id_idx").on(t.workspaceId),
    index("wm_user_id_idx").on(t.userId),
  ]
);

// ─────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────

export const projects = pgTable(
  "projects",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    /** Short uppercase key used in issue IDs: PROJ, BACK, UI */
    key: varchar("key", { length: 8 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    description: text("description"),
    /** Autoincrement counter for generating PROJ-1, PROJ-2 … */
    issueCounter: integer("issue_counter").notNull().default(0),
    isArchived: boolean("is_archived").notNull().default(false),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    /** key must be unique within a workspace, not globally */
    uniqueIndex("projects_workspace_key_uidx").on(t.workspaceId, t.key),
    index("projects_workspace_id_idx").on(t.workspaceId),
  ]
);

// ─────────────────────────────────────────────
// CYCLES  (sprints / iterations)
// ─────────────────────────────────────────────

export const cycles = pgTable(
  "cycles",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 128 }).notNull(),
    description: text("description"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("cycles_project_id_idx").on(t.projectId),
    /** prevent overlapping cycles at the DB level would need a CHECK constraint
     *  or exclusion constraint; that is handled in a migration, not here. */
  ]
);

// ─────────────────────────────────────────────
// ISSUES
// ─────────────────────────────────────────────

export const issues = pgTable(
  "issues",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    cycleId: uuid("cycle_id").references(() => cycles.id, {
      onDelete: "set null",
    }),
    /**
     * Human-readable sequence number scoped to the project.
     * The composite of (project.key + issueNumber) forms the public ID: PROJ-42.
     * This value is set from projects.issueCounter via a DB trigger or
     * application-level transaction — never auto-assigned by Postgres sequences,
     * so that key remains stable even if issues are deleted.
     */
    issueNumber: integer("issue_number").notNull(),
    title: varchar("title", { length: 512 }).notNull(),
    description: text("description"),
    status: issueStatusEnum("status").notNull().default("todo"),
    priority: issuePriorityEnum("priority").notNull().default("no_priority"),
    /** The user who reported / created the issue */
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    /** The user currently responsible for resolving the issue */
    assigneeId: uuid("assignee_id").references(() => users.id, {
      onDelete: "set null",
    }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** Start date for scheduling */
    startAt: timestamp("start_at", { withTimezone: true }),
    /** Estimated duration in minutes */
    estimatedMinutes: integer("estimated_minutes"),
    /** Self-referencing FK for subtask hierarchy */
    parentIssueId: uuid("parent_issue_id").references((): any => issues.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    /** The pair (project, issueNumber) must be globally unique */
    uniqueIndex("issues_project_number_uidx").on(t.projectId, t.issueNumber),
    index("issues_project_id_idx").on(t.projectId),
    index("issues_cycle_id_idx").on(t.cycleId),
    index("issues_assignee_id_idx").on(t.assigneeId),
    index("issues_status_idx").on(t.status),
    index("issues_parent_issue_id_idx").on(t.parentIssueId),
  ]
);

// ─────────────────────────────────────────────
// LABELS
// ─────────────────────────────────────────────

export const labels = pgTable(
  "labels",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 64 }).notNull(),
    /** Hex color code, e.g. #FF5733 */
    color: varchar("color", { length: 7 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("labels_project_id_idx").on(t.projectId)]
);

// ─────────────────────────────────────────────
// ISSUE LABELS  (many-to-many: issues ↔ labels)
// ─────────────────────────────────────────────

export const issueLabels = pgTable(
  "issue_labels",
  {
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    labelId: uuid("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.issueId, t.labelId] }),
    index("il_issue_id_idx").on(t.issueId),
    index("il_label_id_idx").on(t.labelId),
  ]
);

// ─────────────────────────────────────────────
// COMMENTS
// ─────────────────────────────────────────────

export const comments = pgTable(
  "comments",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("comments_issue_id_idx").on(t.issueId),
    index("comments_author_id_idx").on(t.authorId),
  ]
);

// ─────────────────────────────────────────────
// CHECKLISTS
// ─────────────────────────────────────────────

export const checklists = pgTable(
  "checklists",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 256 }).notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("checklists_issue_id_idx").on(t.issueId)]
);

// ─────────────────────────────────────────────
// CHECKLIST ITEMS
// ─────────────────────────────────────────────

export const checklistItems = pgTable(
  "checklist_items",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    checklistId: uuid("checklist_id")
      .notNull()
      .references(() => checklists.id, { onDelete: "cascade" }),
    content: varchar("content", { length: 512 }).notNull(),
    isCompleted: boolean("is_completed").notNull().default(false),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("checklist_items_checklist_id_idx").on(t.checklistId)]
);

// ─────────────────────────────────────────────
// ATTACHMENTS
// ─────────────────────────────────────────────

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    uploaderId: uuid("uploader_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    filename: varchar("filename", { length: 256 }).notNull(),
    mimeType: varchar("mime_type", { length: 128 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    /** Base64 data or file path */
    storageKey: text("storage_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("attachments_issue_id_idx").on(t.issueId),
    index("attachments_uploader_id_idx").on(t.uploaderId),
  ]
);

// ─────────────────────────────────────────────
// ACTIVITY LOGS
// ─────────────────────────────────────────────

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    issueId: uuid("issue_id").references(() => issues.id, {
      onDelete: "set null",
    }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    action: varchar("action", { length: 64 }).notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("activity_logs_workspace_id_idx").on(t.workspaceId),
    index("activity_logs_project_id_idx").on(t.projectId),
    index("activity_logs_issue_id_idx").on(t.issueId),
    index("activity_logs_actor_id_idx").on(t.actorId),
  ]
);

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 64 }).notNull(),
    title: varchar("title", { length: 256 }).notNull(),
    message: text("message").notNull(),
    link: text("link"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("notifications_user_id_idx").on(t.userId),
    index("notifications_is_read_idx").on(t.isRead),
  ]
);

// ─────────────────────────────────────────────
// TIME ENTRIES
// ─────────────────────────────────────────────

export const timeEntries = pgTable(
  "time_entries",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationMinutes: integer("duration_minutes"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("time_entries_issue_id_idx").on(t.issueId),
    index("time_entries_user_id_idx").on(t.userId),
  ]
);

// ─────────────────────────────────────────────
// ISSUE DEPENDENCIES
// ─────────────────────────────────────────────

export const issueDependencies = pgTable(
  "issue_dependencies",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    dependsOnIssueId: uuid("depends_on_issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("issue_deps_issue_id_idx").on(t.issueId),
    index("issue_deps_depends_on_idx").on(t.dependsOnIssueId),
  ]
);

// ─────────────────────────────────────────────
// RELATIONS  (for Drizzle query API — zero runtime overhead)
// ─────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  workspaceMemberships: many(workspaceMembers),
  reportedIssues: many(issues, { relationName: "reporter" }),
  assignedIssues: many(issues, { relationName: "assignee" }),
  createdProjects: many(projects),
  createdCycles: many(cycles),
  comments: many(comments),
  notifications: many(notifications),
  timeEntries: many(timeEntries),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  projects: many(projects),
  activityLogs: many(activityLogs),
}));

export const workspaceMembersRelations = relations(
  workspaceMembers,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspaceId],
      references: [workspaces.id],
    }),
    user: one(users, {
      fields: [workspaceMembers.userId],
      references: [users.id],
    }),
  })
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
  createdBy: one(users, {
    fields: [projects.createdById],
    references: [users.id],
  }),
  cycles: many(cycles),
  issues: many(issues),
  labels: many(labels),
  activityLogs: many(activityLogs),
}));

export const cyclesRelations = relations(cycles, ({ one, many }) => ({
  project: one(projects, {
    fields: [cycles.projectId],
    references: [projects.id],
  }),
  createdBy: one(users, {
    fields: [cycles.createdById],
    references: [users.id],
  }),
  issues: many(issues),
}));

export const issuesRelations = relations(issues, ({ one, many }) => ({
  project: one(projects, {
    fields: [issues.projectId],
    references: [projects.id],
  }),
  cycle: one(cycles, {
    fields: [issues.cycleId],
    references: [cycles.id],
  }),
  reporter: one(users, {
    fields: [issues.reporterId],
    references: [users.id],
    relationName: "reporter",
  }),
  assignee: one(users, {
    fields: [issues.assigneeId],
    references: [users.id],
    relationName: "assignee",
  }),
  parentIssue: one(issues, {
    fields: [issues.parentIssueId],
    references: [issues.id],
    relationName: "subtasks",
  }),
  subtasks: many(issues, { relationName: "subtasks" }),
  comments: many(comments),
  issueLabels: many(issueLabels),
  checklists: many(checklists),
  attachments: many(attachments),
  timeEntries: many(timeEntries),
  dependencies: many(issueDependencies, { relationName: "issueDeps" }),
}));

export const labelsRelations = relations(labels, ({ one, many }) => ({
  project: one(projects, {
    fields: [labels.projectId],
    references: [projects.id],
  }),
  issueLabels: many(issueLabels),
}));

export const issueLabelsRelations = relations(issueLabels, ({ one }) => ({
  issue: one(issues, {
    fields: [issueLabels.issueId],
    references: [issues.id],
  }),
  label: one(labels, {
    fields: [issueLabels.labelId],
    references: [labels.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  issue: one(issues, {
    fields: [comments.issueId],
    references: [issues.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const checklistsRelations = relations(checklists, ({ one, many }) => ({
  issue: one(issues, {
    fields: [checklists.issueId],
    references: [issues.id],
  }),
  items: many(checklistItems),
}));

export const checklistItemsRelations = relations(
  checklistItems,
  ({ one }) => ({
    checklist: one(checklists, {
      fields: [checklistItems.checklistId],
      references: [checklists.id],
    }),
  })
);

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  issue: one(issues, {
    fields: [attachments.issueId],
    references: [issues.id],
  }),
  uploader: one(users, {
    fields: [attachments.uploaderId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [activityLogs.workspaceId],
    references: [workspaces.id],
  }),
  project: one(projects, {
    fields: [activityLogs.projectId],
    references: [projects.id],
  }),
  issue: one(issues, {
    fields: [activityLogs.issueId],
    references: [issues.id],
  }),
  actor: one(users, {
    fields: [activityLogs.actorId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  issue: one(issues, {
    fields: [timeEntries.issueId],
    references: [issues.id],
  }),
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
}));

export const issueDependenciesRelations = relations(
  issueDependencies,
  ({ one }) => ({
    issue: one(issues, {
      fields: [issueDependencies.issueId],
      references: [issues.id],
      relationName: "issueDeps",
    }),
    dependsOn: one(issues, {
      fields: [issueDependencies.dependsOnIssueId],
      references: [issues.id],
      relationName: "dependedOnBy",
    }),
  })
);

// ─────────────────────────────────────────────
// INFERRED TYPES  (single source of truth — no manual interface duplication)
// ─────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;

export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Cycle = typeof cycles.$inferSelect;
export type NewCycle = typeof cycles.$inferInsert;

export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;

export type Label = typeof labels.$inferSelect;
export type NewLabel = typeof labels.$inferInsert;

export type IssueLabel = typeof issueLabels.$inferSelect;
export type NewIssueLabel = typeof issueLabels.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type Checklist = typeof checklists.$inferSelect;
export type NewChecklist = typeof checklists.$inferInsert;

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type NewChecklistItem = typeof checklistItems.$inferInsert;

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;

export type IssueDependency = typeof issueDependencies.$inferSelect;
export type NewIssueDependency = typeof issueDependencies.$inferInsert;

export type IssueStatus = (typeof issueStatusEnum.enumValues)[number];
export type IssuePriority = (typeof issuePriorityEnum.enumValues)[number];
export type WorkspaceMemberRole =
  (typeof workspaceMemberRoleEnum.enumValues)[number];
