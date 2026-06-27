import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MessageSquare, Brain, Sparkles, Upload, ChevronRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-sm">C</div>
            <span className="font-serif font-semibold text-lg">ClarifAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/about">
              <Button variant="ghost" size="sm" data-testid="link-about">About</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm" data-testid="link-login">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" data-testid="link-register">Get started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-xs font-medium">
          Powered by RAG — No hallucinations
        </Badge>
        <h1 className="text-5xl md:text-7xl font-serif font-bold leading-tight tracking-tight mb-6">
          Your AI tutor that{" "}
          <span className="text-primary">actually knows</span>{" "}
          your notes
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload your study material. ClarifAI reads every page, then answers your questions, generates quizzes, and creates flashcards — all grounded strictly in what you uploaded.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="gap-2 px-8 text-base" data-testid="button-hero-cta">
              Start learning free
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="px-8 text-base" data-testid="button-hero-login">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Upload,
              title: "Upload & Index",
              desc: "Drop in PDF, DOCX, or TXT files. ClarifAI chunks them into semantic embeddings and stores them in a vector database — ready for instant retrieval.",
            },
            {
              icon: MessageSquare,
              title: "Chat with your notes",
              desc: "Ask anything. The AI finds the most relevant passages from your documents and builds its answer from them — with source citations so you can verify every claim.",
            },
            {
              icon: Brain,
              title: "Quizzes & Flashcards",
              desc: "Generate adaptive multiple-choice quizzes and spaced-repetition flashcards from your uploaded material with one click.",
            },
          ].map((f) => (
            <div key={f.title} className="bg-card border border-card-border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-serif font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/50 py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">How ClarifAI works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">No subscriptions to AI providers. No hallucinations. Your documents stay on your server.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Upload", desc: "Add your lecture notes, textbooks, or research papers" },
              { step: "02", title: "Embed", desc: "ClarifAI converts your text into semantic vector embeddings via HuggingFace" },
              { step: "03", title: "Retrieve", desc: "ChromaDB finds the most relevant passages for every question" },
              { step: "04", title: "Generate", desc: "A local Ollama LLM crafts accurate answers, quizzes, and cards" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-5xl font-serif font-bold text-primary/20 mb-3">{s.step}</div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">Built for students who take learning seriously</h2>
            <div className="space-y-4">
              {[
                "Zero-hallucination answers grounded in your documents",
                "Source citations with page references for every response",
                "Adaptive quizzes that test exactly what you uploaded",
                "Spaced repetition flashcards with mastery tracking",
                "Full analytics on your study habits and progress",
                "Works offline — local LLM via Ollama, no API costs",
              ].map((v) => (
                <div key={v} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/register">
                <Button className="gap-2" data-testid="button-value-cta">
                  <Sparkles className="h-4 w-4" />
                  Try it for free
                </Button>
              </Link>
            </div>
          </div>
          <div className="bg-card border border-card-border rounded-2xl p-6 font-mono text-sm space-y-3">
            <div className="text-muted-foreground text-xs uppercase tracking-wider mb-4 font-sans">Sample chat</div>
            <div className="bg-muted rounded-lg px-4 py-3 text-sm max-w-xs">What is the role of the hippocampus?</div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-sm ml-4">
              Based on <span className="font-semibold text-primary">Chapter 7 of your notes</span>, the hippocampus plays a critical role in the consolidation of new memories from short-term to long-term storage...
              <div className="mt-2 pt-2 border-t border-primary/10 text-xs text-muted-foreground">
                Source: Cognitive Neuroscience Notes.pdf, p. 47 · Relevance: 94%
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-xs">C</div>
            <span className="font-serif font-semibold text-sm">ClarifAI</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Sign up</Link>
          </div>
          <p className="text-xs text-muted-foreground">Upload · Learn · Master</p>
        </div>
      </footer>
    </div>
  );
}
