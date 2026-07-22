"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, BookOpenText, HandHeart, ArrowLeft, RotateCcw, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LivynAiIcon } from "@/components/brand/logo";

const SUGGESTED_PROMPTS = [
  { icon: BookOpenText, text: "Jelaskan Yohanes 3:16", category: "Alkitab" },
  { icon: HandHeart, text: "Saya sedang merasa cemas", category: "Doa" },
  { icon: Sparkles, text: "Berikan renungan tentang kasih", category: "Renungan" },
  { icon: BookOpenText, text: "Bagaimana cara berdoa yang benar?", category: "Panduan" },
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full bg-primary/40"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1, 0.85] }}
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

function MessageBubble({ role, content }: { role: string; content: string }) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="mr-2.5 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
          <LivynAiIcon className="h-5 w-5" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-surface-muted text-heading rounded-bl-md",
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </motion.div>
  );
}

export default function AiPastorPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport: {
      type: "fetch" as const,
      url: "/api/ai-pastor",
    } as never,
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

  function handleSend(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || isActive) return;
    setInput("");
    sendMessage({ text: messageText });
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <header className="glass-heavy relative z-20 flex items-center gap-3 px-4 py-3 safe-top border-b border-border-subtle">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-muted/80 hover:bg-surface-muted transition-colors"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </button>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft">
            <LivynAiIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-[15px] font-bold text-heading">AI Pastor</h1>
            <p className="text-[11px] text-primary font-medium">
              {isActive ? "Mengetik..." : "Pendamping rohanimu"}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-surface-muted transition-colors"
            aria-label="Reset percakapan"
          >
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence>
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-full min-h-[50vh] gap-6"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="relative">
                  <div className="absolute inset-0 scale-150 blur-2xl">
                    <div className="h-full w-full rounded-full bg-primary/10" />
                  </div>
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-[var(--shadow-glow)]">
                    <Sparkles className="h-9 w-9 text-white" />
                  </div>
                </div>
              </motion.div>

              <div className="text-center space-y-2">
                <h2 className="font-display text-xl font-bold text-heading">Halo, Saya AI Pastor</h2>
                <p className="text-[13px] text-muted-foreground max-w-[260px] leading-relaxed">
                  Tanyakan tentang Alkitab, iman, atau bagikan pergumulanmu. Saya di sini untukmu.
                </p>
              </div>

              <div className="w-full max-w-sm grid grid-cols-2 gap-2.5 mt-2">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    onClick={() => handleSend(prompt.text)}
                    className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface p-3.5 text-left hover:bg-surface-muted transition-colors active:scale-[0.97]"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft">
                      <prompt.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-[12px] leading-snug text-heading font-medium">{prompt.text}</span>
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
                <div className="flex items-start">
                  <div className="mr-2.5 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
                    <LivynAiIcon className="h-5 w-5" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-surface-muted px-4 py-3">
                    <TypingIndicator />
                  </div>
                </div>
              )}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4"
                >
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-medium text-red-500">Gagal mengirim pesan</p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      Pastikan koneksi internet stabil dan coba lagi.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="glass-heavy border-t border-border-subtle px-4 py-3 safe-bottom">
        <div className="flex items-end gap-2.5">
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
              className="w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary/30 focus:ring-2 focus:ring-primary/10 max-h-32"
              style={{ minHeight: 48 }}
            />
          </div>
          <motion.button
            onClick={() => handleSend()}
            disabled={!input.trim() || isActive}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all",
              input.trim() && !isActive
                ? "bg-primary text-white shadow-[var(--shadow-glow)]"
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
