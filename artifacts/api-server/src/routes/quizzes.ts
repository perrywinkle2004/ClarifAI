import { Router } from "express";
import { db } from "@workspace/db";
import { quizzesTable, quizQuestionsTable, quizAttemptsTable, documentChunksTable, documentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { chat } from "../lib/ai";

const router = Router();

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

async function generateQuestions(context: string, count: number, difficulty: string): Promise<QuizQuestion[]> {
  const prompt = `You are an expert quiz creator. Based on the study material below, generate exactly ${count} multiple-choice questions at ${difficulty} difficulty.

IMPORTANT: Respond with ONLY a valid JSON array — no explanation, no markdown fences, no preamble.

Format:
[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"..."}]
- correctAnswer is the 0-based index of the correct option
- options must have exactly 4 entries

Study material:
${context}`;

  const { content } = await chat([{ role: "user", content: prompt }]);
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array in AI response");
  const parsed = JSON.parse(match[0]) as QuizQuestion[];
  return parsed.filter((q) => q.question && Array.isArray(q.options) && q.options.length === 4);
}

router.get("/", async (_req, res) => {
  const quizzes = await db.select().from(quizzesTable).where(eq(quizzesTable.userId, 1)).orderBy(desc(quizzesTable.createdAt));
  res.json(quizzes.map((q) => ({
    id: q.id,
    title: q.title,
    questionCount: q.questionCount,
    difficulty: q.difficulty,
    topic: q.topic,
    documentId: q.documentId,
    bestScore: q.bestScore,
    attemptCount: q.attemptCount,
    createdAt: q.createdAt.toISOString(),
  })));
});

router.post("/", async (req, res) => {
  const { title, topic, documentId, questionCount = 5, difficulty = "medium" } = req.body;

  if (!documentId) {
    return res.status(400).json({ error: "Select a document first — quizzes are generated from your uploaded study material." });
  }

  const chunks = await db.select().from(documentChunksTable).where(eq(documentChunksTable.documentId, Number(documentId))).limit(8);
  let context = chunks.map((c) => c.content).join("\n\n---\n\n");

  if (!context) {
    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, Number(documentId)));
    if (!doc?.content) return res.status(400).json({ error: "Document has no content." });
    context = doc.content.slice(0, 6000);
  }

  context = context.slice(0, 6000);
  const count = Math.min(Number(questionCount), 20);

  let questions: QuizQuestion[] = [];
  try {
    questions = await generateQuestions(context, count, difficulty);
  } catch (err) {
    logger.error({ err }, "Quiz generation failed");
    return res.status(502).json({ error: "AI quiz generation failed. Check that GROQ_API_KEY is set or Ollama is running locally." });
  }

  if (questions.length === 0) {
    return res.status(502).json({ error: "AI returned no valid questions. Try again or use a different document." });
  }

  const [quiz] = await db.insert(quizzesTable).values({
    userId: 1,
    title,
    topic: topic ?? null,
    documentId: Number(documentId),
    difficulty,
    questionCount: questions.length,
    bestScore: null,
    attemptCount: 0,
  }).returning();

  for (const q of questions) {
    await db.insert(quizQuestionsTable).values({
      quizId: quiz.id,
      question: q.question,
      options: JSON.stringify(q.options),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    });
  }

  logger.info({ quizId: quiz.id, questions: questions.length }, "Quiz generated");
  res.status(201).json({
    id: quiz.id,
    title: quiz.title,
    questionCount: quiz.questionCount,
    difficulty: quiz.difficulty,
    topic: quiz.topic,
    documentId: quiz.documentId,
    bestScore: quiz.bestScore,
    attemptCount: quiz.attemptCount,
    createdAt: quiz.createdAt.toISOString(),
  });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, id));
  if (!quiz) return res.status(404).json({ error: "Not found" });
  const questions = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.quizId, id));
  res.json({
    id: quiz.id,
    title: quiz.title,
    questions: questions.map((q) => ({
      id: q.id,
      quizId: q.quizId,
      question: q.question,
      options: JSON.parse(q.options),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    })),
    difficulty: quiz.difficulty,
    topic: quiz.topic,
    documentId: quiz.documentId,
    createdAt: quiz.createdAt.toISOString(),
  });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(quizQuestionsTable).where(eq(quizQuestionsTable.quizId, id));
  await db.delete(quizAttemptsTable).where(eq(quizAttemptsTable.quizId, id));
  await db.delete(quizzesTable).where(eq(quizzesTable.id, id));
  res.status(204).send();
});

router.post("/:id/submit", async (req, res) => {
  const quizId = Number(req.params.id);
  const { answers, timeSpent } = req.body;
  const questions = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.quizId, quizId));
  let correctCount = 0;
  const questionResults = questions.map((q, i) => {
    const selected = answers[i] ?? -1;
    const isCorrect = selected === q.correctAnswer;
    if (isCorrect) correctCount++;
    return { questionId: q.id, selectedAnswer: selected, correctAnswer: q.correctAnswer, isCorrect, explanation: q.explanation };
  });
  const score = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
  await db.insert(quizAttemptsTable).values({ quizId, userId: 1, score, correctCount, totalQuestions: questions.length, timeSpent: timeSpent ?? 0, answers: JSON.stringify(answers) });
  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, quizId));
  if (quiz) {
    const newBest = quiz.bestScore === null ? score : Math.max(quiz.bestScore, score);
    await db.update(quizzesTable).set({ bestScore: newBest, attemptCount: quiz.attemptCount + 1 }).where(eq(quizzesTable.id, quizId));
  }
  res.json({ quizId, score, correctCount, totalQuestions: questions.length, timeSpent: timeSpent ?? 0, passed: score >= 60, questionResults });
});

export default router;
