import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useListConversations,
  useCreateConversation,
  useDeleteConversation,
  useListDocuments,
  getListConversationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MessageSquare, Plus, Search, Trash2, Clock, FileText, BookOpen } from "lucide-react";

export default function ChatList() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [selectedDocId, setSelectedDocId] = useState<string>("none");
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: conversations, isLoading } = useListConversations();
  const { data: documents } = useListDocuments();
  const createMutation = useCreateConversation();
  const deleteMutation = useDeleteConversation();

  const readyDocs = documents?.filter((d) => d.status === "ready") ?? [];

  const filtered = conversations?.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const docId = selectedDocId !== "none" ? Number(selectedDocId) : undefined;
    createMutation.mutate(
      { data: { title: newTitle.trim(), documentId: docId } },
      {
        onSuccess: (conv) => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setDialogOpen(false);
          setNewTitle("");
          setSelectedDocId("none");
          toast.success("Conversation created");
          setLocation(`/chat/${conv.id}`);
        },
        onError: () => toast.error("Failed to create conversation"),
      }
    );
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          toast.success("Conversation deleted");
        },
        onError: () => toast.error("Failed to delete"),
      }
    );
  };

  const getDocTitle = (docId: number | null | undefined) =>
    docId ? documents?.find((d) => d.id === docId)?.title ?? `Document #${docId}` : null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Conversations</h1>
          <p className="text-sm text-muted-foreground mt-1">Chat with your uploaded documents</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-new-chat">
              <Plus className="h-4 w-4" />
              New chat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Start a new conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="conv-title">Title</Label>
                <Input
                  id="conv-title"
                  data-testid="input-conversation-title"
                  placeholder="e.g. Cell biology questions"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conv-doc">Document (optional)</Label>
                {readyDocs.length === 0 ? (
                  <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-3 text-center">
                    <BookOpen className="h-5 w-5 mx-auto mb-1 opacity-50" />
                    No documents yet — <a href="/documents" className="text-primary underline">upload one first</a>
                  </div>
                ) : (
                  <Select value={selectedDocId} onValueChange={setSelectedDocId}>
                    <SelectTrigger id="conv-doc">
                      <SelectValue placeholder="Select a document to ground this chat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">No document — general chat</span>
                      </SelectItem>
                      {readyDocs.map((doc) => (
                        <SelectItem key={doc.id} value={String(doc.id)}>
                          <span className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            {doc.title}
                            {doc.topic && <span className="text-muted-foreground text-xs">· {doc.topic}</span>}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedDocId !== "none" && (
                  <p className="text-xs text-muted-foreground">
                    AI will answer using only this document's content (RAG)
                  </p>
                )}
              </div>

              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending || !newTitle.trim()}
                className="w-full"
                data-testid="button-create-chat"
              >
                {createMutation.isPending ? "Creating..." : "Start conversation"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          className="pl-9"
          data-testid="input-search-conversations"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-1">
            {search ? "No conversations found" : "No conversations yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search ? "Try a different search term" : "Start a new conversation to chat with your documents"}
          </p>
          {!search && (
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New conversation
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const docTitle = getDocTitle(c.documentId);
            return (
              <Link key={c.id} href={`/chat/${c.id}`}>
                <div
                  data-testid={`card-chat-${c.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.title}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      {docTitle && (
                        <Badge variant="secondary" className="text-xs gap-1 py-0">
                          <FileText className="h-2.5 w-2.5" />
                          {docTitle}
                        </Badge>
                      )}
                      <span>{c.messageCount} messages</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(c.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    data-testid={`button-delete-chat-${c.id}`}
                    onClick={(e) => handleDelete(e, c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
