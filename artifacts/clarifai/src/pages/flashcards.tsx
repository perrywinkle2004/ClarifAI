import { Link } from "wouter";
import {
  useListFlashcardSets,
  useDeleteFlashcardSet,
  getListFlashcardSetsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Library, Plus, Trash2, BookOpen } from "lucide-react";

export default function Flashcards() {
  const queryClient = useQueryClient();
  const { data: sets, isLoading } = useListFlashcardSets();
  const deleteMutation = useDeleteFlashcardSet();

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFlashcardSetsQueryKey() });
          toast.success("Flashcard set deleted");
        },
        onError: () => toast.error("Delete failed"),
      }
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Flashcards</h1>
          <p className="text-sm text-muted-foreground mt-1">Study with spaced-repetition flashcard sets</p>
        </div>
        <Link href="/flashcard-generator">
          <Button className="gap-2" data-testid="button-generate-flashcards">
            <Plus className="h-4 w-4" />
            Generate set
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : sets?.length === 0 ? (
        <div className="text-center py-20">
          <Library className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-1">No flashcard sets yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Generate flashcards from your uploaded documents</p>
          <Link href="/flashcard-generator">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create a set
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets?.map((set) => {
            const pct = set.cardCount > 0 ? (set.masteredCount / set.cardCount) * 100 : 0;
            return (
              <Link key={set.id} href={`/flashcards/${set.id}`}>
                <Card
                  data-testid={`card-flashcard-set-${set.id}`}
                  className="cursor-pointer hover:shadow-md transition-all hover-elevate group"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Library className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <button
                        data-testid={`button-delete-flashcard-set-${set.id}`}
                        onClick={(e) => handleDelete(e, set.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <h3 className="font-semibold mb-1 line-clamp-2">{set.title}</h3>
                    <div className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                      <span>{set.cardCount} cards</span>
                      {set.topic && <><span>·</span><span className="text-amber-600 dark:text-amber-400">{set.topic}</span></>}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Mastered</span>
                        <span className="font-medium">{set.masteredCount}/{set.cardCount}</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                    <Button size="sm" variant="secondary" className="w-full mt-3 gap-2">
                      <BookOpen className="h-3.5 w-3.5" />
                      Study set
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
