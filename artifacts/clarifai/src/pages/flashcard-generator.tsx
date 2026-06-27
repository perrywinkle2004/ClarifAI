import { useState } from "react";
import { useLocation } from "wouter";
import {
  useGenerateFlashcards,
  useListDocuments,
  getListFlashcardSetsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Library, Sparkles, Loader2 } from "lucide-react";

export default function FlashcardGenerator() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: documents } = useListDocuments();

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [documentId, setDocumentId] = useState<string>("");
  const [cardCount, setCardCount] = useState(10);

  const generateMutation = useGenerateFlashcards();

  const handleGenerate = () => {
    if (!title.trim()) { toast.error("Please enter a title for the flashcard set"); return; }
    generateMutation.mutate(
      {
        data: {
          title: title.trim(),
          topic: topic || undefined,
          documentId: documentId ? Number(documentId) : undefined,
          cardCount,
        },
      },
      {
        onSuccess: (set) => {
          queryClient.invalidateQueries({ queryKey: getListFlashcardSetsQueryKey() });
          toast.success("Flashcard set generated!");
          setLocation(`/flashcards/${set.id}`);
        },
        onError: () => toast.error("Failed to generate flashcards"),
      }
    );
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold">Generate flashcards</h1>
        <p className="text-sm text-muted-foreground mt-1">AI creates question-answer pairs from your study material</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Library className="h-5 w-5 text-amber-500" />
            Flashcard set configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fc-title">Set title *</Label>
            <Input
              id="fc-title"
              data-testid="input-flashcard-title"
              placeholder="e.g. Biology Key Terms"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fc-topic">Topic (optional)</Label>
            <Input
              id="fc-topic"
              data-testid="input-flashcard-topic"
              placeholder="e.g. Cellular Respiration"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          {documents && documents.length > 0 && (
            <div className="space-y-2">
              <Label>Source document (optional)</Label>
              <Select value={documentId} onValueChange={setDocumentId}>
                <SelectTrigger data-testid="select-flashcard-document">
                  <SelectValue placeholder="Use all documents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All documents</SelectItem>
                  {documents.filter((d) => d.status === "ready").map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Number of cards</Label>
              <span className="text-sm font-semibold text-primary" data-testid="text-card-count">{cardCount}</span>
            </div>
            <Slider
              data-testid="slider-card-count"
              min={5}
              max={10}
              step={1}
              value={[cardCount]}
              onValueChange={([v]) => setCardCount(v)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5</span><span>10</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-200">
        <p className="font-medium mb-1">Spaced repetition</p>
        <p className="text-amber-700 dark:text-amber-300">Cards are categorized by difficulty. As you study, mark cards as mastered — the system tracks your progress and focuses on your weak areas.</p>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={generateMutation.isPending || !title.trim()}
        className="w-full gap-2"
        size="lg"
        data-testid="button-generate-flashcards-submit"
      >
        {generateMutation.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Generating flashcards...</>
        ) : (
          <><Sparkles className="h-4 w-4" />Generate {cardCount}-card set</>
        )}
      </Button>
    </div>
  );
}
