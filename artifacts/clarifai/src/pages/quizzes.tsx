import { Link } from "wouter";
import {
  useListQuizzes,
  useDeleteQuiz,
  getListQuizzesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { BrainCircuit, Plus, Trash2, Play, Trophy } from "lucide-react";

const DIFFICULTY_COLORS = {
  easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function Quizzes() {
  const queryClient = useQueryClient();
  const { data: quizzes, isLoading } = useListQuizzes();
  const deleteMutation = useDeleteQuiz();

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
          toast.success("Quiz deleted");
        },
        onError: () => toast.error("Delete failed"),
      }
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Quizzes</h1>
          <p className="text-sm text-muted-foreground mt-1">Test your knowledge with AI-generated quizzes</p>
        </div>
        <Link href="/quiz-generator">
          <Button className="gap-2" data-testid="button-generate-quiz">
            <Plus className="h-4 w-4" />
            Generate quiz
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : quizzes?.length === 0 ? (
        <div className="text-center py-20">
          <BrainCircuit className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-1">No quizzes yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Generate your first quiz from your uploaded documents</p>
          <Link href="/quiz-generator">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Generate a quiz
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes?.map((quiz) => (
            <Link key={quiz.id} href={`/quizzes/${quiz.id}`}>
              <Card
                data-testid={`card-quiz-${quiz.id}`}
                className="cursor-pointer hover:shadow-md transition-all hover-elevate group"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BrainCircuit className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${DIFFICULTY_COLORS[quiz.difficulty as keyof typeof DIFFICULTY_COLORS]}`}>
                        {quiz.difficulty}
                      </span>
                      <button
                        data-testid={`button-delete-quiz-${quiz.id}`}
                        onClick={(e) => handleDelete(e, quiz.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold mb-1 line-clamp-2">{quiz.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span>{quiz.questionCount} questions</span>
                    {quiz.topic && <><span>·</span><span className="text-primary">{quiz.topic}</span></>}
                    <span>·</span><span>{quiz.attemptCount} attempts</span>
                  </div>
                  {quiz.bestScore !== null && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Trophy className="h-3 w-3" />
                          Best score
                        </span>
                        <span className="font-semibold text-primary">{Math.round(quiz.bestScore)}%</span>
                      </div>
                      <Progress value={quiz.bestScore} className="h-1.5" />
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" className="gap-1.5 w-full" variant="secondary">
                      <Play className="h-3.5 w-3.5" />
                      Take quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
