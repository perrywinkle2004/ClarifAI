import { Router } from "express";
import { db } from "@workspace/db";
import { quizzesTable, quizQuestionsTable, quizAttemptsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

const SAMPLE_QUESTIONS = [
  {
    question: "What is the primary function of mitochondria in a cell?",
    options: ["Protein synthesis", "Energy production (ATP)", "Cell division", "DNA replication"],
    correctAnswer: 1,
    explanation: "Mitochondria are known as the powerhouse of the cell because they generate most of the cell's supply of ATP, which is used as a source of chemical energy.",
  },
  {
    question: "Which process converts glucose into pyruvate?",
    options: ["Photosynthesis", "Krebs cycle", "Glycolysis", "Oxidative phosphorylation"],
    correctAnswer: 2,
    explanation: "Glycolysis is the metabolic pathway that converts glucose into pyruvate, occurring in the cytoplasm of cells.",
  },
  {
    question: "What is the role of ribosomes in protein synthesis?",
    options: ["DNA transcription", "mRNA translation", "Protein degradation", "Amino acid synthesis"],
    correctAnswer: 1,
    explanation: "Ribosomes are cellular structures where mRNA is translated into protein sequences, making them essential for protein synthesis.",
  },
  {
    question: "Which type of bond holds complementary DNA strands together?",
    options: ["Covalent bonds", "Ionic bonds", "Hydrogen bonds", "Peptide bonds"],
    correctAnswer: 2,
    explanation: "The two complementary strands of DNA are held together by hydrogen bonds between complementary base pairs (A-T and G-C).",
  },
  {
    question: "What is osmosis?",
    options: ["Movement of solutes across membranes", "Movement of water across semi-permeable membranes", "Active transport of ions", "Facilitated diffusion of glucose"],
    correctAnswer: 1,
    explanation: "Osmosis is the spontaneous net movement of water molecules through a semi-permeable membrane from a region of lower solute concentration to higher solute concentration.",
  },
  {
    question: "What is the Central Dogma of molecular biology?",
    options: ["Protein → RNA → DNA", "DNA → RNA → Protein", "RNA → DNA → Protein", "DNA → Protein → RNA"],
    correctAnswer: 1,
    explanation: "The Central Dogma states that genetic information flows from DNA to RNA (transcription) to protein (translation).",
  },
  {
    question: "What is the purpose of the cell membrane?",
    options: ["Energy production", "Protein synthesis", "Regulating what enters and exits the cell", "DNA storage"],
    correctAnswer: 2,
    explanation: "The cell membrane (plasma membrane) controls the movement of substances in and out of the cell, maintaining homeostasis.",
  },
  {
    question: "Which organelle is responsible for photosynthesis?",
    options: ["Mitochondria", "Nucleus", "Chloroplast", "Ribosome"],
    correctAnswer: 2,
    explanation: "Chloroplasts are the organelles in plant cells where photosynthesis occurs, converting light energy into chemical energy stored in glucose.",
  },
];

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
  const count = Math.min(questionCount, SAMPLE_QUESTIONS.length);
  
  const [quiz] = await db.insert(quizzesTable).values({
    userId: 1,
    title,
    topic: topic ?? null,
    documentId: documentId ?? null,
    difficulty,
    questionCount: count,
    bestScore: null,
    attemptCount: 0,
  }).returning();

  const shuffled = [...SAMPLE_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, count);
  for (const q of shuffled) {
    await db.insert(quizQuestionsTable).values({
      quizId: quiz.id,
      question: q.question,
      options: JSON.stringify(q.options),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    });
  }

  logger.info({ quizId: quiz.id }, "Quiz generated");
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
    return {
      questionId: q.id,
      selectedAnswer: selected,
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const score = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
  const passed = score >= 60;

  await db.insert(quizAttemptsTable).values({
    quizId,
    userId: 1,
    score,
    correctCount,
    totalQuestions: questions.length,
    timeSpent: timeSpent ?? 0,
    answers: JSON.stringify(answers),
  });

  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, quizId));
  if (quiz) {
    const newBest = quiz.bestScore === null ? score : Math.max(quiz.bestScore, score);
    await db.update(quizzesTable).set({ bestScore: newBest, attemptCount: quiz.attemptCount + 1 }).where(eq(quizzesTable.id, quizId));
  }

  res.json({ quizId, score, correctCount, totalQuestions: questions.length, timeSpent: timeSpent ?? 0, passed, questionResults });
});

export default router;
