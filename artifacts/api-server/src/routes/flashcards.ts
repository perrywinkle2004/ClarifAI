import { Router } from "express";
import { db } from "@workspace/db";
import { flashcardSetsTable, flashcardsTable, documentChunksTable, documentsTable } from "@workspace/db";
import { eq, desc, inArray } from "drizzle-orm";
import { logger } from "../lib/logger";
import { chat } from "../lib/ai";

const router = Router();

interface Flashcard {
  front: string;
  back: string;
  difficulty: "easy" | "medium" | "hard";
}

async function generateFlashcards(context: string, count: number): Promise<Flashcard[]> {
  const prompt = `You are an expert educator creating study flashcards. Based on the study material below, generate exactly ${count} flashcards.

IMPORTANT: Respond with ONLY a valid JSON array — no explanation, no markdown fences, no preamble.

Format:
[{"front":"term or question","back":"definition or answer","difficulty":"easy"}]
- difficulty must be "easy", "medium", or "hard"
- front: concise term, concept, or question
- back: clear, complete explanation

Study material:
${context}`;

  const { content } = await chat([{ role: "user", content: prompt }]);
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array in AI response");
  const parsed = JSON.parse(match[0]) as Flashcard[];
  return parsed.filter((c) => c.front && c.back);
}

router.get("/", async (_req, res) => {
  const sets = await db.select().from(flashcardSetsTable).where(eq(flashcardSetsTable.userId, 1)).orderBy(desc(flashcardSetsTable.createdAt));
  res.json(sets.map((s) => ({
    id: s.id,
    title: s.title,
    cardCount: s.cardCount,
    studiedCount: s.studiedCount,
    masteredCount: s.masteredCount,
    topic: s.topic,
    documentId: s.documentId,
    createdAt: s.createdAt.toISOString(),
  })));
});

router.post("/", async (req, res) => {
  const { title, topic, documentId, cardCount = 10 } = req.body;

  if (!documentId) {
    return res.status(400).json({ error: "Select a document first — flashcards are generated from your uploaded study material." });
  }

  const chunks = await db.select().from(documentChunksTable).where(eq(documentChunksTable.documentId, Number(documentId))).limit(8);
  let context = chunks.map((c) => c.content).join("\n\n---\n\n");

  if (!context) {
    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, Number(documentId)));
    if (!doc?.content) return res.status(400).json({ error: "Document has no content." });
    context = doc.content.slice(0, 6000);
  }

  context = context.slice(0, 6000);
  const count = Math.min(Number(cardCount), 30);

  let cards: Flashcard[] = [];
  try {
    cards = await generateFlashcards(context, count);
  } catch (err) {
    logger.error({ err }, "Flashcard generation failed");
    return res.status(502).json({ error: "AI flashcard generation failed. Check that GROQ_API_KEY is set or Ollama is running locally." });
  }

  if (cards.length === 0) {
    return res.status(502).json({ error: "AI returned no valid flashcards. Try again or use a different document." });
  }

  const [set] = await db.insert(flashcardSetsTable).values({
    userId: 1,
    title,
    topic: topic ?? null,
    documentId: Number(documentId),
    cardCount: cards.length,
    studiedCount: 0,
    masteredCount: 0,
  }).returning();

  for (const card of cards) {
    await db.insert(flashcardsTable).values({
      setId: set.id,
      front: card.front,
      back: card.back,
      mastered: false,
      difficulty: card.difficulty ?? "medium",
    });
  }

  logger.info({ setId: set.id, cards: cards.length }, "Flashcard set generated");
  res.status(201).json({
    id: set.id,
    title: set.title,
    cardCount: set.cardCount,
    studiedCount: set.studiedCount,
    masteredCount: set.masteredCount,
    topic: set.topic,
    documentId: set.documentId,
    createdAt: set.createdAt.toISOString(),
  });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [set] = await db.select().from(flashcardSetsTable).where(eq(flashcardSetsTable.id, id));
  if (!set) return res.status(404).json({ error: "Not found" });
  const cards = await db.select().from(flashcardsTable).where(eq(flashcardsTable.setId, id));
  res.json({
    id: set.id,
    title: set.title,
    cards: cards.map((c) => ({ id: c.id, setId: c.setId, front: c.front, back: c.back, mastered: c.mastered, difficulty: c.difficulty })),
    topic: set.topic,
    documentId: set.documentId,
    createdAt: set.createdAt.toISOString(),
  });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(flashcardsTable).where(eq(flashcardsTable.setId, id));
  await db.delete(flashcardSetsTable).where(eq(flashcardSetsTable.id, id));
  res.status(204).send();
});

router.patch("/:id/progress", async (req, res) => {
  const id = Number(req.params.id);
  const { masteredCardIds } = req.body as { masteredCardIds: number[] };
  const [set] = await db.select().from(flashcardSetsTable).where(eq(flashcardSetsTable.id, id));
  if (!set) return res.status(404).json({ error: "Not found" });
  if (masteredCardIds.length > 0) {
    await db.update(flashcardsTable).set({ mastered: true }).where(inArray(flashcardsTable.id, masteredCardIds));
  }
  const allCards = await db.select().from(flashcardsTable).where(eq(flashcardsTable.setId, id));
  const masteredCount = allCards.filter((c) => c.mastered).length;
  const [updated] = await db.update(flashcardSetsTable).set({
    masteredCount,
    studiedCount: Math.max(set.studiedCount, masteredCardIds.length),
  }).where(eq(flashcardSetsTable.id, id)).returning();
  res.json({ id: updated.id, title: updated.title, cardCount: updated.cardCount, studiedCount: updated.studiedCount, masteredCount: updated.masteredCount, topic: updated.topic, documentId: updated.documentId, createdAt: updated.createdAt.toISOString() });
});

export default router;
