import { Router } from "express";
import { db } from "@workspace/db";
import { documentsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

router.get("/", async (req, res) => {
  const userId = 1;
  const docs = await db.select().from(documentsTable).where(eq(documentsTable.userId, userId));
  const result = docs.map((d) => ({
    id: d.id,
    title: d.title,
    filename: d.filename,
    fileType: d.fileType,
    fileSize: d.fileSize,
    status: d.status,
    chunkCount: d.chunkCount,
    topic: d.topic,
    createdAt: d.createdAt.toISOString(),
  }));
  res.json(result);
});

router.post("/", async (req, res) => {
  const { title, filename, fileType, fileSize, topic, content } = req.body;
  const chunkCount = content ? Math.ceil(content.length / 500) : Math.floor(Math.random() * 20) + 5;
  const [doc] = await db.insert(documentsTable).values({
    userId: 1,
    title,
    filename: filename ?? title,
    fileType,
    fileSize: fileSize ?? 0,
    status: "ready",
    chunkCount,
    topic: topic ?? null,
    content: content ?? null,
  }).returning();
  logger.info({ docId: doc.id }, "Document uploaded");
  res.status(201).json({
    id: doc.id,
    title: doc.title,
    filename: doc.filename,
    fileType: doc.fileType,
    fileSize: doc.fileSize,
    status: doc.status,
    chunkCount: doc.chunkCount,
    topic: doc.topic,
    createdAt: doc.createdAt.toISOString(),
  });
});

router.get("/stats", async (_req, res) => {
  const docs = await db.select().from(documentsTable).where(eq(documentsTable.userId, 1));
  const total = docs.length;
  const ready = docs.filter((d) => d.status === "ready").length;
  const processing = docs.filter((d) => d.status === "processing").length;
  const totalChunks = docs.reduce((sum, d) => sum + d.chunkCount, 0);
  const totalSize = docs.reduce((sum, d) => sum + d.fileSize, 0);
  res.json({ total, ready, processing, totalChunks, totalSize });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json({
    id: doc.id,
    title: doc.title,
    filename: doc.filename,
    fileType: doc.fileType,
    fileSize: doc.fileSize,
    status: doc.status,
    chunkCount: doc.chunkCount,
    topic: doc.topic,
    createdAt: doc.createdAt.toISOString(),
  });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(documentsTable).where(eq(documentsTable.id, id));
  res.status(204).send();
});

export default router;
