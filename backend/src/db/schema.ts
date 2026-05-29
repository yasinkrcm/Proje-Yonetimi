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
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  projects: many(projects),
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

export const issuesRelations = relations(issues, ({ one }) => ({
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
}));

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

export type IssueStatus = (typeof issueStatusEnum.enumValues)[number];
export type IssuePriority = (typeof issuePriorityEnum.enumValues)[number];
export type WorkspaceMemberRole =
  (typeof workspaceMemberRoleEnum.enumValues)[number];
