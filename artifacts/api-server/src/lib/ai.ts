import Groq from "groq-sdk";

const GROQ_MODEL = "llama-3.3-70b-versatile";
const OLLAMA_BASE = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_CHAT_MODEL ?? "gemma3";

let _groq: Groq | null = null;
function getGroq(): Groq | null {
  if (!process.env.GROQ_API_KEY) return null;
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

async function groqChat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
): Promise<string> {
  const groq = getGroq();
  if (!groq) throw new Error("No GROQ_API_KEY set");
  const res = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    max_tokens: 2048,
  });
  return res.choices[0]?.message?.content ?? "";
}

async function ollamaChat(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_MODEL, stream: false, messages }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json() as { message: { content: string } };
  return data.message?.content ?? "";
}

export async function chat(
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string
): Promise<{ content: string; provider: "groq" | "ollama" }> {
  const fullMessages = systemPrompt
    ? [{ role: "system" as const, content: systemPrompt }, ...messages.map((m) => ({ ...m, role: m.role as "user" | "assistant" | "system" }))]
    : messages.map((m) => ({ ...m, role: m.role as "user" | "assistant" | "system" }));

  if (process.env.GROQ_API_KEY) {
    try {
      const content = await groqChat(fullMessages);
      return { content, provider: "groq" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("ECONNREFUSED") && !msg.includes("fetch")) {
        throw err;
      }
    }
  }

  try {
    const content = await ollamaChat(fullMessages);
    return { content, provider: "ollama" };
  } catch {
    throw new Error(
      process.env.GROQ_API_KEY
        ? "Both Groq and Ollama failed. Check your GROQ_API_KEY or Ollama status."
        : "No AI provider available. Set GROQ_API_KEY or run Ollama locally with: ollama pull gemma3"
    );
  }
}

export function keywordRetrieve(
  chunks: Array<{ content: string; chunkIndex: number }>,
  query: string,
  topK = 5
): Array<{ content: string; chunkIndex: number; score: number }> {
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (queryWords.length === 0) {
    return chunks.slice(0, topK).map((c) => ({ ...c, score: 0.5 }));
  }

  const scored = chunks.map((c) => {
    const text = c.content.toLowerCase();
    let score = 0;
    for (const word of queryWords) {
      const occurrences = (text.match(new RegExp(word, "g")) ?? []).length;
      score += occurrences;
    }
    const exactPhrase = text.includes(query.toLowerCase()) ? 5 : 0;
    return { ...c, score: score + exactPhrase };
  });

  const top = scored.sort((a, b) => b.score - a.score).slice(0, topK);
  if (top.every((c) => c.score === 0)) {
    return chunks.slice(0, topK).map((c) => ({ ...c, score: 0.1 }));
  }
  return top.filter((c) => c.score > 0);
}

export function chunkText(text: string, chunkSize = 600, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end === text.length) break;
    start += chunkSize - overlap;
  }
  return chunks.filter((c) => c.length > 20);
}
