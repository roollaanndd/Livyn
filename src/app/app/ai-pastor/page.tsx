"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, BookOpenText, HandHeart, ArrowLeft, RotateCcw, AlertCircle, RefreshCw, MessageCircle, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LivynAiIcon } from "@/components/brand/logo";

const SUGGESTED_PROMPTS = [
  { icon: BookOpenText, text: "Jelaskan Yohanes 3:16", category: "Alkitab", color: "bg-blue-500/10 text-blue-600" },
  { icon: HandHeart, text: "Saya sedang merasa cemas", category: "Doa", color: "bg-rose-500/10 text-rose-600" },
  { icon: Sparkles, text: "Berikan renungan tentang kasih", category: "Renungan", color: "bg-amber-500/10 text-amber-600" },
  { icon: Heart, text: "Bagaimana cara berdoa?", category: "Panduan", color: "bg-teal-500/10 text-teal-600" },
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-2 px-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full bg-primary/50"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function getMessageText(msg: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!msg.parts) return "";
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("");
}

function formatAiText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("# ")) return <p key={i} className="text-[15px] font-bold text-heading mt-3 mb-1">{line.slice(2)}</p>;
    if (line.startsWith("## ")) return <p key={i} className="text-[14px] font-bold text-heading mt-2.5 mb-1">{line.slice(3)}</p>;
    if (/^\d+\.\s/.test(line)) return <p key={i} className="ml-1 mt-1">{line}</p>;
    if (line.startsWith("- ")) return <p key={i} className="ml-1 mt-1">{line}</p>;
    if (line.trim() === "") return <br key={i} />;

    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*|"[^"]*"\s*—\s*\S[^"\n]*)/g);
    return (
      <p key={i} className="mt-1">
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) return <strong key={j} className="font-semibold text-heading">{part.slice(2, -2)}</strong>;
          if (part.startsWith("*") && part.endsWith("*")) return <em key={j} className="italic">{part.slice(1, -1)}</em>;
          if (part.startsWith('"') && part.includes("—")) {
            return <span key={j} className="block mt-2 mb-1 pl-3 border-l-2 border-primary/30 italic text-primary/80">{part}</span>;
          }
          return part;
        })}
      </p>
    );
  });
}

function MessageBubble({ role, content }: { role: string; content: string }) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-sm">
          <LivynAiIcon className="h-5 w-5" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed",
          isUser
            ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-lg shadow-sm"
            : "bg-surface border border-border-subtle text-foreground rounded-bl-lg shadow-[var(--shadow-sm)]",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="whitespace-pre-wrap [&>p]:first:mt-0">{formatAiText(content)}</div>
        )}
      </div>
    </motion.div>
  );
}

export default function AiPastorPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai-pastor" }),
    onError: (err) => {
      try {
        const parsed = JSON.parse(err.message);
        setApiError(parsed.error || "Gagal mengirim pesan.");
      } catch {
        if (err.message.includes("503")) {
          setApiError("AI Pastor belum tersedia. Hubungi admin untuk mengkonfigurasi API key.");
        } else if (err.message.includes("429")) {
          setApiError("Terlalu banyak pesan. Tunggu beberapa saat lalu coba lagi.");
        } else {
          setApiError("Gagal menghubungi AI Pastor. Periksa koneksi internet.");
        }
      }
    },
  });

  const isActive = status === "submitted" || status === "streaming";

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isActive, scrollToBottom]);

  useEffect(() => {
    if (apiError) {
      const timer = setTimeout(() => setApiError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [apiError]);

  function handleSend(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || isActive) return;
    setInput("");
    setApiError(null);
    sendMessage({ text: messageText });
  }

  const displayError = apiError || (error ? "Gagal mengirim pesan. Periksa koneksi internet." : null);
  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <header className="glass-heavy relative z-20 flex items-center gap-3 px-4 py-3 safe-top border-b border-border-subtle">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-muted/80 hover:bg-surface-muted transition-colors active:scale-95"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-sm">
            <LivynAiIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-[16px] font-bold text-heading">AI Pastor</h1>
            <p className="text-[11px] font-medium">
              {isActive ? (
                <span className="text-primary">Mengetik...</span>
              ) : (
                <span className="text-muted-foreground">Pendamping rohanimu</span>
              )}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setApiError(null); }}
            className="flex h-10 w-10 items-center justify-center rounded-2xl hover:bg-surface-muted transition-colors active:scale-95"
            aria-label="Reset percakapan"
          >
            <RotateCcw className="h-4.5 w-4.5 text-muted-foreground" />
          </button>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        <AnimatePresence>
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-full min-h-[50vh] gap-7"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="relative">
                  <div className="absolute inset-0 scale-[1.8] blur-3xl">
                    <div className="h-full w-full rounded-full bg-primary/15" />
                  </div>
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                </div>
              </motion.div>

              <div className="text-center space-y-2.5">
                <h2 className="font-display text-[22px] font-extrabold text-heading">Halo! Saya AI Pastor</h2>
                <p className="text-[14px] text-muted-foreground max-w-[280px] leading-relaxed">
                  Tanyakan tentang Alkitab, iman, atau bagikan pergumulanmu. Saya di sini untukmu.
                </p>
              </div>

              <div className="w-full max-w-sm grid grid-cols-2 gap-3 mt-2">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    onClick={() => handleSend(prompt.text)}
                    className="flex flex-col gap-2.5 rounded-2xl border border-border-subtle bg-surface p-4 text-left hover:bg-surface-muted hover:border-border transition-all active:scale-[0.97] shadow-[var(--shadow-sm)]"
                  >
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", prompt.color)}>
                      <prompt.icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="text-[12.5px] leading-snug text-heading font-semibold">{prompt.text}</span>
                      <span className="block text-[10px] font-medium text-muted-foreground mt-0.5">{prompt.category}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} role={msg.role} content={getMessageText(msg)} />
              ))}
              {status === "submitted" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5"
                >
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-sm">
                    <LivynAiIcon className="h-5 w-5" />
                  </div>
                  <div className="rounded-2xl rounded-bl-lg bg-surface border border-border-subtle px-4 py-3 shadow-[var(--shadow-sm)]">
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>

        {displayError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-start gap-3 rounded-2xl bg-error-soft border border-error/20 p-4"
          >
            <AlertCircle className="h-5 w-5 text-error shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-error">Terjadi Kesalahan</p>
              <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{displayError}</p>
            </div>
            <button
              onClick={() => { setApiError(null); }}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl hover:bg-error-soft transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 text-error" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="glass-heavy border-t border-border-subtle px-4 py-3 safe-bottom">
        <div className="flex items-end gap-3">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ketik pesan..."
              rows={1}
              className="w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3.5 text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary/30 focus:ring-2 focus:ring-primary/10 focus:shadow-[var(--shadow-glow)] max-h-32"
              style={{ minHeight: 50 }}
            />
          </div>
          <motion.button
            onClick={() => handleSend()}
            disabled={!input.trim() || isActive}
            className={cn(
              "flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-2xl transition-all",
              input.trim() && !isActive
                ? "bg-gradient-to-br from-primary to-primary/85 text-white shadow-md shadow-primary/20"
                : "bg-surface-muted text-muted-foreground",
            )}
            whileTap={{ scale: 0.92 }}
          >
            <Send className="h-[18px] w-[18px]" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
