import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

async function ensureDefaultUser() {
  const existing = await db.select().from(usersTable).where(eq(usersTable.id, 1));
  if (existing.length > 0) return existing[0];
  const [user] = await db.insert(usersTable).values({
    name: "Student",
    email: "student@clarifai.app",
    passwordHash: "",
    role: "student",
    bio: null,
    institution: null,
  }).returning();
  return user;
}

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
    bio: u.bio,
    institution: u.institution,
    joinedAt: u.createdAt.toISOString(),
  };
}

router.get("/profile", async (_req, res) => {
  const user = await ensureDefaultUser();
  res.json(formatUser(user));
});

router.patch("/profile", async (req, res) => {
  const { name, bio, institution } = req.body;
  await ensureDefaultUser();
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (bio !== undefined) updates.bio = bio;
  if (institution !== undefined) updates.institution = institution;
  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, 1)).returning();
  res.json(formatUser(updated));
});

router.post("/login", async (req, res) => {
  const { email } = req.body;
  logger.info({ email }, "Login");
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    return res.json({ user: formatUser(existing[0]), token: `token_${existing[0].id}_${Date.now()}` });
  }
  const user = await ensureDefaultUser();
  res.json({ user: formatUser(user), token: `token_${user.id}_${Date.now()}` });
});

router.post("/register", async (req, res) => {
  const { name, email, role } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    return res.json({ user: formatUser(existing[0]), token: `token_${existing[0].id}_${Date.now()}` });
  }
  const [user] = await db.insert(usersTable).values({
    name: name ?? "Student",
    email,
    passwordHash: "",
    role: role ?? "student",
  }).returning();
  logger.info({ userId: user.id }, "User registered");
  res.status(201).json({ user: formatUser(user), token: `token_${user.id}_${Date.now()}` });
});

export default router;
