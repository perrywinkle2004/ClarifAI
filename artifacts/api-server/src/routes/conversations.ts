import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, messagesTable, documentsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

const AI_RESPONSES = [
  "Based on the uploaded study material, {topic} refers to the process by which cells divide and produce new cells. The key stages include prophase, metaphase, anaphase, and telophase, each serving distinct functions in ensuring accurate genetic replication.",
  "According to your documents, this concept involves several interconnected principles. The fundamental mechanism operates through a feedback loop where input signals are processed and transformed into measurable outputs.",
  "The study material covers this topic in detail. The core principle is that energy cannot be created or destroyed, only converted from one form to another — a foundational concept that underpins many related phenomena discussed in your notes.",
  "Your uploaded material explains that this phenomenon emerges from the interaction of multiple variables. The critical factor is the relationship between concentration gradients and membrane permeability, which drives the net movement of molecules.",
  "Based on the document you uploaded, the historical context is essential here. The development occurred across three distinct phases, each characterized by shifts in methodology, theoretical framework, and practical application.",
];

function generateAIResponse(userMessage: string): { content: string; sources: Array<{ documentTitle: string; pageNumber: number | null; excerpt: string | null; relevance: number }> } {
  const idx = Math.floor(Math.random() * AI_RESPONSES.length);
  const topic = userMessage.split(" ").slice(0, 3).join(" ");
  const content = AI_RESPONSES[idx].replace("{topic}", topic) +
    "\n\n**Key points to remember:**\n- The relationship between variables is non-linear\n- Context plays a critical role in determining outcomes\n- Multiple sources confirm this interpretation\n\nIf you need clarification on any specific aspect, feel free to ask and I'll reference the relevant sections of your study material.";
  
  const sources = [
    { documentTitle: "Uploaded Study Material", pageNumber: Math.floor(Math.random() * 50) + 1, excerpt: userMessage.slice(0, 100), relevance: 0.85 + Math.random() * 0.1 },
  ];
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

  await db.insert(messagesTable).values({ conversationId, role: "user", content, sources: "[]" });

  const aiResp = generateAIResponse(content);
  const [aiMsg] = await db.insert(messagesTable).values({
    conversationId,
    role: "assistant",
    content: aiResp.content,
    sources: JSON.stringify(aiResp.sources),
  }).returning();

  await db.update(conversationsTable).set({ updatedAt: new Date() }).where(eq(conversationsTable.id, conversationId));

  logger.info({ conversationId }, "Message sent");
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
