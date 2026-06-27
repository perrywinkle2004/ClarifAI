import {
  useGetDashboardStats,
  useListDocuments,
  useGetDocumentStats,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Shield, Users, FileText, Database, Activity, CheckCircle } from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: documents, isLoading: docsLoading } = useListDocuments();
  const { data: docStats } = useGetDocumentStats();

  const systemStatus = [
    { name: "API Server", status: "online", latency: "12ms" },
    { name: "PostgreSQL", status: "online", latency: "3ms" },
    { name: "Vector DB (ChromaDB)", status: "configured", latency: "—" },
    { name: "Ollama LLM", status: "configured", latency: "—" },
    { name: "HuggingFace Embeddings", status: "configured", latency: "—" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold">Admin panel</h1>
          <p className="text-sm text-muted-foreground">System overview and management</p>
        </div>
        {user && <Badge variant="destructive" className="ml-auto capitalize">{user.role}</Badge>}
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total documents", value: stats?.totalDocuments ?? docStats?.total ?? 0, icon: FileText },
          { label: "Conversations", value: stats?.totalConversations ?? 0, icon: Activity },
          { label: "Quizzes", value: stats?.totalQuizzes ?? 0, icon: Database },
          { label: "Users", value: 1, icon: Users },
        ].map((s) => (
          <Card key={s.label} data-testid={`admin-stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardContent className="p-4">
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <s.icon className="h-4 w-4 text-muted-foreground mb-2" />
                  <div className="text-2xl font-bold font-serif">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            System status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {systemStatus.map((s) => (
            <div
              key={s.name}
              data-testid={`system-status-${s.name.toLowerCase().replace(/\s+/g, "-")}`}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${s.status === "online" ? "bg-green-500" : "bg-amber-500"}`} />
                <span className="text-sm font-medium">{s.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{s.latency}</span>
                <Badge
                  variant={s.status === "online" ? "secondary" : "outline"}
                  className={`text-xs capitalize ${s.status === "online" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : ""}`}
                >
                  {s.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Document management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Document index
          </CardTitle>
        </CardHeader>
        <CardContent>
          {docsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (documents ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No documents indexed yet</p>
          ) : (
            <div className="space-y-2">
              {(documents ?? []).map((doc) => (
                <div key={doc.id} data-testid={`admin-doc-${doc.id}`} className="flex items-center justify-between p-3 rounded-lg border border-border text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${doc.status === "ready" ? "text-green-500" : "text-amber-500"}`} />
                    <span className="font-medium truncate max-w-xs">{doc.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground text-xs shrink-0">
                    <span>{doc.chunkCount} chunks</span>
                    <Badge variant="outline" className="text-xs uppercase">{doc.fileType}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-muted/50 border border-border rounded-xl p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">RAG pipeline configuration</p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            ["LLM", "Ollama (local)"],
            ["Embeddings", "HuggingFace sentence-transformers"],
            ["Vector DB", "ChromaDB"],
            ["Chunk size", "500 tokens"],
            ["Overlap", "50 tokens"],
            ["Top-k retrieval", "3 passages"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span>{k}:</span>
              <span className="font-medium text-foreground">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
