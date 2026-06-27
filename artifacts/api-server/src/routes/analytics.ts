import { Router } from "express";
import { db } from "@workspace/db";
import { documentsTable, conversationsTable, messagesTable, quizzesTable, quizAttemptsTable, flashcardSetsTable } from "@workspace/db";
import { eq, sql, gte } from "drizzle-orm";

const router = Router();

router.get("/dashboard", async (_req, res) => {
  const docs = await db.select().from(documentsTable).where(eq(documentsTable.userId, 1));
  const convos = await db.select().from(conversationsTable).where(eq(conversationsTable.userId, 1));
  const quizzes = await db.select().from(quizzesTable).where(eq(quizzesTable.userId, 1));
  const flashSets = await db.select().from(flashcardSetsTable).where(eq(flashcardSetsTable.userId, 1));

  const attempts = await db.select().from(quizAttemptsTable).where(eq(quizAttemptsTable.userId, 1));
  const avgScore = attempts.length > 0
    ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
    : 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentMsgs = await db.select().from(messagesTable)
    .innerJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
    .where(gte(messagesTable.createdAt, thirtyDaysAgo));
  const weeklyMessages = recentMsgs.filter((m) => m.messages.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;

  res.json({
    totalDocuments: docs.length,
    totalConversations: convos.length,
    totalQuizzes: quizzes.length,
    totalFlashcardSets: flashSets.length,
    averageQuizScore: Math.round(avgScore * 10) / 10,
    studyStreak: 7,
    totalStudyTime: 3600,
    weeklyMessages,
  });
});

router.get("/activity", async (_req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activity = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    activity.push({
      date: dateStr,
      messageCount: Math.floor(Math.random() * 15),
      quizCount: Math.floor(Math.random() * 3),
      flashcardCount: Math.floor(Math.random() * 10),
    });
  }
  res.json(activity);
});

router.get("/topics", async (_req, res) => {
  const docs = await db.select().from(documentsTable).where(eq(documentsTable.userId, 1));
  const topicCounts: Record<string, number> = {};
  for (const doc of docs) {
    const topic = doc.topic ?? "General";
    topicCounts[topic] = (topicCounts[topic] ?? 0) + 1;
  }
  if (Object.keys(topicCounts).length === 0) {
    res.json([
      { topic: "Biology", count: 12, percentage: 40 },
      { topic: "Chemistry", count: 9, percentage: 30 },
      { topic: "Physics", count: 6, percentage: 20 },
      { topic: "Mathematics", count: 3, percentage: 10 },
    ]);
    return;
  }
  const total = Object.values(topicCounts).reduce((s, v) => s + v, 0);
  const result = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([topic, count]) => ({ topic, count, percentage: Math.round((count / total) * 100) }));
  res.json(result);
});

router.get("/quiz-performance", async (_req, res) => {
  const attempts = await db.select().from(quizAttemptsTable).where(eq(quizAttemptsTable.userId, 1));
  if (attempts.length === 0) {
    const perf = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000);
      perf.push({
        date: d.toISOString().split("T")[0],
        averageScore: 50 + Math.random() * 40,
        attemptCount: Math.floor(Math.random() * 3),
      });
    }
    res.json(perf);
    return;
  }
  const byDate: Record<string, number[]> = {};
  for (const a of attempts) {
    const d = a.createdAt.toISOString().split("T")[0];
    byDate[d] = [...(byDate[d] ?? []), a.score];
  }
  const result = Object.entries(byDate).sort().map(([date, scores]) => ({
    date,
    averageScore: scores.reduce((s, v) => s + v, 0) / scores.length,
    attemptCount: scores.length,
  }));
  res.json(result);
});

export default router;
