import { Link } from "wouter";
import { useGetDashboardStats, useGetRecentConversations, useListDocuments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  FileText, MessageSquare, BrainCircuit, Library,
  TrendingUp, Flame, Clock, Plus, ChevronRight,
  Upload, ArrowRight, BookOpen,
} from "lucide-react";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentConvos, isLoading: convosLoading } = useGetRecentConversations();
  const { data: documents, isLoading: docsLoading } = useListDocuments();

  const hasDocuments = (stats?.totalDocuments ?? 0) > 0;
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold" data-testid="text-dashboard-title">
            {greeting()}, {firstName}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {hasDocuments ? "Your learning hub is ready." : "Let's get your study material loaded."}
          </p>
        </div>
        <Link href="/documents">
          <Button className="gap-2" data-testid="button-upload-doc">
            <Plus className="h-4 w-4" />
            Add document
          </Button>
        </Link>
      </div>

      {/* Onboarding — only shown when no documents */}
      {!statsLoading && !hasDocuments && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
          <h2 className="font-serif font-semibold text-lg mb-1">Get started in 3 steps</h2>
          <p className="text-sm text-muted-foreground mb-5">ClarifAI works like NotebookLM — grounded entirely in your own material.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { num: "1", icon: Upload, title: "Upload notes", desc: "Paste lecture notes or any study text. ClarifAI embeds it with Ollama.", href: "/documents" },
              { num: "2", icon: MessageSquare, title: "Chat with it", desc: "Ask questions. Answers are pulled directly from your document.", href: "/chat" },
              { num: "3", icon: BrainCircuit, title: "Quiz & flashcards", desc: "Generate quizzes and flashcards grounded in your actual content.", href: "/quiz-generator" },
            ].map((step) => (
              <Link key={step.num} href={step.href}>
                <div className="bg-background border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                      {step.num}
                    </div>
                    <step.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="font-semibold text-sm mb-1">{step.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{step.desc}</div>
                  <div className="mt-3 text-xs text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Go <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Documents", value: stats?.totalDocuments ?? 0, icon: FileText, href: "/documents", color: "text-primary" },
          { label: "Conversations", value: stats?.totalConversations ?? 0, icon: MessageSquare, href: "/chat", color: "text-blue-500" },
          { label: "Quizzes", value: stats?.totalQuizzes ?? 0, icon: BrainCircuit, href: "/quizzes", color: "text-purple-500" },
          { label: "Flashcard sets", value: stats?.totalFlashcardSets ?? 0, icon: Library, href: "/flashcards", color: "text-amber-500" },
        ].map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`card-stat-${s.label.toLowerCase()}`}>
              <CardContent className="p-4">
                {statsLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <>
                    <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                    <div className="text-2xl font-bold font-serif">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Activity + Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Flame className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold font-serif" data-testid="text-streak">{stats?.studyStreak ?? 0}</div>
            <div className="text-sm text-muted-foreground">Day streak</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <div className="text-2xl font-bold font-serif">
              {stats && stats.averageQuizScore > 0 ? `${Math.round(stats.averageQuizScore)}%` : "—"}
            </div>
            <div className="text-sm text-muted-foreground">Avg quiz score</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-bold font-serif">{stats?.weeklyMessages ?? 0}</div>
            <div className="text-sm text-muted-foreground">Messages this week</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "New chat", href: "/chat", icon: MessageSquare, desc: "Chat with a doc" },
            { label: "Add document", href: "/documents", icon: FileText, desc: "Upload & embed" },
            { label: "Generate quiz", href: "/quiz-generator", icon: BrainCircuit, desc: "AI from your notes" },
            { label: "Flashcard set", href: "/flashcard-generator", icon: Library, desc: "AI from your notes" },
          ].map((a) => (
            <Link key={a.label} href={a.href}>
              <button
                data-testid={`button-quick-${a.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="w-full flex flex-col items-start gap-1 p-3.5 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all text-left group"
              >
                <a.icon className="h-4 w-4 text-primary mb-1" />
                <span className="text-sm font-semibold leading-none">{a.label}</span>
                <span className="text-xs text-muted-foreground">{a.desc}</span>
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Your documents</CardTitle>
            <Link href="/documents">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Manage <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {docsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : !documents?.length ? (
              <div className="text-center py-6">
                <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No documents yet.</p>
                <Link href="/documents">
                  <Button variant="link" size="sm" className="text-primary mt-1 h-auto p-0">
                    Upload your first document →
                  </Button>
                </Link>
              </div>
            ) : (
              documents.slice(0, 4).map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${d.status === "ready" ? "bg-green-500" : "bg-amber-400 animate-pulse"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{d.title}</div>
                    <div className="text-xs text-muted-foreground">{d.chunkCount} chunks · {d.status}</div>
                  </div>
                  {d.topic && <Badge variant="outline" className="text-xs shrink-0">{d.topic}</Badge>}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent conversations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent chats</CardTitle>
            <Link href="/chat">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {convosLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : !recentConvos?.length ? (
              <div className="text-center py-6">
                <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet.</p>
                <Link href="/chat">
                  <Button variant="link" size="sm" className="text-primary mt-1 h-auto p-0">
                    Start a conversation →
                  </Button>
                </Link>
              </div>
            ) : (
              recentConvos.map((c) => (
                <Link key={c.id} href={`/chat/${c.id}`}>
                  <div
                    data-testid={`card-conversation-${c.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{c.title}</div>
                      <div className="text-xs text-muted-foreground">{c.messageCount} messages</div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
