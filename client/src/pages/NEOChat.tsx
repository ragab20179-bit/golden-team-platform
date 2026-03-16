/**
 * NEO Chat/Intercom — M1 of Phase 2
 *
 * Unified AI chat workspace for Golden Team employees.
 * Features:
 * - Conversation list sidebar with new chat creation
 * - Message thread with user + AI messages
 * - AI routing indicator (Manus / GPT / Hybrid) per response
 * - Drag-and-drop file attachment support
 * - Full bilingual Arabic/English + RTL
 * - Markdown rendering via Streamdown
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
  MessageSquare, Plus, Send, Paperclip, X, Bot, User,
  Zap, Brain, Layers, Archive, Loader2, ChevronRight,
  Cpu, Sparkles, AlertCircle, Mic,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { VoiceChat } from "@/components/VoiceChat";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Attachment {
  name: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

// ─── Engine badge config ──────────────────────────────────────────────────────

const ENGINE_CONFIG = {
  manus: {
    icon: Cpu,
    colorClass: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    labelEn: "Manus",
    labelAr: "مانوس",
    descEn: "Operational AI — workflow & actions",
    descAr: "الذكاء التشغيلي — سير العمل والإجراءات",
  },
  gpt: {
    icon: Brain,
    colorClass: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    labelEn: "GPT",
    labelAr: "جي بي تي",
    descEn: "Analytical AI — reasoning & strategy",
    descAr: "الذكاء التحليلي — التفكير والاستراتيجية",
  },
  hybrid: {
    icon: Layers,
    colorClass: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    labelEn: "Hybrid",
    labelAr: "هجين",
    descEn: "Combined AI — operational + analytical",
    descAr: "ذكاء مدمج — تشغيلي وتحليلي",
  },
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────
type RoutingScore = { manusScore?: number; gptScore?: number; hybridBoost?: number; keywordHits?: string[] };

// ─── Component ────────────────────────────────────────────────────────────────

export default function NEOChat() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const toast = ({ title, variant }: { title: string; variant?: string }) => {
    console.log(`[${variant ?? 'info'}] ${title}`);
  };
  const utils = trpc.useUtils();

  // State
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreatingConv, setIsCreatingConv] = useState(false);
  const [newConvTitle, setNewConvTitle] = useState("");
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Queries ────────────────────────────────────────────────────────────────

  const { data: conversations = [], isLoading: convsLoading } = trpc.neoChat.listConversations.useQuery();

  const { data: messages = [], isLoading: msgsLoading } = trpc.neoChat.getMessages.useQuery(
    { conversationId: activeConvId! },
    { enabled: activeConvId !== null, refetchInterval: 3000 }
  );

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const createConvMutation = trpc.neoChat.createConversation.useMutation({
    onSuccess: (conv) => {
      utils.neoChat.listConversations.invalidate();
      setActiveConvId(conv.id);
      setIsCreatingConv(false);
      setNewConvTitle("");
    },
    onError: () => toast({ title: t("Failed to create conversation", "فشل إنشاء المحادثة"), variant: "destructive" }),
  });

  const sendMessageMutation = trpc.neoChat.sendMessage.useMutation({
    onSuccess: () => {
      utils.neoChat.getMessages.invalidate({ conversationId: activeConvId! });
      utils.neoChat.listConversations.invalidate();
      setMessageInput("");
      setAttachments([]);
      setIsSending(false);
    },
    onError: () => {
      setIsSending(false);
      toast({ title: t("Failed to send message", "فشل إرسال الرسالة"), variant: "destructive" });
    },
  });

  const archiveMutation = trpc.neoChat.archiveConversation.useMutation({
    onSuccess: () => {
      utils.neoChat.listConversations.invalidate();
      if (activeConvId === activeConvId) setActiveConvId(null);
      toast({ title: t("Conversation archived", "تم أرشفة المحادثة") });
    },
  });

  // ─── Auto-scroll ────────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Drag-and-drop ──────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      // For now, attach as metadata (actual upload would go through S3)
      setAttachments(prev => [...prev, {
        name: file.name,
        url: URL.createObjectURL(file),
        mimeType: file.type,
        sizeBytes: file.size,
      }]);
    });
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach(file => {
      setAttachments(prev => [...prev, {
        name: file.name,
        url: URL.createObjectURL(file),
        mimeType: file.type,
        sizeBytes: file.size,
      }]);
    });
  }, []);

  // ─── Send message ────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    if (!messageInput.trim() || !activeConvId || isSending) return;
    setIsSending(true);
    sendMessageMutation.mutate({
      conversationId: activeConvId,
      body: messageInput.trim(),
      attachments,
    });
  }, [messageInput, activeConvId, isSending, attachments, sendMessageMutation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ─── Create conversation ─────────────────────────────────────────────────────

  const handleCreateConv = useCallback(() => {
    if (!newConvTitle.trim()) return;
    createConvMutation.mutate({ title: newConvTitle.trim(), type: "ai" });
  }, [newConvTitle, createConvMutation]);

  const handleQuickStart = useCallback(() => {
    const title = t("New Conversation", "محادثة جديدة") + " " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    createConvMutation.mutate({ title, type: "ai" });
  }, [t, createConvMutation]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  const activeConv = conversations.find(c => c.id === activeConvId);

  return (
    <TooltipProvider>
      <div className="flex h-[calc(100vh-4rem)] bg-[#05080F] text-white overflow-hidden relative" dir={isRTL ? "rtl" : "ltr"}>

        {/* ── Voice Mode Panel (slide-in overlay) ── */}
        {voiceModeOpen && (
          <div className="absolute inset-y-0 right-0 w-80 z-30 shadow-2xl shadow-black/50">
            <VoiceChat onClose={() => setVoiceModeOpen(false)} />
          </div>
        )}

        {/* ── Sidebar ── */}
        <div className="w-72 flex-shrink-0 border-r border-white/10 flex flex-col bg-[#0A0F1E]">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Sparkles className="w-4 h-4 text-[#05080F]" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">NEO Chat</div>
                <div className="text-white/40 text-[10px] tracking-widest uppercase">
                  {t("AI Workspace", "مساحة العمل الذكية")}
                </div>
              </div>
            </div>

            {/* New conversation */}
            {isCreatingConv ? (
              <div className="flex gap-2">
                <Input
                  value={newConvTitle}
                  onChange={e => setNewConvTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreateConv()}
                  placeholder={t("Conversation name...", "اسم المحادثة...")}
                  className="h-8 text-xs bg-white/5 border-white/20 text-white placeholder:text-white/30"
                  autoFocus
                />
                <Button size="sm" className="h-8 px-2 bg-amber-500 hover:bg-amber-400 text-[#05080F]" onClick={handleCreateConv} disabled={createConvMutation.isPending}>
                  {createConvMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
                </Button>
                <Button size="sm" variant="ghost" className="h-8 px-2 text-white/40 hover:text-white" onClick={() => setIsCreatingConv(false)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-8 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs"
                  onClick={handleQuickStart}
                  disabled={createConvMutation.isPending}
                >
                  {createConvMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                  {t("New Chat", "محادثة جديدة")}
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 px-2 text-white/40 hover:text-white" onClick={() => setIsCreatingConv(true)}>
                      <MessageSquare className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("Named conversation", "محادثة مسماة")}</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Conversation list */}
          <ScrollArea className="flex-1">
            {convsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-5 h-5 animate-spin text-white/30" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <Bot className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/30 text-xs">{t("No conversations yet", "لا توجد محادثات بعد")}</p>
                <p className="text-white/20 text-[10px] mt-1">{t("Start a new chat above", "ابدأ محادثة جديدة أعلاه")}</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {conversations.map(conv => {
                  const engineCfg = conv.lastEngine ? ENGINE_CONFIG[conv.lastEngine as keyof typeof ENGINE_CONFIG] : null;
                  const EngineIcon = engineCfg?.icon;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-150 group ${
                        activeConvId === conv.id
                          ? "bg-amber-500/15 border border-amber-500/30"
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-white/90 text-xs font-medium truncate">{conv.title}</div>
                          {conv.lastMessagePreview && (
                            <div className="text-white/30 text-[10px] truncate mt-0.5">{conv.lastMessagePreview}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {engineCfg && EngineIcon && (
                            <div className={`w-4 h-4 rounded flex items-center justify-center border ${engineCfg.colorClass}`}>
                              <EngineIcon className="w-2.5 h-2.5" />
                            </div>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); archiveMutation.mutate({ conversationId: conv.id }); }}
                            className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/60 transition-opacity"
                          >
                            <Archive className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Engine legend */}
          <div className="p-3 border-t border-white/10 space-y-1.5">
            <div className="text-white/30 text-[9px] uppercase tracking-widest mb-2">{t("AI Routing Engines", "محركات التوجيه الذكي")}</div>
            {Object.entries(ENGINE_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${cfg.colorClass}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="text-white/60 text-[10px] font-medium">{isRTL ? cfg.labelAr : cfg.labelEn}</span>
                    <span className="text-white/25 text-[9px] ml-1">{isRTL ? cfg.descAr : cfg.descEn}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Main Chat Area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeConvId && activeConv ? (
            <>
              {/* Chat header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0A0F1E]/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-500/30 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{activeConv.title}</div>
                    <div className="text-white/40 text-[10px]">
                      {t("NEO AI Assistant", "مساعد NEO الذكي")} · {messages.length} {t("messages", "رسالة")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeConv.lastEngine && (
                    <Badge className={`text-[10px] border ${ENGINE_CONFIG[activeConv.lastEngine as keyof typeof ENGINE_CONFIG]?.colorClass}`}>
                      {isRTL
                        ? ENGINE_CONFIG[activeConv.lastEngine as keyof typeof ENGINE_CONFIG]?.labelAr
                        : ENGINE_CONFIG[activeConv.lastEngine as keyof typeof ENGINE_CONFIG]?.labelEn}
                    </Badge>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-8 w-8 p-0 transition-colors ${
                          voiceModeOpen
                            ? "text-amber-400 bg-amber-500/20 hover:bg-amber-500/30"
                            : "text-white/40 hover:text-amber-400 hover:bg-amber-500/10"
                        }`}
                        onClick={() => setVoiceModeOpen(v => !v)}
                      >
                        <Mic className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {voiceModeOpen
                        ? t("Close Voice Mode", "إغلاق وضع الصوت")
                        : t("Open Voice Mode", "فتح وضع الصوت")}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-6 py-4">
                {msgsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-white/30" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/10 to-amber-600/10 border border-amber-500/20 flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-amber-400/60" />
                    </div>
                    <div className="text-white/50 font-medium mb-1">{t("Start the conversation", "ابدأ المحادثة")}</div>
                    <div className="text-white/25 text-sm max-w-xs">
                      {t(
                        "Ask NEO anything — operational tasks, financial analysis, project status, or strategic advice.",
                        "اسأل NEO أي شيء — مهام تشغيلية، تحليل مالي، حالة المشروع، أو نصيحة استراتيجية."
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map(msg => {
                      const isUser = msg.senderType === "user";
                      const engineCfg = msg.engine ? ENGINE_CONFIG[msg.engine as keyof typeof ENGINE_CONFIG] : null;
                      const EngineIcon = engineCfg?.icon;
                      const routingScore = (msg.routingScore ?? null) as RoutingScore | null;

                      return (
                        <div key={msg.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                          {/* Avatar */}
                          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                            isUser
                              ? "bg-gradient-to-br from-amber-400 to-amber-600"
                              : "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10"
                          }`}>
                            {isUser
                              ? <User className="w-4 h-4 text-[#05080F]" />
                              : <Bot className="w-4 h-4 text-white/70" />
                            }
                          </div>

                          {/* Bubble */}
                          <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
                            {/* Engine badge for AI messages */}
                            {!isUser && engineCfg && EngineIcon && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] cursor-default ${engineCfg.colorClass}`}>
                                    <EngineIcon className="w-2.5 h-2.5" />
                                    <span>{isRTL ? engineCfg.labelAr : engineCfg.labelEn}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs max-w-xs">
                                  <div className="font-medium mb-1">{isRTL ? engineCfg.descAr : engineCfg.descEn}</div>
                                  {routingScore && (
                                    <div className="text-[10px] text-white/60 space-y-0.5">
                                      <div>Manus: {routingScore.manusScore ?? 0} · GPT: {routingScore.gptScore ?? 0} · Hybrid boost: {routingScore.hybridBoost ?? 0}</div>
                                      {routingScore.keywordHits && routingScore.keywordHits.length > 0 && (
                                        <div>Keywords: {routingScore.keywordHits.join(", ")}</div>
                                      )}
                                    </div>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            )}

                            <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                              isUser
                                ? "bg-amber-500 text-[#05080F] font-medium rounded-tr-sm"
                                : "bg-white/5 border border-white/10 text-white/90 rounded-tl-sm"
                            }`}>
                              {isUser ? (
                                <span>{String(msg.body ?? "")}</span>
                              ) : (
                                <div className="prose prose-invert prose-sm max-w-none">
                                  <Streamdown children={String(msg.body ?? "")} />
                                </div>
                              )}
                            </div>

                            {/* Attachments */}
                            {(() => { const atts = Array.isArray(msg.attachments) ? (msg.attachments as Attachment[]) : []; return atts.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {atts.map((att, i) => (
                                  <a
                                    key={i}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors"
                                  >
                                    <Paperclip className="w-2.5 h-2.5" />
                                    {att.name}
                                  </a>                                ))}
                              </div>
                            ) : null; })()}
                            {/* Timestamp */}
                            <div className="text-[9px] text-white/25 px-1">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Sending indicator */}
                    {isSending && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white/70" />
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Composer */}
              <div
                className={`p-4 border-t border-white/10 bg-[#0A0F1E]/50 transition-all ${isDragging ? "ring-2 ring-amber-500/50 ring-inset" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* Drag overlay hint */}
                {isDragging && (
                  <div className="absolute inset-0 flex items-center justify-center bg-amber-500/10 border-2 border-dashed border-amber-500/50 rounded-lg z-10 pointer-events-none">
                    <div className="text-amber-400 font-medium text-sm flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      {t("Drop files to attach", "أفلت الملفات للإرفاق")}
                    </div>
                  </div>
                )}

                {/* Attachment previews */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {attachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-xs text-white/70">
                        <Paperclip className="w-3 h-3 text-amber-400/70" />
                        <span className="max-w-[120px] truncate">{att.name}</span>
                        <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-white/30 hover:text-white/70">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 items-end">
                  {/* File attach button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 p-0 text-white/40 hover:text-white/70 hover:bg-white/5 flex-shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("Attach file", "إرفاق ملف")}</TooltipContent>
                  </Tooltip>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />

                  {/* Textarea */}
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t("Ask NEO anything... (Enter to send, Shift+Enter for new line)", "اسأل NEO أي شيء... (Enter للإرسال، Shift+Enter لسطر جديد)")}
                      rows={1}
                      style={{ resize: "none", minHeight: "40px", maxHeight: "120px" }}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                      onInput={e => {
                        const el = e.currentTarget;
                        el.style.height = "auto";
                        el.style.height = Math.min(el.scrollHeight, 120) + "px";
                      }}
                    />
                  </div>

                  {/* Send button */}
                  <Button
                    size="sm"
                    className="h-10 w-10 p-0 bg-amber-500 hover:bg-amber-400 text-[#05080F] flex-shrink-0 shadow-lg shadow-amber-500/20"
                    onClick={handleSend}
                    disabled={!messageInput.trim() || isSending}
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between mt-2 px-1">
                  <div className="flex items-center gap-1 text-[10px] text-white/20">
                    <Zap className="w-2.5 h-2.5" />
                    {t("NEO auto-routes to Manus, GPT, or Hybrid based on your request", "NEO يوجه تلقائياً إلى مانوس أو GPT أو هجين بناءً على طلبك")}
                  </div>
                  <div className="text-[10px] text-white/15">{messageInput.length}/10000</div>
                </div>
              </div>
            </>
          ) : (
            /* Empty state — no conversation selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400/10 to-amber-600/10 border border-amber-500/20 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-amber-400/50" />
              </div>
              <h2 className="text-white/80 text-xl font-bold mb-2">{t("NEO Chat", "محادثة NEO")}</h2>
              <p className="text-white/40 text-sm max-w-sm mb-6">
                {t(
                  "Your AI-powered workspace. Ask operational questions, get financial analysis, manage projects, and more.",
                  "مساحة عملك الذكية. اطرح أسئلة تشغيلية، احصل على تحليل مالي، أدر المشاريع، والمزيد."
                )}
              </p>

              {/* Engine cards */}
              <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-lg">
                {Object.entries(ENGINE_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <div key={key} className={`p-3 rounded-xl border ${cfg.colorClass} text-center`}>
                      <Icon className="w-5 h-5 mx-auto mb-1.5" />
                      <div className="text-xs font-semibold">{isRTL ? cfg.labelAr : cfg.labelEn}</div>
                      <div className="text-[9px] opacity-70 mt-0.5">{isRTL ? cfg.descAr : cfg.descEn}</div>
                    </div>
                  );
                })}
              </div>

              <Button
                className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-semibold px-6"
                onClick={handleQuickStart}
                disabled={createConvMutation.isPending}
              >
                {createConvMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {t("Start New Conversation", "ابدأ محادثة جديدة")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
