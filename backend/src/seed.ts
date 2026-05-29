import { db } from "./db/index";
import { users, workspaces, workspaceMembers, projects } from "./db/schema";
import { hashPassword } from "./lib/password";
import { eq } from "drizzle-orm";

const SEED_EMAIL = "admin@example.com";
const SEED_PASSWORD = "Admin123!";

async function seed(): Promise<void> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, SEED_EMAIL))
    .limit(1);

  if (existing[0]) {
    console.log("  ✓ Database already seeded — skipping");
    return;
  }

  const passwordHash = await hashPassword(SEED_PASSWORD);

  const [user] = await db
    .insert(users)
    .values({ email: SEED_EMAIL, displayName: "Admin", passwordHash })
    .returning();

  const [workspace] = await db
    .insert(workspaces)
    .values({ slug: "default", name: "Default Workspace" })
    .returning();

  await db.insert(workspaceMembers).values({
    workspaceId: workspace!.id,
    userId: user!.id,
    role: "owner",
  });

  const [project] = await db
    .insert(projects)
    .values({
      workspaceId: workspace!.id,
      key: "PROJ",
      name: "Default Project",
      createdById: user!.id,
    })
    .returning();

  console.log("  ✓ Database seeded");
  console.log(`    Email    : ${SEED_EMAIL}`);
  console.log(`    Password : ${SEED_PASSWORD}`);
  console.log(`    ProjectID: ${project!.id}`);
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
