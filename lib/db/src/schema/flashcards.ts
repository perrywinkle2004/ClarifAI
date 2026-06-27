import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const flashcardSetsTable = pgTable("flashcard_sets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  documentId: integer("document_id"),
  title: text("title").notNull(),
  topic: text("topic"),
  cardCount: integer("card_count").notNull().default(0),
  studiedCount: integer("studied_count").notNull().default(0),
  masteredCount: integer("mastered_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const flashcardsTable = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  setId: integer("set_id").notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  mastered: boolean("mastered").notNull().default(false),
  difficulty: text("difficulty"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFlashcardSetSchema = createInsertSchema(flashcardSetsTable).omit({ id: true, createdAt: true });
export const insertFlashcardSchema = createInsertSchema(flashcardsTable).omit({ id: true, createdAt: true });
export type InsertFlashcardSet = z.infer<typeof insertFlashcardSetSchema>;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type FlashcardSet = typeof flashcardSetsTable.$inferSelect;
export type Flashcard = typeof flashcardsTable.$inferSelect;
