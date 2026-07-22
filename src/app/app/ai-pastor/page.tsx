"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, BookOpenText, HandHeart, ArrowLeft, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LivynAiIcon } from "@/components/brand/logo";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

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

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

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
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </motion.div>
  );
}

export default function AiPastorPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  function generateResponse(userMessage: string): string {
    const lower = userMessage.toLowerCase();
    if (lower.includes("yohanes 3:16") || lower.includes("john 3:16")) {
      return "\"Karena begitu besar kasih Allah akan dunia ini, sehingga Ia telah mengaruniakan Anak-Nya yang tunggal, supaya setiap orang yang percaya kepada-Nya tidak binasa, melainkan beroleh hidup yang kekal.\"\n\n— Yohanes 3:16\n\nAyat ini adalah inti dari Injil. Allah tidak menunggu kita menjadi sempurna — Dia mengasihi kita terlebih dahulu. Kasih-Nya bukan sekadar perasaan, tetapi tindakan nyata: mengirim Yesus untuk mati bagi kita.\n\nPertanyaan refleksi: Apakah kamu sudah merasakan kasih Allah yang begitu besar ini dalam hidupmu hari ini?";
    }
    if (lower.includes("cemas") || lower.includes("khawatir") || lower.includes("takut")) {
      return "Saya mengerti perasaanmu. Kecemasan bisa terasa sangat berat.\n\nIngatlah firman Tuhan:\n\n\"Janganlah hendaknya kamu kuatir tentang apa pun juga, tetapi nyatakanlah dalam segala hal keinginanmu kepada Allah dalam doa dan permohonan dengan ucapan syukur.\"\n— Filipi 4:6\n\nTuhan tahu apa yang kamu rasakan. Dia tidak pernah meninggalkanmu. Serahkan kecemasanmu kepada-Nya dalam doa.\n\nMau berdoa bersama tentang hal ini?";
    }
    if (lower.includes("kasih") || lower.includes("cinta")) {
      return "Kasih adalah tema sentral dalam iman Kristen.\n\n\"Kasih itu sabar; kasih itu murah hati; ia tidak cemburu. Ia tidak memegahkan diri dan tidak sombong. Ia tidak melakukan yang tidak sopan dan tidak mencari keuntungan diri sendiri.\"\n— 1 Korintus 13:4-5\n\nKasih Allah kepada kita adalah teladan sempurna. Kasih-Nya tanpa syarat, tanpa batas, dan tidak pernah berakhir.\n\nBagaimana kamu bisa menunjukkan kasih ini kepada orang di sekitarmu hari ini?";
    }
    if (lower.includes("doa") || lower.includes("berdoa")) {
      return "Doa adalah percakapan pribadi dengan Tuhan. Tidak ada rumus khusus — yang terpenting adalah ketulusan hatimu.\n\nYesus mengajarkan pola doa dalam Matius 6:9-13:\n\n1. Memuji Tuhan — \"Bapa kami yang di surga\"\n2. Memohon kehendak-Nya — \"Jadilah kehendak-Mu\"\n3. Menyerahkan kebutuhan — \"Berilah kami rezeki\"\n4. Memohon pengampunan — \"Ampunilah kami\"\n5. Memohon perlindungan — \"Jauhkan kami dari yang jahat\"\n\nMulailah dengan berbicara kepada Tuhan seperti berbicara kepada Bapa yang mengasihimu. Dia selalu mendengar.";
    }
    return "Terima kasih sudah bertanya. Saat ini AI Pastor masih dalam pengembangan dan belum terhubung ke layanan AI.\n\nNamun, saya ingin mendorongmu untuk:\n\n1. Membaca Firman Tuhan setiap hari\n2. Berdoa dengan tulus dari hatimu\n3. Bergabung dengan komunitas iman\n\n\"Percayalah kepada Tuhan dengan segenap hatimu, dan janganlah bersandar kepada pengertianmu sendiri.\"\n— Amsal 3:5\n\nAda hal lain yang ingin kamu tanyakan?";
  }

  async function sendMessage(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    const response = generateResponse(messageText);
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setIsTyping(false);
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
            <p className="text-[11px] text-primary font-medium">Pendamping rohanimu</p>
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
              {/* AI Icon */}
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

              {/* Suggested Prompts */}
              <div className="w-full max-w-sm grid grid-cols-2 gap-2.5 mt-2">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    onClick={() => sendMessage(prompt.text)}
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
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isTyping && (
                <div className="flex items-start">
                  <div className="mr-2.5 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
                    <LivynAiIcon className="h-5 w-5" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-surface-muted px-4 py-3">
                    <TypingIndicator />
                  </div>
                </div>
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
                  sendMessage();
                }
              }}
              placeholder="Ketik pesan..."
              rows={1}
              className="w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary/30 focus:ring-2 focus:ring-primary/10 max-h-32"
              style={{ minHeight: 48 }}
            />
          </div>
          <motion.button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all",
              input.trim() && !isTyping
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
