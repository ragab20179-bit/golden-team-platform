/**
 * NEO AI Chat Window — Reusable chat component
 * Used by: Portal Dashboard (full page), Meeting Module (fallback chat)
 * Design: Neural Depth — glass morphism, bioluminescent AI accents
 */
import { useState, useRef, useEffect } from "react";
import { useNEOChat, ChatMessage } from "@/contexts/NEOChatContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Brain, Cpu, RefreshCw, Zap, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NEOChatWindowProps {
  className?: string;
  compact?: boolean; // compact mode for meeting module
  placeholder?: string;
  showHeader?: boolean;
}

export default function NEOChatWindow({
  className = "",
  compact = false,
  placeholder,
  showHeader = true,
}: NEOChatWindowProps) {
  const { messages, isTyping, sendMessage, clearMessages } = useNEOChat();
  const { lang, t } = useLanguage();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input, lang);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const defaultPlaceholder = t(
    "Ask NEO anything — HR, Finance, Procurement, Legal, QMS...",
    "اسأل نيو أي شيء — موارد بشرية، مالية، مشتريات، قانوني، جودة..."
  );

  return (
    <div className={`flex flex-col h-full ${className}`} dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      {showHeader && (
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/5"
          style={{ background: "rgba(6,11,20,0.8)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {t("NEO AI Core", "نيو — النواة الذكية")}
              </div>
              <div className="text-[10px] text-white/30">
                {t("Hybrid Engine · 80% Manus + 20% GPT-4", "محرك هجين · 80% مانوس + 20% GPT-4")}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t("Online", "متصل")}
            </div>
            <button onClick={clearMessages}
              className="w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-colors"
              title={t("Clear chat", "مسح المحادثة")}>
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} lang={lang} compact={compact} />
          ))}
          {isTyping && (
            <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-end gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Brain className="w-3 h-3 text-blue-400" />
              </div>
              <div className="rounded-2xl rounded-bl-sm px-3 py-2 border border-blue-500/20 bg-blue-500/5">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {!compact && (
        <div className="shrink-0 px-3 pb-2 flex gap-1.5 flex-wrap">
          {(lang === "ar"
            ? ["طلب إجازة", "فاتورة جديدة", "أمر شراء", "مراجعة عقد"]
            : ["Request Leave", "New Invoice", "Purchase Order", "Review Contract"]
          ).map((action) => (
            <button key={action} onClick={() => sendMessage(action, lang)}
              className="text-[10px] px-2.5 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-300/70 hover:text-blue-300 hover:border-blue-500/40 transition-colors">
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 px-3 pb-3">
        <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/3 px-3 py-2 focus-within:border-blue-500/40 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || defaultPlaceholder}
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 resize-none outline-none leading-relaxed max-h-28 overflow-y-auto"
            style={{ fontFamily: lang === "ar" ? "'Noto Sans Arabic', sans-serif" : "'Space Grotesk', sans-serif" }}
          />
          <button onClick={handleSend} disabled={!input.trim()}
            className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0">
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <div className="text-[10px] text-white/15 text-center mt-1.5">
          {t("Enter to send · Shift+Enter for new line · NEO routes to best AI engine automatically",
            "Enter للإرسال · Shift+Enter لسطر جديد · نيو يختار المحرك الأنسب تلقائياً")}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, lang, compact }: { msg: ChatMessage; lang: "en" | "ar"; compact: boolean }) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";

  if (isSystem) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex justify-center">
        <div className="text-[10px] text-white/25 bg-white/3 border border-white/5 rounded-full px-3 py-1">
          {msg.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0
        ${isUser ? "bg-gradient-to-br from-amber-400 to-amber-600" : "bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border border-blue-500/30"}`}>
        {isUser
          ? <User className="w-3 h-3 text-black" />
          : <Brain className="w-3 h-3 text-blue-400" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed
          ${isUser
            ? "rounded-br-sm bg-blue-600/80 text-white border border-blue-500/30"
            : "rounded-bl-sm bg-white/4 text-white/85 border border-white/8"}`}
          style={{ fontFamily: lang === "ar" ? "'Noto Sans Arabic', sans-serif" : "inherit" }}>
          {msg.content}
        </div>
        {/* Meta */}
        {!compact && !isUser && msg.module && (
          <div className="flex items-center gap-2 px-1">
            {msg.engine && (
              <div className={`flex items-center gap-1 text-[9px] ${msg.engine === "gpt4" ? "text-violet-400/60" : "text-blue-400/60"}`}>
                {msg.engine === "gpt4" ? <Zap className="w-2.5 h-2.5" /> : <Cpu className="w-2.5 h-2.5" />}
                {msg.engine === "gpt4" ? "GPT-4" : "Manus"}
              </div>
            )}
            <span className="text-[9px] text-white/20">{msg.module}</span>
            <span className="text-[9px] text-white/15">
              {msg.timestamp.toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
