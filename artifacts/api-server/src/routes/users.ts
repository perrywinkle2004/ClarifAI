import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

const DEFAULT_USER = {
  id: 1,
  name: "Alex Chen",
  email: "alex@clarifai.app",
  role: "student" as const,
  avatar: null,
  bio: "Passionate about learning and AI-powered education",
  institution: "State University",
  joinedAt: new Date("2024-01-15").toISOString(),
};

async function getOrCreateUser() {
  const existing = await db.select().from(usersTable).where(eq(usersTable.id, 1));
  if (existing.length > 0) return existing[0];
  const [user] = await db.insert(usersTable).values({
    name: DEFAULT_USER.name,
    email: DEFAULT_USER.email,
    passwordHash: "demo_hash",
    role: "student",
    bio: DEFAULT_USER.bio,
    institution: DEFAULT_USER.institution,
  }).returning();
  return user;
}

router.get("/profile", async (_req, res) => {
  const user = await getOrCreateUser();
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    institution: user.institution,
    joinedAt: user.createdAt.toISOString(),
  });
});

router.patch("/profile", async (req, res) => {
  const { name, bio, institution } = req.body;
  await getOrCreateUser();
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (bio !== undefined) updates.bio = bio;
  if (institution !== undefined) updates.institution = institution;
  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, 1)).returning();
  res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    avatar: updated.avatar,
    bio: updated.bio,
    institution: updated.institution,
    joinedAt: updated.createdAt.toISOString(),
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  logger.info({ email }, "Login attempt");
  const user = await getOrCreateUser();
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      institution: user.institution,
      joinedAt: user.createdAt.toISOString(),
    },
    token: `demo_token_${Date.now()}`,
  });
});

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    const u = existing[0];
    return res.json({
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        bio: u.bio,
        institution: u.institution,
        joinedAt: u.createdAt.toISOString(),
      },
      token: `demo_token_${Date.now()}`,
    });
  }
  const [user] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash: "demo_hash",
    role: role ?? "student",
  }).returning();
  logger.info({ userId: user.id }, "User registered");
  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      institution: user.institution,
      joinedAt: user.createdAt.toISOString(),
    },
    token: `demo_token_${Date.now()}`,
  });
});

export default router;
