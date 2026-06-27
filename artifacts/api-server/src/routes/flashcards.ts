import { Router } from "express";
import { db } from "@workspace/db";
import { flashcardSetsTable, flashcardsTable } from "@workspace/db";
import { eq, desc, inArray } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

const SAMPLE_FLASHCARDS = [
  { front: "What is photosynthesis?", back: "The process by which green plants convert sunlight, water, and carbon dioxide into glucose and oxygen using chlorophyll in their chloroplasts.", difficulty: "easy" },
  { front: "Define osmosis", back: "The spontaneous net movement of water molecules through a selectively permeable membrane from an area of lower solute concentration to higher solute concentration.", difficulty: "medium" },
  { front: "What is the Central Dogma?", back: "The fundamental principle of molecular biology: DNA is transcribed into RNA, which is translated into protein. Information flows DNA → RNA → Protein.", difficulty: "medium" },
  { front: "What is ATP?", back: "Adenosine Triphosphate — the primary energy currency of cells. It stores and transfers chemical energy within cells for metabolism.", difficulty: "easy" },
  { front: "What is mitosis?", back: "A type of cell division resulting in two daughter cells with the same number of chromosomes as the parent cell. Stages: Prophase, Metaphase, Anaphase, Telophase.", difficulty: "medium" },
  { front: "Define meiosis", back: "A type of cell division that reduces the chromosome number by half, creating four haploid cells. Essential for sexual reproduction.", difficulty: "hard" },
  { front: "What is the role of DNA polymerase?", back: "DNA polymerase is an enzyme that synthesizes new DNA strands by adding nucleotides complementary to the template strand during DNA replication.", difficulty: "hard" },
  { front: "What is homeostasis?", back: "The ability of an organism to maintain a stable internal environment despite changes in external conditions, regulating temperature, pH, and other variables.", difficulty: "easy" },
  { front: "Define enzyme", back: "A biological catalyst — a protein that speeds up chemical reactions in cells without being consumed. Enzymes are highly specific to their substrates.", difficulty: "medium" },
  { front: "What is natural selection?", back: "The mechanism of evolution where individuals with heritable traits better suited to their environment tend to survive and reproduce, passing those traits to offspring.", difficulty: "medium" },
];

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
  const count = Math.min(cardCount, SAMPLE_FLASHCARDS.length);

  const [set] = await db.insert(flashcardSetsTable).values({
    userId: 1,
    title,
    topic: topic ?? null,
    documentId: documentId ?? null,
    cardCount: count,
    studiedCount: 0,
    masteredCount: 0,
  }).returning();

  const shuffled = [...SAMPLE_FLASHCARDS].sort(() => Math.random() - 0.5).slice(0, count);
  for (const card of shuffled) {
    await db.insert(flashcardsTable).values({
      setId: set.id,
      front: card.front,
      back: card.back,
      mastered: false,
      difficulty: card.difficulty,
    });
  }

  logger.info({ setId: set.id }, "Flashcard set generated");
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
    cards: cards.map((c) => ({
      id: c.id,
      setId: c.setId,
      front: c.front,
      back: c.back,
      mastered: c.mastered,
      difficulty: c.difficulty,
    })),
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

  res.json({
    id: updated.id,
    title: updated.title,
    cardCount: updated.cardCount,
    studiedCount: updated.studiedCount,
    masteredCount: updated.masteredCount,
    topic: updated.topic,
    documentId: updated.documentId,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
