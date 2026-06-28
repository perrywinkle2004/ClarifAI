import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, messagesTable, documentsTable, documentChunksTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { chat, keywordRetrieve } from "../lib/ai";

const router = Router();

async function buildRAGResponse(
  conversationId: number,
  documentId: number | null,
  userContent: string
): Promise<{ content: string; sources: Array<{ documentTitle: string; pageNumber: number | null; excerpt: string | null; relevance: number }> }> {
  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(messagesTable.createdAt)
    .limit(10);

  const chatHistory = history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  if (!documentId) {
    const { content } = await chat(
      [...chatHistory, { role: "user", content: userContent }],
      "You are ClarifAI, a helpful AI tutor. Answer the student's questions clearly and concisely. Use markdown for structure when helpful."
    );
    return { content, sources: [] };
  }

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, documentId));
  const docTitle = doc?.title ?? "Uploaded document";

  const allChunks = await db.select().from(documentChunksTable).where(eq(documentChunksTable.documentId, documentId));
  
  let relevantChunks: Array<{ content: string; chunkIndex: number; score: number }> = [];
  if (allChunks.length > 0) {
    relevantChunks = keywordRetrieve(allChunks, userContent, 5);
  } else if (doc?.content) {
    relevantChunks = [{ content: doc.content.slice(0, 2000), chunkIndex: 0, score: 0.5 }];
  }

  const context = relevantChunks.map((c, i) => `[Source ${i + 1}]\n${c.content}`).join("\n\n");
  const systemPrompt = `You are ClarifAI, an AI tutor grounded strictly in the student's study material.

Document: "${docTitle}"

Relevant excerpts from the document:
${context}

Instructions:
- Answer only based on the excerpts above.
- Be specific, educational, and helpful.
- If the question cannot be answered from the excerpts, say so clearly.
- Use markdown for structure when helpful (bold, bullet points).`;

  const { content } = await chat(
    [...chatHistory, { role: "user", content: userContent }],
    systemPrompt
  );

  const sources = relevantChunks.slice(0, 3).map((c) => ({
    documentTitle: docTitle,
    pageNumber: c.chunkIndex + 1,
    excerpt: c.content.slice(0, 120),
    relevance: Math.round(Math.min(c.score / 10, 1) * 100) / 100,
  }));

  return { content, sources };
}

router.get("/", async (_req, res) => {
  const convos = await db.select().from(conversationsTable).where(eq(conversationsTable.userId, 1)).orderBy(desc(conversationsTable.updatedAt));
  const msgCounts = await db.select({
    conversationId: messagesTable.conversationId,
    count: sql<number>`count(*)`,
    lastMsg: sql<string>`max(${messagesTable.content})`,
  }).from(messagesTable).groupBy(messagesTable.conversationId);
  const countMap = new Map(msgCounts.map((m) => [m.conversationId, m]));

  res.json(convos.map((c) => {
    const mc = countMap.get(c.id);
    return {
      id: c.id,
      title: c.title,
      messageCount: mc ? Number(mc.count) : 0,
      lastMessage: mc?.lastMsg?.slice(0, 100) ?? null,
      documentId: c.documentId,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }));
});

router.post("/", async (req, res) => {
  const { title, documentId } = req.body;
  const [conv] = await db.insert(conversationsTable).values({
    userId: 1,
    title,
    documentId: documentId ?? null,
  }).returning();
  res.status(201).json({
    id: conv.id,
    title: conv.title,
    messageCount: 0,
    lastMessage: null,
    documentId: conv.documentId,
    createdAt: conv.createdAt.toISOString(),
    updatedAt: conv.updatedAt.toISOString(),
  });
});

router.get("/recent", async (_req, res) => {
  const convos = await db.select().from(conversationsTable).where(eq(conversationsTable.userId, 1)).orderBy(desc(conversationsTable.updatedAt)).limit(5);
  const msgCounts = await db.select({
    conversationId: messagesTable.conversationId,
    count: sql<number>`count(*)`,
  }).from(messagesTable).groupBy(messagesTable.conversationId);
  const countMap = new Map(msgCounts.map((m) => [m.conversationId, Number(m.count)]));

  res.json(convos.map((c) => ({
    id: c.id,
    title: c.title,
    messageCount: countMap.get(c.id) ?? 0,
    lastMessage: null,
    documentId: c.documentId,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  })));
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id));
  if (!conv) return res.status(404).json({ error: "Not found" });
  const msgs = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, id)).orderBy(messagesTable.createdAt);
  res.json({
    id: conv.id,
    title: conv.title,
    messages: msgs.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      sources: m.sources ? JSON.parse(m.sources) : [],
      createdAt: m.createdAt.toISOString(),
    })),
    documentId: conv.documentId,
    createdAt: conv.createdAt.toISOString(),
    updatedAt: conv.updatedAt.toISOString(),
  });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(messagesTable).where(eq(messagesTable.conversationId, id));
  await db.delete(conversationsTable).where(eq(conversationsTable.id, id));
  res.status(204).send();
});

router.post("/:id/messages", async (req, res) => {
  const conversationId = Number(req.params.id);
  const { content } = req.body;

  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, conversationId));
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  await db.insert(messagesTable).values({ conversationId, role: "user", content, sources: "[]" });

  let aiResp: { content: string; sources: any[] };
  try {
    aiResp = await buildRAGResponse(conversationId, conv.documentId, content);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI unavailable";
    aiResp = { content: `⚠️ ${msg}`, sources: [] };
  }

  const [aiMsg] = await db.insert(messagesTable).values({
    conversationId,
    role: "assistant",
    content: aiResp.content,
    sources: JSON.stringify(aiResp.sources),
  }).returning();

  await db.update(conversationsTable).set({ updatedAt: new Date() }).where(eq(conversationsTable.id, conversationId));

  logger.info({ conversationId, documentId: conv.documentId }, "Message sent");
  res.json({
    id: aiMsg.id,
    conversationId: aiMsg.conversationId,
    role: aiMsg.role,
    content: aiMsg.content,
    sources: aiResp.sources,
    createdAt: aiMsg.createdAt.toISOString(),
  });
});

export default router;
