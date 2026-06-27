import { Link } from "wouter";
import { useGetDashboardStats, useGetRecentConversations, useListQuizzes } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { FileText, MessageSquare, BrainCircuit, Library, TrendingUp, Flame, Clock, Plus, ChevronRight } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentConvos, isLoading: convosLoading } = useGetRecentConversations();
  const { data: quizzes, isLoading: quizzesLoading } = useListQuizzes();

  const recentQuizzes = quizzes?.slice(0, 3) ?? [];

  const statCards = [
    { label: "Documents", value: stats?.totalDocuments ?? 0, icon: FileText, href: "/documents", color: "text-primary" },
    { label: "Conversations", value: stats?.totalConversations ?? 0, icon: MessageSquare, href: "/chat", color: "text-blue-500" },
    { label: "Quizzes", value: stats?.totalQuizzes ?? 0, icon: BrainCircuit, href: "/quizzes", color: "text-purple-500" },
    { label: "Flashcard Sets", value: stats?.totalFlashcardSets ?? 0, icon: Library, href: "/flashcards", color: "text-amber-500" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold" data-testid="text-dashboard-title">
            Good morning, {user?.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here's your learning overview</p>
        </div>
        <Link href="/documents">
          <Button className="gap-2" data-testid="button-upload-doc">
            <Plus className="h-4 w-4" />
            Upload document
          </Button>
        </Link>
      </div>

      {/* Streak + Study time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Flame className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold font-serif" data-testid="text-streak">{stats?.studyStreak ?? 0}</div>
            <div className="text-sm text-muted-foreground">Day streak</div>
          </div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <div className="text-2xl font-bold font-serif">{stats ? Math.round(stats.averageQuizScore) : 0}%</div>
            <div className="text-sm text-muted-foreground">Avg quiz score</div>
          </div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Clock className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-bold font-serif">{stats?.weeklyMessages ?? 0}</div>
            <div className="text-sm text-muted-foreground">Messages this week</div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer hover-elevate" data-testid={`card-stat-${s.label.toLowerCase()}`}>
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

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "New chat", href: "/chat", icon: MessageSquare },
          { label: "Upload doc", href: "/documents", icon: FileText },
          { label: "Generate quiz", href: "/quiz-generator", icon: BrainCircuit },
          { label: "Make flashcards", href: "/flashcard-generator", icon: Library },
        ].map((a) => (
          <Link key={a.label} href={a.href}>
            <button
              data-testid={`button-quick-${a.label.toLowerCase().replace(" ", "-")}`}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-sm font-medium"
            >
              <a.icon className="h-4 w-4 text-primary shrink-0" />
              {a.label}
            </button>
          </Link>
        ))}
      </div>

      {/* Recent conversations + quizzes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent conversations</CardTitle>
            <Link href="/chat">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {convosLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : recentConvos?.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No conversations yet.{" "}
                <Link href="/chat" className="text-primary hover:underline">Start one</Link>
              </div>
            ) : (
              recentConvos?.map((c) => (
                <Link key={c.id} href={`/chat/${c.id}`}>
                  <div
                    data-testid={`card-conversation-${c.id}`}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{c.title}</div>
                      <div className="text-xs text-muted-foreground">{c.messageCount} messages</div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent quizzes</CardTitle>
            <Link href="/quizzes">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {quizzesLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : recentQuizzes.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No quizzes yet.{" "}
                <Link href="/quiz-generator" className="text-primary hover:underline">Generate one</Link>
              </div>
            ) : (
              recentQuizzes.map((q) => (
                <Link key={q.id} href={`/quizzes/${q.id}`}>
                  <div
                    data-testid={`card-quiz-${q.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <BrainCircuit className="h-4 w-4 text-purple-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{q.title}</div>
                      <div className="text-xs text-muted-foreground">{q.questionCount} questions</div>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize shrink-0">{q.difficulty}</Badge>
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
