import {
  useGetLearningActivity,
  useGetTopTopics,
  useGetDashboardStats,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Flame, BookOpen, BrainCircuit, Library, TrendingUp } from "lucide-react";

function ActivityBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div
      title={`${value} activities`}
      className={`w-3 rounded-sm transition-all ${pct === 0 ? "bg-muted" : pct < 30 ? "bg-primary/30" : pct < 60 ? "bg-primary/60" : "bg-primary"}`}
      style={{ height: "100%", maxHeight: "40px", minHeight: "4px" }}
    />
  );
}

export default function Progress() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetLearningActivity();
  const { data: topics, isLoading: topicsLoading } = useGetTopTopics();

  const activityMax = activity
    ? Math.max(...activity.map((a) => a.messageCount + a.quizCount + a.flashcardCount), 1)
    : 1;

  const summaryStats = [
    { label: "Study streak", value: `${stats?.studyStreak ?? 0} days`, icon: Flame, color: "text-orange-500" },
    { label: "Documents uploaded", value: stats?.totalDocuments ?? 0, icon: BookOpen, color: "text-primary" },
    { label: "Quizzes completed", value: stats?.totalQuizzes ?? 0, icon: BrainCircuit, color: "text-purple-500" },
    { label: "Flashcard sets", value: stats?.totalFlashcardSets ?? 0, icon: Library, color: "text-amber-500" },
    { label: "Avg quiz score", value: `${stats ? Math.round(stats.averageQuizScore) : 0}%`, icon: TrendingUp, color: "text-green-500" },
    { label: "Weekly messages", value: stats?.weeklyMessages ?? 0, icon: BookOpen, color: "text-blue-500" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold">Progress</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your learning journey</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {summaryStats.map((s) => (
          <Card key={s.label} data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardContent className="p-4 flex items-center gap-3">
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <div className="font-bold font-serif text-xl">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity — Last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="flex items-end gap-1 h-12">
              {(activity ?? []).map((a, i) => (
                <div key={i} className="flex-1 h-full flex items-end">
                  <ActivityBar
                    value={a.messageCount + a.quizCount + a.flashcardCount}
                    max={activityMax}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-muted" />No activity</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary/30" />Light</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary/60" />Medium</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary" />High</span>
          </div>
        </CardContent>
      </Card>

      {/* Top topics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top topics studied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topicsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
          ) : (topics ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Upload documents with topics to see your breakdown
            </p>
          ) : (
            (topics ?? []).map((t) => (
              <div key={t.topic} data-testid={`topic-bar-${t.topic}`}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{t.topic}</span>
                  <span className="text-muted-foreground">{t.count} docs · {t.percentage}%</span>
                </div>
                <ProgressBar value={t.percentage} className="h-2" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
