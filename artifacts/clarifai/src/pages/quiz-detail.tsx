import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetQuiz,
  useSubmitQuizAttempt,
  getListQuizzesQueryKey,
  getGetQuizQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, ChevronRight, ChevronLeft, CheckCircle2, XCircle, Trophy, Clock } from "lucide-react";

type QuizState = "intro" | "taking" | "results";

export default function QuizDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const quizId = Number(id);
  const { data: quiz, isLoading } = useGetQuiz(quizId, {
    query: { enabled: !!quizId, queryKey: getGetQuizQueryKey(quizId) },
  });

  const submitMutation = useSubmitQuizAttempt();

  const [state, setState] = useState<QuizState>("intro");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<any>(null);

  const handleStart = () => {
    setAnswers([]);
    setCurrentIdx(0);
    setStartTime(Date.now());
    setState("taking");
  };

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIdx] = optionIdx;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIdx < (quiz?.questions.length ?? 0) - 1) {
      setCurrentIdx((p) => p + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx((p) => p - 1);
  };

  const handleSubmit = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const paddedAnswers = quiz?.questions.map((_, i) => answers[i] ?? -1) ?? [];
    submitMutation.mutate(
      { id: quizId, data: { answers: paddedAnswers, timeSpent } },
      {
        onSuccess: (r) => {
          setResult(r);
          setState("results");
          queryClient.invalidateQueries({ queryKey: getGetQuizQueryKey(quizId) });
          queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
        },
        onError: () => toast.error("Failed to submit quiz"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">Quiz not found</p>
          <Button className="mt-4" onClick={() => setLocation("/quizzes")}>Back to quizzes</Button>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentIdx];
  const answeredCount = answers.filter((a) => a !== undefined).length;
  const progress = (answeredCount / quiz.questions.length) * 100;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/quizzes")} data-testid="button-back-quizzes">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-serif font-bold">{quiz.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="secondary" className="text-xs capitalize">{quiz.difficulty}</Badge>
            {quiz.topic && <Badge variant="outline" className="text-xs">{quiz.topic}</Badge>}
            <span className="text-xs text-muted-foreground">{quiz.questions.length} questions</span>
          </div>
        </div>
      </div>

      {state === "intro" && (
        <div className="bg-card border border-card-border rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-serif font-bold">Ready to test yourself?</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            {quiz.questions.length} multiple-choice questions. You can navigate back and forth. Submit when you're done.
          </p>
          <div className="grid grid-cols-3 gap-4 text-center max-w-sm mx-auto">
            {[
              { label: "Questions", value: quiz.questions.length },
              { label: "Difficulty", value: quiz.difficulty },
              { label: "Best score", value: (quiz as any).bestScore != null ? `${Math.round((quiz as any).bestScore)}%` : "—" },
            ].map((s) => (
              <div key={s.label} className="bg-muted rounded-lg p-3">
                <div className="font-bold capitalize">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
          <Button size="lg" onClick={handleStart} className="gap-2 px-8" data-testid="button-start-quiz">
            Start quiz
          </Button>
        </div>
      )}

      {state === "taking" && currentQ && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Question {currentIdx + 1} of {quiz.questions.length}</span>
            <span>{answeredCount} answered</span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="bg-card border border-card-border rounded-2xl p-6 space-y-5">
            <h3 className="text-lg font-semibold leading-snug" data-testid="text-quiz-question">{currentQ.question}</h3>
            <div className="space-y-2">
              {currentQ.options.map((opt, i) => (
                <button
                  key={i}
                  data-testid={`button-option-${i}`}
                  onClick={() => handleAnswer(i)}
                  className={`w-full text-left p-4 rounded-xl border transition-all text-sm ${answers[currentIdx] === i
                    ? "border-primary bg-primary/10 text-foreground font-medium"
                    : "border-border bg-background hover:border-primary/50 hover:bg-muted/50"}`}
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs border mr-3 font-mono">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handlePrev} disabled={currentIdx === 0} className="gap-2">
              <ChevronLeft className="h-4 w-4" />Prev
            </Button>
            <div className="flex gap-2">
              {currentIdx < quiz.questions.length - 1 ? (
                <Button onClick={handleNext} className="gap-2" data-testid="button-next-question">
                  Next<ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="gap-2 px-6"
                  data-testid="button-submit-quiz"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit quiz"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {state === "results" && result && (
        <div className="space-y-4">
          <div className={`rounded-2xl p-6 text-center ${result.passed ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800" : "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"}`}>
            <div className="text-5xl font-bold font-serif mb-1">{Math.round(result.score)}%</div>
            <div className={`text-sm font-medium ${result.passed ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
              {result.passed ? "Passed!" : "Not passed — keep studying!"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {result.correctCount}/{result.totalQuestions} correct · {Math.floor(result.timeSpent / 60)}:{String(result.timeSpent % 60).padStart(2, "0")} spent
            </div>
          </div>

          <h3 className="font-semibold text-sm">Question review</h3>
          <div className="space-y-3">
            {quiz.questions.map((q, i) => {
              const qr = result.questionResults[i];
              return (
                <div key={q.id} data-testid={`result-question-${q.id}`} className="bg-card border border-card-border rounded-xl p-4">
                  <div className="flex items-start gap-2 mb-2">
                    {qr?.isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <p className="text-sm font-medium">{q.question}</p>
                  </div>
                  <div className="ml-6 space-y-1 text-xs text-muted-foreground">
                    <p>Your answer: <span className={qr?.isCorrect ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                      {qr?.selectedAnswer >= 0 ? q.options[qr.selectedAnswer] : "Not answered"}
                    </span></p>
                    {!qr?.isCorrect && <p>Correct: <span className="text-green-600 dark:text-green-400 font-medium">{q.options[q.correctAnswer]}</span></p>}
                    {q.explanation && <p className="mt-1 text-muted-foreground italic">{q.explanation}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleStart} className="flex-1">Retake quiz</Button>
            <Button onClick={() => setLocation("/quizzes")} className="flex-1">Back to quizzes</Button>
          </div>
        </div>
      )}
    </div>
  );
}
