import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Shield, Zap, Brain, Code2, Server, ChevronRight } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-sm">C</div>
              <span className="font-serif font-semibold text-lg">ClarifAI</span>
            </div>
          </Link>
          <div className="flex gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link href="/register"><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
        {/* Hero */}
        <div className="text-center">
          <Badge variant="secondary" className="mb-6">Open-source — No API costs</Badge>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">The AI tutor that never makes things up</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            ClarifAI uses Retrieval-Augmented Generation (RAG) to ground every answer strictly in documents you upload. No hallucinations. No phantom citations. Just accurate, verifiable answers from your own study material.
          </p>
        </div>

        {/* Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Shield,
              title: "Zero hallucinations",
              desc: "Every answer is retrieved from your documents first, then generated. If the information isn't in your notes, ClarifAI says so — it never invents facts.",
            },
            {
              icon: Zap,
              title: "Local-first AI",
              desc: "Powered by Ollama (runs your LLM locally), HuggingFace sentence-transformers for embeddings, and ChromaDB for vector storage. No external API subscriptions required.",
            },
            {
              icon: BookOpen,
              title: "Your material, only",
              desc: "ClarifAI indexes only the documents you upload. Your quizzes, flashcards, and chat sessions are all derived strictly from your own study material.",
            },
          ].map((p) => (
            <div key={p.title} className="bg-card border border-card-border rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <p.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold font-serif text-lg mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Tech stack */}
        <div>
          <h2 className="text-2xl font-serif font-bold mb-8 text-center">Technology stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: Brain,
                title: "RAG pipeline",
                items: ["Ollama — local LLM inference", "HuggingFace sentence-transformers", "ChromaDB — vector store", "Cosine similarity search"],
              },
              {
                icon: Code2,
                title: "Frontend",
                items: ["React 18 + TypeScript", "Tailwind CSS + shadcn/ui", "React Query for data fetching", "Wouter for routing"],
              },
              {
                icon: Server,
                title: "Backend",
                items: ["Node.js + Express 5", "PostgreSQL + Drizzle ORM", "OpenAPI 3.0 spec + codegen", "RESTful JSON API"],
              },
              {
                icon: Shield,
                title: "Privacy & security",
                items: ["All LLM inference runs locally", "Your documents never leave your server", "No external AI API calls", "Session-based auth"],
              },
            ].map((s) => (
              <div key={s.title} className="bg-card border border-card-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <s.icon className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{s.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {s.items.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary/60 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-card border border-card-border rounded-2xl p-10">
          <h2 className="text-2xl font-serif font-bold mb-3">Ready to learn smarter?</h2>
          <p className="text-muted-foreground mb-6 text-sm">Upload your first document and start chatting with your notes in under a minute.</p>
          <Link href="/register">
            <Button size="lg" className="gap-2 px-8">
              Get started free
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
