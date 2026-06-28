import { useState, useRef } from "react";
import {
  useListDocuments,
  useUploadDocument,
  useDeleteDocument,
  useGetDocumentStats,
  getListDocumentsQueryKey,
  getGetDocumentStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, FilePlus, Trash2, Upload, CheckCircle, AlertCircle, Loader2, Database, ClipboardPaste } from "lucide-react";
import type { DocumentFileType } from "@workspace/api-client-react";

const STATUS_CONFIG = {
  ready: { label: "Ready", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  processing: { label: "Embedding…", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Loader2 },
  error: { label: "Error", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
};

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function Documents() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [fileType, setFileType] = useState<DocumentFileType>("pdf");
  const [content, setContent] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fileName, setFileName] = useState("");
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useListDocuments();
  const { data: stats } = useGetDocumentStats();
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileSize(file.size);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") setFileType("pdf");
    else if (ext === "docx") setFileType("docx");
    else setFileType("txt");

    if (ext === "txt") {
      const reader = new FileReader();
      reader.onload = (ev) => setContent(ev.target?.result as string ?? "");
      reader.readAsText(file);
    }
  };

  const handleUpload = () => {
    if (!title.trim()) { toast.error("Please provide a title"); return; }
    if (!content.trim()) { toast.error("Please paste or load some text content so the AI can embed it"); return; }

    uploadMutation.mutate(
      {
        data: {
          title: title.trim(),
          filename: fileName || title,
          fileType,
          fileSize: fileSize || new Blob([content]).size,
          topic: topic || undefined,
          content: content.trim(),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDocumentStatsQueryKey() });
          setDialogOpen(false);
          resetForm();
          toast.success("Document uploaded — embedding in background…");
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetDocumentStatsQueryKey() });
          }, 5000);
        },
        onError: () => toast.error("Upload failed"),
      }
    );
  };

  const resetForm = () => {
    setTitle(""); setTopic(""); setFileName(""); setFileSize(0); setContent(""); setInputMode("file");
  };

  const handleDelete = (id: number, title: string) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDocumentStatsQueryKey() });
          toast.success(`"${title}" deleted`);
        },
        onError: () => toast.error("Delete failed"),
      }
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload and embed your study material</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-upload-document">
              <FilePlus className="h-4 w-4" />
              Add document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif">Add a document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex gap-2">
                <Button
                  variant={inputMode === "file" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInputMode("file")}
                  className="gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  File
                </Button>
                <Button
                  variant={inputMode === "paste" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInputMode("paste")}
                  className="gap-1.5"
                >
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  Paste text
                </Button>
              </div>

              {inputMode === "file" ? (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">{fileName || "Click to select a .txt file"}</p>
                  <p className="text-xs text-muted-foreground mt-1">TXT files are read and embedded automatically. For PDF/DOCX, paste the text below.</p>
                  <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={handleFileChange} data-testid="input-file-upload" />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g. Chapter 3 — Cell Biology"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-document-title"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Content <span className="text-muted-foreground">(paste your notes / text here)</span>
                </Label>
                <Textarea
                  placeholder="Paste your lecture notes, textbook excerpts, or any study material here. The AI will embed this text for retrieval."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[140px] font-mono text-xs leading-relaxed resize-y"
                  data-testid="input-document-content"
                />
                {content && (
                  <p className="text-xs text-muted-foreground">
                    {content.length.toLocaleString()} chars · ~{Math.ceil(content.length / 500)} chunks
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>File type</Label>
                  <Select value={fileType} onValueChange={(v) => setFileType(v as DocumentFileType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="txt">TXT</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="docx">DOCX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Topic (optional)</Label>
                  <Input
                    placeholder="e.g. Biology"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    data-testid="input-document-topic"
                  />
                </div>
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending || !title.trim() || !content.trim()}
                className="w-full"
                data-testid="button-confirm-upload"
              >
                {uploadMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</>
                ) : "Upload & embed document"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total documents", value: stats.total },
            { label: "Ready", value: stats.ready },
            { label: "Total chunks", value: stats.totalChunks },
            { label: "Total size", value: formatBytes(stats.totalSize) },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-card-border rounded-lg p-3 text-center">
              <div className="text-xl font-bold font-serif">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : documents?.length === 0 ? (
        <div className="text-center py-20">
          <Database className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-1">No documents yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Paste your lecture notes or textbook excerpts. ClarifAI will embed them and let you chat, quiz, and create flashcards — all grounded in your own material.
          </p>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <FilePlus className="h-4 w-4" />
            Add your first document
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents?.map((doc) => {
            const cfg = STATUS_CONFIG[doc.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.processing;
            return (
              <Card key={doc.id} data-testid={`card-document-${doc.id}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{doc.title}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-xs uppercase">{doc.fileType}</Badge>
                      <span>{formatBytes(doc.fileSize)}</span>
                      <span>{doc.chunkCount} chunks</span>
                      {doc.topic && <span className="text-primary">{doc.topic}</span>}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${cfg.color}`}>
                    <cfg.icon className={`h-3 w-3 ${doc.status === "processing" ? "animate-spin" : ""}`} />
                    {cfg.label}
                  </span>
                  <button
                    data-testid={`button-delete-document-${doc.id}`}
                    onClick={() => handleDelete(doc.id, doc.title)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
