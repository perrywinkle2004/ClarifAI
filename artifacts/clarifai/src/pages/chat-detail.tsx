import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetConversation,
  useSendMessage,
  getGetConversationQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Send, Bot, User, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { Message, Source } from "@workspace/api-client-react";

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const result: JSX.Element[] = [];
  let key = 0;
  for (const line of lines) {
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      result.push(<p key={key++} className="font-semibold mt-2">{line.slice(2, -2)}</p>);
    } else if (line.startsWith("- ")) {
      result.push(<li key={key++} className="ml-4 list-disc">{line.slice(2)}</li>);
    } else if (line.trim() === "") {
      result.push(<br key={key++} />);
    } else {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      result.push(
        <p key={key++} className="leading-relaxed">
          {parts.map((p, i) =>
            p.startsWith("**") && p.endsWith("**")
              ? <strong key={i}>{p.slice(2, -2)}</strong>
              : p
          )}
        </p>
      );
    }
  }
  return result;
}

function SourcePanel({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-2 border border-primary/20 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-muted-foreground bg-primary/5 hover:bg-primary/10 transition-colors"
      >
        <span className="font-medium">{sources.length} source{sources.length > 1 ? "s" : ""} referenced</span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="divide-y divide-border">
          {sources.map((s, i) => (
            <div key={i} className="px-3 py-2 bg-card">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-primary flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  {s.documentTitle}
                  {s.pageNumber && <Badge variant="outline" className="text-xs ml-1">p.{s.pageNumber}</Badge>}
                </span>
                <Badge variant="secondary" className="text-xs">{Math.round(s.relevance * 100)}% match</Badge>
              </div>
              {s.excerpt && <p className="text-xs text-muted-foreground line-clamp-2">{s.excerpt}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`} data-testid={`message-${message.id}`}>
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-medium ${isUser ? "bg-primary text-primary-foreground" : "bg-muted border border-border"}`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`max-w-[80%] space-y-1 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 text-sm ${isUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-card-border rounded-tl-sm"}`}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="space-y-1">{renderMarkdown(message.content)}</div>
          )}
        </div>
        {!isUser && message.sources && message.sources.length > 0 && (
          <SourcePanel sources={message.sources} />
        )}
        <span className="text-xs text-muted-foreground px-1">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

export default function ChatDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const convId = Number(id);
  const { data: conversation, isLoading } = useGetConversation(convId, {
    query: { enabled: !!convId, queryKey: getGetConversationQueryKey(convId) },
  });

  const sendMutation = useSendMessage();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages?.length]);

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return;
    const msg = input.trim();
    setInput("");
    sendMutation.mutate(
      { id: convId, data: { content: msg } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(convId) });
        },
        onError: () => {
          toast.error("Failed to send message");
          setInput(msg);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-3/4" />
          ))}
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">Conversation not found</p>
          <Button className="mt-4" onClick={() => setLocation("/chat")}>Back to chat</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/chat")} data-testid="button-back-chat">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate font-serif" data-testid="text-chat-title">{conversation.title}</h2>
          <p className="text-xs text-muted-foreground">{conversation.messages.length} messages</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.length === 0 ? (
          <div className="text-center py-16">
            <Bot className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold mb-1">Start the conversation</h3>
            <p className="text-sm text-muted-foreground">Ask anything about your uploaded study material</p>
          </div>
        ) : (
          conversation.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
        {sendMutation.isPending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-card border border-card-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2 items-end max-w-3xl mx-auto">
          <Textarea
            data-testid="input-chat-message"
            placeholder="Ask a question about your documents..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            className="resize-none min-h-[44px] max-h-32"
          />
          <Button
            data-testid="button-send-message"
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            size="icon"
            className="shrink-0 h-11 w-11"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          ClarifAI only answers from your uploaded documents — no hallucinations
        </p>
      </div>
    </div>
  );
}
