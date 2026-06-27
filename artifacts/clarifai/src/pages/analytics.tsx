import {
  useGetDashboardStats,
  useGetLearningActivity,
  useGetQuizPerformance,
  useGetTopTopics,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Target, BookOpen } from "lucide-react";

function MiniBarChart({ data, valueKey }: { data: any[]; valueKey: string }) {
  const max = Math.max(...data.map((d) => d[valueKey] ?? 0), 1);
  return (
    <div className="flex items-end gap-1 h-24 mt-3">
      {data.map((d, i) => {
        const pct = ((d[valueKey] ?? 0) / max) * 100;
        return (
          <div
            key={i}
            className="flex-1 rounded-sm bg-primary/80 transition-all hover:bg-primary"
            style={{ height: `${Math.max(pct, 4)}%` }}
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
    { label: "Total documents", value: stats?.totalDocuments ?? 0, icon: BookOpen, change: "+2 this week" },
    { label: "Conversations", value: stats?.totalConversations ?? 0, icon: BarChart3, change: `${stats?.weeklyMessages ?? 0} messages/week` },
    { label: "Quiz accuracy", value: `${stats ? Math.round(stats.averageQuizScore) : 0}%`, icon: Target, change: "All time average" },
    { label: "Study streak", value: `${stats?.studyStreak ?? 0}d`, icon: TrendingUp, change: "Keep it up!" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Deep insights into your learning patterns</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} data-testid={`kpi-${k.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardContent className="p-4">
              {statsLoading ? (
                <Skeleton className="h-14 w-full" />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <k.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold font-serif">{k.value}</div>
                  <div className="text-xs text-muted-foreground">{k.label}</div>
                  <div className="text-xs text-primary mt-1">{k.change}</div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily messages (14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? <Skeleton className="h-24 w-full" /> : (
              <>
                <MiniBarChart data={recent14Activity} valueKey="messageCount" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{recent14Activity[0]?.date?.slice(5) ?? ""}</span>
                  <span>{recent14Activity[recent14Activity.length - 1]?.date?.slice(5) ?? ""}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quiz performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quiz scores over time</CardTitle>
          </CardHeader>
          <CardContent>
            {quizPerfLoading ? <Skeleton className="h-24 w-full" /> : (
              <>
                <MiniBarChart data={recent14Perf} valueKey="averageScore" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{recent14Perf[0]?.date?.slice(5) ?? "—"}</span>
                  <span>{recent14Perf[recent14Perf.length - 1]?.date?.slice(5) ?? "—"}</span>
                </div>
                {recent14Perf.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Latest avg: <span className="font-medium text-foreground">
                      {Math.round(recent14Perf[recent14Perf.length - 1]?.averageScore ?? 0)}%
                    </span>
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Topic breakdown */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Study topic breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {topicsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (topics ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No topic data yet — upload documents with topics to see analytics.</p>
            ) : (
              <div className="flex gap-3 flex-wrap">
                {(topics ?? []).map((t) => (
                  <div
                    key={t.topic}
                    data-testid={`topic-chip-${t.topic}`}
                    className="flex items-center gap-2 bg-muted px-3 py-2 rounded-full text-sm"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="font-medium">{t.topic}</span>
                    <span className="text-muted-foreground">{t.percentage}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
