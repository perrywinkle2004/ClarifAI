import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetFlashcardSet,
  useUpdateFlashcardProgress,
  getListFlashcardSetsQueryKey,
  getGetFlashcardSetQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, Eye } from "lucide-react";
import type { Flashcard } from "@workspace/api-client-react";

function FlashcardView({
  card,
  isFlipped,
  onFlip,
  isMastered,
}: {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
  isMastered: boolean;
}) {
  return (
    <div className="relative" style={{ perspective: "1000px" }}>
      <div
        onClick={onFlip}
        data-testid="button-flip-card"
        className="cursor-pointer select-none"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.5s",
          minHeight: "220px",
          position: "relative",
        }}
      >
        {/* Front */}
        <div
          className={`absolute inset-0 bg-card border-2 ${isMastered ? "border-green-400" : "border-card-border"} rounded-2xl p-8 flex flex-col items-center justify-center text-center`}
          style={{ backfaceVisibility: "hidden" }}
        >
          {isMastered && <Badge className="absolute top-3 right-3 bg-green-500 text-white text-xs">Mastered</Badge>}
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">Question</p>
          <p className="text-lg font-semibold leading-snug">{card.front}</p>
          <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
            <Eye className="h-3 w-3" />Click to reveal
          </p>
        </div>
        {/* Back */}
        <div
          className={`absolute inset-0 bg-primary/5 border-2 ${isMastered ? "border-green-400" : "border-primary/30"} rounded-2xl p-8 flex flex-col items-center justify-center text-center`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-xs text-primary uppercase tracking-wider mb-3 font-medium">Answer</p>
          <p className="text-sm text-foreground leading-relaxed">{card.back}</p>
        </div>
      </div>
    </div>
  );
}

export default function FlashcardDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const setId = Number(id);
  const { data: set, isLoading } = useGetFlashcardSet(setId, {
    query: { enabled: !!setId, queryKey: getGetFlashcardSetQueryKey(setId) },
  });

  const updateProgressMutation = useUpdateFlashcardProgress();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<number>>(new Set());
  const [studyMode, setStudyMode] = useState<"study" | "done">("study");

  const cards = set?.cards ?? [];
  const currentCard = cards[currentIdx];
  const progress = cards.length > 0 ? ((currentIdx + 1) / cards.length) * 100 : 0;

  const handleFlip = () => setIsFlipped((f) => !f);

  const handleNav = (dir: -1 | 1) => {
    setIsFlipped(false);
    setCurrentIdx((i) => Math.max(0, Math.min(cards.length - 1, i + dir)));
  };

  const handleMastered = () => {
    if (!currentCard) return;
    const newSet = new Set(masteredIds);
    if (newSet.has(currentCard.id)) {
      newSet.delete(currentCard.id);
    } else {
      newSet.add(currentCard.id);
    }
    setMasteredIds(newSet);
    if (currentIdx < cards.length - 1) {
      setIsFlipped(false);
      setCurrentIdx((i) => i + 1);
    } else {
      setStudyMode("done");
    }
  };

  const handleSaveProgress = () => {
    updateProgressMutation.mutate(
      { id: setId, data: { masteredCardIds: Array.from(masteredIds) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetFlashcardSetQueryKey(setId) });
          queryClient.invalidateQueries({ queryKey: getListFlashcardSetsQueryKey() });
          toast.success("Progress saved!");
          setLocation("/flashcards");
        },
        onError: () => toast.error("Failed to save progress"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (!set) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">Flashcard set not found</p>
          <Button className="mt-4" onClick={() => setLocation("/flashcards")}>Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/flashcards")} data-testid="button-back-flashcards">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-serif font-bold">{set.title}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{set.cards.length} cards</span>
            {set.topic && <><span>·</span><span>{set.topic}</span></>}
          </div>
        </div>
      </div>

      {studyMode === "done" ? (
        <div className="bg-card border border-card-border rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-serif font-bold">Set complete!</h2>
          <p className="text-muted-foreground text-sm">You marked {masteredIds.size} of {cards.length} cards as mastered</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => { setCurrentIdx(0); setIsFlipped(false); setStudyMode("study"); }} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Study again
            </Button>
            <Button onClick={handleSaveProgress} disabled={updateProgressMutation.isPending} className="gap-2">
              {updateProgressMutation.isPending ? "Saving..." : "Save & finish"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Card {currentIdx + 1} of {cards.length}</span>
            <span className="text-green-600 font-medium">{masteredIds.size} mastered</span>
          </div>
          <Progress value={progress} className="h-1.5" />

          {currentCard && (
            <FlashcardView
              card={currentCard}
              isFlipped={isFlipped}
              onFlip={handleFlip}
              isMastered={masteredIds.has(currentCard.id)}
            />
          )}

          <div className="grid grid-cols-3 gap-3">
            <Button variant="outline" onClick={() => handleNav(-1)} disabled={currentIdx === 0} className="gap-2">
              <ChevronLeft className="h-4 w-4" />Prev
            </Button>
            <Button
              data-testid="button-mark-mastered"
              onClick={handleMastered}
              variant={masteredIds.has(currentCard?.id ?? -1) ? "secondary" : "default"}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {masteredIds.has(currentCard?.id ?? -1) ? "Unmark" : "Got it"}
            </Button>
            <Button variant="outline" onClick={() => handleNav(1)} disabled={currentIdx === cards.length - 1} className="gap-2">
              Next<ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
