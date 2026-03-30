/**
 * NEO AI Chat Window — Reusable chat component with Universal File Upload
 * Used by: Portal Dashboard (full page), Meeting Module (fallback chat)
 * Design: Neural Depth — glass morphism, bioluminescent AI accents
 * 
 * File upload features:
 *   - Paperclip attach button + drag-and-drop zone
 *   - Trash2 (bin) icon for removing pending uploads
 *   - Chunked upload pipeline → parsed file content injected via uploadIds
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useNEOChat, ChatMessage } from "@/contexts/NEOChatContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Brain, Cpu, RefreshCw, Zap, User,
  Paperclip, Trash2, Loader2, CheckCircle2, AlertCircle, Upload, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { toast as sonnerToast } from "sonner";

interface NEOChatWindowProps {
  className?: string;
  compact?: boolean; // compact mode for meeting module
  placeholder?: string;
  showHeader?: boolean;
}

/** Tracks a file being uploaded through the universal upload pipeline */
interface PendingUpload {
  id: string;
  file: File;
  uploadId?: string;
  status: "uploading" | "parsing" | "ready" | "error";
  progress: number;
  error?: string;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB

const ACCEPTED_TYPES = [
  "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv", "text/plain", "text/xml", "application/xml", "text/markdown",
  "image/png", "image/jpeg", "image/webp", "image/gif", "image/tiff", "image/bmp",
  "application/vnd.apple.pages", "application/vnd.apple.numbers",
  "application/rtf", "application/vnd.oasis.opendocument.text",
].join(",");

export default function NEOChatWindow({
  className = "",
  compact = false,
  placeholder,
  showHeader = true,
}: NEOChatWindowProps) {
  const { messages, isTyping, sendMessage, clearMessages } = useNEOChat();
  const { lang, t } = useLanguage();
  const [input, setInput] = useState("");
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── File upload pipeline ────────────────────────────────────────────────────

  const uploadFileThroughPipeline = useCallback(async (file: File) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const pending: PendingUpload = { id, file, status: "uploading", progress: 0 };
    setPendingUploads(prev => [...prev, pending]);

    try {
      const client = (utils as any).client;
      // 1. Initiate upload
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const initResult = await client.universalUpload.initiate.mutate({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        totalChunks,
        context: "neo-chat-window",
      });
      const uploadId = initResult.uploadId;

      // 2. Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        const buffer = await chunk.arrayBuffer();
        const base64 = btoa(
          Array.from(new Uint8Array(buffer))
            .map(b => String.fromCharCode(b))
            .join("")
        );
        await client.universalUpload.uploadChunk.mutate({
          uploadId,
          chunkIndex: i,
          data: base64,
        });
        const progress = Math.round(((i + 1) / totalChunks) * 80);
        setPendingUploads(prev =>
          prev.map(p => p.id === id ? { ...p, progress, uploadId } : p)
        );
      }

      // 3. Finalize
      await client.universalUpload.finalize.mutate({ uploadId });
      setPendingUploads(prev =>
        prev.map(p => p.id === id ? { ...p, status: "parsing", progress: 85 } : p)
      );

      // 4. Poll for parse completion
      let attempts = 0;
      while (attempts < 60) {
        const status = await client.universalUpload.getStatus.query({ uploadId });
        if (status.status === "complete") {
          setPendingUploads(prev =>
            prev.map(p => p.id === id ? { ...p, status: "ready", progress: 100, uploadId } : p)
          );
          return;
        }
        if (status.status === "error") {
          throw new Error(status.error || "Parse failed");
        }
        await new Promise(r => setTimeout(r, 1000));
        attempts++;
        setPendingUploads(prev =>
          prev.map(p => p.id === id ? { ...p, progress: 85 + Math.min(attempts, 14) } : p)
        );
      }
      throw new Error("Parse timeout");
    } catch (err: any) {
      setPendingUploads(prev =>
        prev.map(p => p.id === id ? { ...p, status: "error", error: err.message } : p)
      );
      sonnerToast.error(`Upload failed: ${file.name}`, { description: err.message });
    }
  }, [utils]);

  const handleFileSelect = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach(f => uploadFileThroughPipeline(f));
  }, [uploadFileThroughPipeline]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const removeUpload = useCallback((id: string) => {
    setPendingUploads(prev => prev.filter(p => p.id !== id));
  }, []);

  // ── Send handler ────────────────────────────────────────────────────────────

  const handleSend = () => {
    if (!input.trim()) return;

    // Collect ready uploadIds
    const readyUploadIds = pendingUploads
      .filter(p => p.status === "ready" && p.uploadId)
      .map(p => p.uploadId!);

    // Pass uploadIds to sendMessage (the context will forward them to the tRPC call)
    sendMessage(input, lang, readyUploadIds.length > 0 ? readyUploadIds : undefined);
    setInput("");
    setPendingUploads(prev => prev.filter(p => p.status !== "ready")); // clear sent files
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

  const readyCount = pendingUploads.filter(p => p.status === "ready").length;
  const uploadingCount = pendingUploads.filter(p => ["uploading", "parsing"].includes(p.status)).length;

  return (
    <TooltipProvider>
      <div
        className={`flex flex-col h-full ${isDragging ? "ring-2 ring-blue-500/50" : ""} ${className}`}
        dir={lang === "ar" ? "rtl" : "ltr"}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
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

        {/* Drag overlay */}
        {isDragging && (
          <div className="flex items-center justify-center gap-2 p-4 mx-3 mt-2 rounded-lg border-2 border-dashed border-blue-500/50 bg-blue-500/5 text-blue-400 text-sm">
            <Upload className="w-5 h-5" />
            {t("Drop files here", "أفلت الملفات هنا")}
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

        {/* Pending uploads */}
        {pendingUploads.length > 0 && (
          <div className="shrink-0 px-3 pb-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/40">
                {readyCount}/{pendingUploads.length} {t("files ready", "ملفات جاهزة")}
                {uploadingCount > 0 && ` · ${uploadingCount} ${t("uploading", "قيد الرفع")}`}
              </span>
              <button
                onClick={() => setPendingUploads([])}
                className="text-[10px] text-white/30 hover:text-red-400 transition-colors"
              >
                {t("Clear all", "مسح الكل")}
              </button>
            </div>
            {pendingUploads.map(pu => (
              <div key={pu.id} className="flex items-center gap-2 p-1.5 rounded-md bg-white/5 border border-white/10">
                {pu.status === "ready" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                ) : pu.status === "error" ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                ) : (
                  <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/60 truncate">{pu.file.name}</p>
                  {pu.status !== "ready" && pu.status !== "error" && (
                    <Progress value={pu.progress} className="h-0.5 mt-0.5" />
                  )}
                  {pu.error && <p className="text-[10px] text-red-400">{pu.error}</p>}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => removeUpload(pu.id)}
                      className="text-white/30 hover:text-red-400 transition-colors p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t("Remove", "إزالة")}</TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 px-3 pb-3">
          <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/3 px-3 py-2 focus-within:border-blue-500/40 transition-colors">
            {/* File attach button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES}
              className="hidden"
              onChange={e => {
                if (e.target.files) handleFileSelect(e.target.files);
                e.target.value = "";
              }}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-blue-400 hover:bg-blue-500/10 transition-colors shrink-0"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {t("Attach files (PDF, Excel, images...)", "إرفاق ملفات (PDF, Excel, صور...)")}
              </TooltipContent>
            </Tooltip>

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
            {t("Enter to send · Shift+Enter for new line · Drag & drop files",
              "Enter للإرسال · Shift+Enter لسطر جديد · اسحب وأفلت الملفات")}
          </div>
        </div>
      </div>
    </TooltipProvider>
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
