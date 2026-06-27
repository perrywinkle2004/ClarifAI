import { useState } from "react";
import { useLocation } from "wouter";
import {
  useGenerateQuiz,
  useListDocuments,
  getListQuizzesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { BrainCircuit, Sparkles, Loader2 } from "lucide-react";
import type { QuizGenerationInputDifficulty } from "@workspace/api-client-react";

export default function QuizGenerator() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: documents } = useListDocuments();

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [documentId, setDocumentId] = useState<string>("");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<QuizGenerationInputDifficulty>("medium");

  const generateMutation = useGenerateQuiz();

  const handleGenerate = () => {
    if (!title.trim()) { toast.error("Please enter a quiz title"); return; }
    generateMutation.mutate(
      {
        data: {
          title: title.trim(),
          topic: topic || undefined,
          documentId: documentId ? Number(documentId) : undefined,
          questionCount,
          difficulty,
        },
      },
      {
        onSuccess: (quiz) => {
          queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
          toast.success("Quiz generated!");
          setLocation(`/quizzes/${quiz.id}`);
        },
        onError: () => toast.error("Failed to generate quiz"),
      }
    );
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold">Generate a quiz</h1>
        <p className="text-sm text-muted-foreground mt-1">AI will create multiple-choice questions from your documents</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BrainCircuit className="h-5 w-5 text-primary" />
            Quiz configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="quiz-title">Quiz title *</Label>
            <Input
              id="quiz-title"
              data-testid="input-quiz-title"
              placeholder="e.g. Cell Biology Chapter 3 Quiz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quiz-topic">Topic (optional)</Label>
            <Input
              id="quiz-topic"
              data-testid="input-quiz-topic"
              placeholder="e.g. Mitosis and Meiosis"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          {documents && documents.length > 0 && (
            <div className="space-y-2">
              <Label>Source document (optional)</Label>
              <Select value={documentId} onValueChange={setDocumentId}>
                <SelectTrigger data-testid="select-quiz-document">
                  <SelectValue placeholder="Generate from all documents" />
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
              <Label>Number of questions</Label>
              <span className="text-sm font-semibold text-primary" data-testid="text-question-count">{questionCount}</span>
            </div>
            <Slider
              data-testid="slider-question-count"
              min={3}
              max={8}
              step={1}
              value={[questionCount]}
              onValueChange={([v]) => setQuestionCount(v)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>3</span><span>8</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d}
                  data-testid={`button-difficulty-${d}`}
                  onClick={() => setDifficulty(d)}
                  className={`py-2 rounded-lg border text-sm font-medium capitalize transition-all ${difficulty === d ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 border border-border rounded-xl p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">How it works</p>
        <p>ClarifAI retrieves the most relevant passages from your documents using semantic search, then generates contextually accurate questions grounded strictly in your study material.</p>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={generateMutation.isPending || !title.trim()}
        className="w-full gap-2"
        size="lg"
        data-testid="button-generate-quiz-submit"
      >
        {generateMutation.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Generating quiz...</>
        ) : (
          <><Sparkles className="h-4 w-4" />Generate {questionCount}-question quiz</>
        )}
      </Button>
    </div>
  );
}
