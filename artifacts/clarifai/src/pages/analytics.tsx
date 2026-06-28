import {
  useGetDashboardStats,
  useGetLearningActivity,
  useGetQuizPerformance,
  useGetTopTopics,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Target, BookOpen, Flame } from "lucide-react";

function MiniBarChart({ data, valueKey, color = "bg-primary" }: { data: any[]; valueKey: string; color?: string }) {
  const max = Math.max(...data.map((d) => d[valueKey] ?? 0), 1);
  const hasData = data.some((d) => (d[valueKey] ?? 0) > 0);
  if (!hasData) {
    return (
      <div className="h-24 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">No data yet</p>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-0.5 h-24 mt-3">
      {data.map((d, i) => {
        const pct = ((d[valueKey] ?? 0) / max) * 100;
        return (
          <div
            key={i}
            className={`flex-1 rounded-sm ${color} transition-all hover:opacity-80`}
            style={{ height: `${Math.max(pct, pct > 0 ? 8 : 0)}%`, minHeight: pct > 0 ? "4px" : "0" }}
            title={`${d.date}: ${Math.round(d[valueKey] ?? 0)}`}
          />
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetLearningActivity();
  const { data: quizPerf, isLoading: quizPerfLoading } = useGetQuizPerformance();
  const { data: topics, isLoading: topicsLoading } = useGetTopTopics();

  const recent14Activity = (activity ?? []).slice(-14);
  const recent14Perf = (quizPerf ?? []).slice(-14);

  const kpis = [
    {
      label: "Documents",
      value: stats?.totalDocuments ?? 0,
      icon: BookOpen,
      sub: stats?.totalDocuments === 1 ? "1 document uploaded" : `${stats?.totalDocuments ?? 0} documents uploaded`,
    },
    {
      label: "Messages this week",
      value: stats?.weeklyMessages ?? 0,
      icon: BarChart3,
      sub: `${stats?.totalConversations ?? 0} total conversations`,
    },
    {
      label: "Quiz accuracy",
      value: stats && stats.averageQuizScore > 0 ? `${Math.round(stats.averageQuizScore)}%` : "—",
      icon: Target,
      sub: stats && stats.averageQuizScore > 0 ? "All-time average" : "No quizzes yet",
    },
    {
      label: "Study streak",
      value: `${stats?.studyStreak ?? 0}d`,
      icon: Flame,
      sub: stats?.studyStreak ? "Consecutive active days" : "Start chatting to build a streak",
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Your real learning activity</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} data-testid={`kpi-${k.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardContent className="p-4">
              {statsLoading ? (
                <Skeleton className="h-14 w-full" />
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <k.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold font-serif">{k.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
                  <div className="text-xs text-primary mt-1">{k.sub}</div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Messages per day (14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <MiniBarChart data={recent14Activity} valueKey="messageCount" color="bg-primary/80" />
                {recent14Activity.some((d) => d.messageCount > 0) && (
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{recent14Activity[0]?.date?.slice(5) ?? ""}</span>
                    <span>{recent14Activity[recent14Activity.length - 1]?.date?.slice(5) ?? "today"}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quiz scores over time</CardTitle>
          </CardHeader>
          <CardContent>
            {quizPerfLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : recent14Perf.length === 0 ? (
              <div className="h-24 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">No quiz attempts yet — generate a quiz to get started</p>
              </div>
            ) : (
              <>
                <MiniBarChart data={recent14Perf} valueKey="averageScore" color="bg-purple-500/80" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{recent14Perf[0]?.date?.slice(5) ?? "—"}</span>
                  <span>
                    Latest: <span className="font-medium text-foreground">
                      {Math.round(recent14Perf[recent14Perf.length - 1]?.averageScore ?? 0)}%
                    </span>
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Topics from your documents</CardTitle>
          </CardHeader>
          <CardContent>
            {topicsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (topics ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No topics yet — add a topic when uploading documents to see your breakdown here.
              </p>
            ) : (
              <div className="space-y-3">
                {(topics ?? []).map((t, i) => {
                  const colors = ["bg-primary", "bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-green-500"];
                  const color = colors[i % colors.length];
                  return (
                    <div key={t.topic} data-testid={`topic-chip-${t.topic}`}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                          <span className="font-medium">{t.topic}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">{t.count} docs · {t.percentage}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${t.percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
