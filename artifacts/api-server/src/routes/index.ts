import { Router, type IRouter } from "express";
import healthRouter from "./health";
import documentsRouter from "./documents";
import conversationsRouter from "./conversations";
import quizzesRouter from "./quizzes";
import flashcardsRouter from "./flashcards";
import analyticsRouter from "./analytics";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/documents", documentsRouter);
router.use("/conversations", conversationsRouter);
router.use("/quizzes", quizzesRouter);
router.use("/flashcard-sets", flashcardsRouter);
router.use("/analytics", analyticsRouter);
router.use("/users", usersRouter);

export default router;
