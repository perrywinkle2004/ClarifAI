import { Router } from "express";
import { db } from "@workspace/db";
import { documentsTable, conversationsTable, messagesTable, quizzesTable, quizAttemptsTable, flashcardSetsTable } from "@workspace/db";
import { eq, sql, gte, and } from "drizzle-orm";

const router = Router();

router.get("/dashboard", async (_req, res) => {
  const [docs, convos, quizzes, flashSets, attempts] = await Promise.all([
    db.select().from(documentsTable).where(eq(documentsTable.userId, 1)),
    db.select().from(conversationsTable).where(eq(conversationsTable.userId, 1)),
    db.select().from(quizzesTable).where(eq(quizzesTable.userId, 1)),
    db.select().from(flashcardSetsTable).where(eq(flashcardSetsTable.userId, 1)),
    db.select().from(quizAttemptsTable).where(eq(quizAttemptsTable.userId, 1)),
  ]);

  const avgScore = attempts.length > 0
    ? attempts.reduce((s, a) => s + a.score, 0) / attempts.length
    : 0;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentMsgs = await db.select({ count: sql<number>`count(*)` })
    .from(messagesTable)
    .innerJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
    .where(and(eq(conversationsTable.userId, 1), gte(messagesTable.createdAt, sevenDaysAgo)));
  const weeklyMessages = Number(recentMsgs[0]?.count ?? 0);

  const msgDates = await db.selectDistinct({
    date: sql<string>`DATE(${messagesTable.createdAt} AT TIME ZONE 'UTC')`,
  }).from(messagesTable)
    .innerJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
    .where(eq(conversationsTable.userId, 1));

  const dateSet = new Set(msgDates.map((r) => r.date));
  let studyStreak = 0;
  let day = new Date();
  for (let i = 0; i < 365; i++) {
    const d = day.toISOString().split("T")[0];
    if (dateSet.has(d)) {
      studyStreak++;
      day = new Date(day.getTime() - 86400000);
    } else if (i === 0) {
      day = new Date(day.getTime() - 86400000);
    } else {
      break;
    }
  }

  const totalStudyTime = attempts.reduce((s, a) => s + (a.timeSpent ?? 0), 0);

  res.json({
    totalDocuments: docs.length,
    totalConversations: convos.length,
    totalQuizzes: quizzes.length,
    totalFlashcardSets: flashSets.length,
    averageQuizScore: Math.round(avgScore * 10) / 10,
    studyStreak,
    totalStudyTime,
    weeklyMessages,
  });
});

router.get("/activity", async (_req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [msgRows, quizRows] = await Promise.all([
    db.select({
      date: sql<string>`DATE(${messagesTable.createdAt} AT TIME ZONE 'UTC')`,
      count: sql<number>`COUNT(*)`,
    }).from(messagesTable)
      .innerJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
      .where(and(eq(conversationsTable.userId, 1), gte(messagesTable.createdAt, thirtyDaysAgo)))
      .groupBy(sql`DATE(${messagesTable.createdAt} AT TIME ZONE 'UTC')`),
    db.select({
      date: sql<string>`DATE(${quizAttemptsTable.createdAt} AT TIME ZONE 'UTC')`,
      count: sql<number>`COUNT(*)`,
    }).from(quizAttemptsTable)
      .where(and(eq(quizAttemptsTable.userId, 1), gte(quizAttemptsTable.createdAt, thirtyDaysAgo)))
      .groupBy(sql`DATE(${quizAttemptsTable.createdAt} AT TIME ZONE 'UTC')`),
  ]);

  const msgMap = new Map(msgRows.map((r) => [r.date, Number(r.count)]));
  const quizMap = new Map(quizRows.map((r) => [r.date, Number(r.count)]));

  const activity = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    activity.push({
      date,
      messageCount: msgMap.get(date) ?? 0,
      quizCount: quizMap.get(date) ?? 0,
      flashcardCount: 0,
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
    return res.json([]);
  }
  const total = Object.values(topicCounts).reduce((s, v) => s + v, 0);
  res.json(
    Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => ({ topic, count, percentage: Math.round((count / total) * 100) }))
  );
});

router.get("/quiz-performance", async (_req, res) => {
  const attempts = await db.select().from(quizAttemptsTable).where(eq(quizAttemptsTable.userId, 1));
  if (attempts.length === 0) return res.json([]);
  const byDate: Record<string, number[]> = {};
  for (const a of attempts) {
    const d = a.createdAt.toISOString().split("T")[0];
    byDate[d] = [...(byDate[d] ?? []), a.score];
  }
  res.json(
    Object.entries(byDate).sort().map(([date, scores]) => ({
      date,
      averageScore: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
      attemptCount: scores.length,
    }))
  );
});

export default router;
