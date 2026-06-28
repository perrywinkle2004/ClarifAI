import { Router } from "express";
import { db } from "@workspace/db";
import { documentsTable, documentChunksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { embed, chunkText } from "../lib/ollama";

const router = Router();

router.get("/", async (req, res) => {
  const userId = 1;
  const docs = await db.select().from(documentsTable).where(eq(documentsTable.userId, userId));
  res.json(docs.map((d) => ({
    id: d.id,
    title: d.title,
    filename: d.filename,
    fileType: d.fileType,
    fileSize: d.fileSize,
    status: d.status,
    chunkCount: d.chunkCount,
    topic: d.topic,
    createdAt: d.createdAt.toISOString(),
  })));
});

router.post("/", async (req, res) => {
  const { title, filename, fileType, fileSize, topic, content } = req.body;
  const [doc] = await db.insert(documentsTable).values({
    userId: 1,
    title,
    filename: filename ?? title,
    fileType,
    fileSize: fileSize ?? 0,
    status: "processing",
    chunkCount: 0,
    topic: topic ?? null,
    content: content ?? null,
  }).returning();

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

  if (content && content.trim().length > 0) {
    embedDocumentInBackground(doc.id, content).catch((err) => {
      logger.error({ err, docId: doc.id }, "Background embedding failed");
    });
  } else {
    await db.update(documentsTable).set({ status: "ready" }).where(eq(documentsTable.id, doc.id));
  }
});

async function embedDocumentInBackground(docId: number, content: string) {
  const chunks = chunkText(content);
  let embedded = 0;

  for (let i = 0; i < chunks.length; i++) {
    try {
      const embedding = await embed(chunks[i]);
      await db.insert(documentChunksTable).values({
        documentId: docId,
        chunkIndex: i,
        content: chunks[i],
        embedding: JSON.stringify(embedding),
      });
      embedded++;
    } catch {
      await db.insert(documentChunksTable).values({
        documentId: docId,
        chunkIndex: i,
        content: chunks[i],
        embedding: null,
      });
    }
  }

  await db.update(documentsTable).set({
    status: "ready",
    chunkCount: chunks.length,
  }).where(eq(documentsTable.id, docId));

  logger.info({ docId, chunks: chunks.length, embedded }, "Document embedded");
}

router.get("/stats", async (_req, res) => {
  const docs = await db.select().from(documentsTable).where(eq(documentsTable.userId, 1));
  res.json({
    total: docs.length,
    ready: docs.filter((d) => d.status === "ready").length,
    processing: docs.filter((d) => d.status === "processing").length,
    totalChunks: docs.reduce((s, d) => s + d.chunkCount, 0),
    totalSize: docs.reduce((s, d) => s + d.fileSize, 0),
  });
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
  await db.delete(documentChunksTable).where(eq(documentChunksTable.documentId, id));
  await db.delete(documentsTable).where(eq(documentsTable.id, id));
  res.status(204).send();
});

export default router;
