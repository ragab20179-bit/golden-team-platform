/**
 * OdooAIDataEntry.tsx
 *
 * NEO AI-powered Odoo data entry.
 * Features:
 *  - Natural language instruction (English or Arabic)
 *  - Two-phase flow: parse → confirm → execute
 *  - Voice input via Web Speech API (mic button)
 *  - NEO FastAPI Bridge health indicator
 *  - Falls back to built-in LLM if bridge is not configured
 *
 * Design: "Prestige Dark" — deep navy/charcoal, gold accents.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bot, Send, CheckCircle2, XCircle, Loader2, Sparkles,
  ShoppingCart, FileText, CreditCard, Users, FolderKanban,
  TrendingUp, AlertCircle, Zap, ChevronRight, Mic, MicOff,
  Wifi, WifiOff, RefreshCw,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// ── Types ─────────────────────────────────────────────────────────────────────
type ParsedResult = {
  stage: "parsed";
  operation: string;
  fields: Record<string, unknown>;
  summary: string;
  missingFields: string[];
  parsedJson: string;
};

type ExecutedResult = {
  stage: "executed";
  operation: string;
  result: { success: boolean; id: unknown; message: string };
};

type BridgeMessage = {
  type: "message";
  content: string;
  source?: "bridge" | "builtin";
  requires_confirmation?: boolean;
};

type BridgePendingMessage = {
  type: "pending_confirmation";
  actions: Array<{ tool_call_id: string; tool_name: string; tool_args: Record<string, unknown> }>;
  message: string;
  source?: "bridge";
};

type ChatMessage =
  | { type: "user"; text: string }
  | { type: "parsed"; data: ParsedResult }
  | { type: "executed"; data: ExecutedResult }
  | { type: "error"; text: string }
  | { type: "info"; text: string }
  | { type: "bridge_message"; content: string; source?: string }
  | { type: "bridge_pending"; actions: BridgePendingMessage["actions"]; message: string };

// ── Operation metadata ────────────────────────────────────────────────────────
const OP_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  CREATE_PURCHASE_ORDER:    { label: "Create Purchase Order",    icon: ShoppingCart,  color: "text-blue-400" },
  CONFIRM_PURCHASE_ORDER:   { label: "Confirm Purchase Order",   icon: CheckCircle2,  color: "text-green-400" },
  CREATE_INVOICE:           { label: "Create Invoice",           icon: FileText,      color: "text-amber-400" },
  POST_INVOICE:             { label: "Post Invoice",             icon: FileText,      color: "text-amber-400" },
  REGISTER_PAYMENT:         { label: "Register Payment",         icon: CreditCard,    color: "text-emerald-400" },
  CREATE_CRM_LEAD:          { label: "Create CRM Opportunity",   icon: TrendingUp,    color: "text-purple-400" },
  UPDATE_CRM_LEAD_STAGE:    { label: "Update CRM Stage",         icon: TrendingUp,    color: "text-purple-400" },
  CREATE_PROJECT:           { label: "Create Project",           icon: FolderKanban,  color: "text-cyan-400" },
  CREATE_TASK:              { label: "Create Task",              icon: FolderKanban,  color: "text-cyan-400" },
  CREATE_LEAVE_REQUEST:     { label: "Create Leave Request",     icon: Users,         color: "text-rose-400" },
  UNKNOWN:                  { label: "Unknown Operation",        icon: AlertCircle,   color: "text-red-400" },
};

// ── Quick examples ────────────────────────────────────────────────────────────
const EXAMPLES_EN = [
  "Create a purchase order for 10 Office Chairs at SAR 500 each from Al-Rashidi Supplies",
  "Create a customer invoice for ABC Company for consulting services, SAR 15,000",
  "Add a CRM opportunity: Gulf Ventures, expected revenue SAR 200,000",
  "Create project: KDP Phase 3, start 2026-06-01",
];

const EXAMPLES_AR = [
  "أنشئ طلب شراء لـ 20 حاسوب محمول بسعر 3000 ريال للوحدة من مورد التقنية",
  "أنشئ فاتورة عميل لشركة الخليج مقابل خدمات استشارية بمبلغ 15,000 ريال",
  "أضف فرصة CRM: مجموعة المنصوري، الإيراد المتوقع 200,000 ريال",
  "أنشئ مشروع: مرحلة KDP 3، البداية 2026-06-01",
];

// ── Voice input hook ──────────────────────────────────────────────────────────
// Declare SpeechRecognition types for browsers that use webkit prefix
interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionCtor | undefined {
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"]) as SpeechRecognitionCtor | undefined;
}

function useVoiceInput(onTranscript: (text: string) => void, lang: string) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    setIsSupported(!!getSpeechRecognition());
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = lang === "ar" ? "ar-SA" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [lang, onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, isSupported, startListening, stopListening };
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OdooAIDataEntry() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      type: "info",
      text: isAr
        ? "مرحباً! أنا NEO، مساعد الذكاء الاصطناعي لـ Golden Team. أخبرني بما تريد إدخاله في Odoo وسأقوم بتنفيذه نيابةً عنك. يمكنك الكتابة أو استخدام الميكروفون."
        : "Hello! I'm NEO, the Golden Team AI assistant. Tell me what you want to enter into Odoo and I'll execute it for you. You can type or use the microphone.",
    },
  ]);
  const [input, setInput] = useState("");
  const [pendingParsed, setPendingParsed] = useState<ParsedResult | null>(null);
  const [pendingBridgeActions, setPendingBridgeActions] = useState<BridgePendingMessage["actions"] | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant" | "tool" | "system"; content: string }>>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // tRPC mutations
  const aiDataEntry = trpc.odoo.aiDataEntry.useMutation();
  const neoBridgeChat = trpc.odoo.neoBridgeChat.useMutation();
  const neoBridgeExecute = trpc.odoo.neoBridgeExecute.useMutation();

  // Bridge health
  const bridgeHealth = trpc.odoo.neoBridgeHealth.useQuery(undefined, {
    refetchInterval: 60_000,
    retry: false,
  });

  // Voice input
  const handleVoiceTranscript = useCallback((text: string) => {
    setInput(prev => prev ? prev + " " + text : text);
  }, []);
  const { isListening, isSupported, startListening, stopListening } = useVoiceInput(handleVoiceTranscript, lang);

  const isBusy = aiDataEntry.isPending || neoBridgeChat.isPending || neoBridgeExecute.isPending;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const examples = isAr ? EXAMPLES_AR : EXAMPLES_EN;

  // ── Send handler ─────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isBusy) return;
    setInput("");
    setMessages(prev => [...prev, { type: "user", text }]);

    const newHistory = [...chatHistory, { role: "user" as const, content: text }];
    setChatHistory(newHistory);

    // Try NEO Bridge first (if configured), then fall back to built-in aiDataEntry
    const bridgeConfigured = bridgeHealth.data?.configured;

    if (bridgeConfigured && bridgeHealth.data?.status === "ok") {
      // ── Bridge path ────────────────────────────────────────────────────────
      try {
        const result = await neoBridgeChat.mutateAsync({
          message: text,
          history: chatHistory,
          autoExecute: false,
        });

        const r = result as unknown as BridgeMessage | BridgePendingMessage;

        if (r.type === "pending_confirmation") {
          const pending = r as BridgePendingMessage;
          setPendingBridgeActions(pending.actions);
          setMessages(prev => [...prev, {
            type: "bridge_pending",
            actions: pending.actions,
            message: pending.message,
          }]);
          setChatHistory(prev => [...prev, { role: "assistant" as const, content: pending.message }]);
        } else {
          const msg = r as BridgeMessage;
          setMessages(prev => [...prev, {
            type: "bridge_message",
            content: msg.content ?? "",
            source: (result as Record<string, unknown>).source as string | undefined,
          }]);
          setChatHistory(prev => [...prev, { role: "assistant" as const, content: msg.content ?? "" }]);
        }
        return;
      } catch (err) {
        // Bridge failed — fall through to built-in
        console.warn("[NEO Bridge] chat failed, falling back:", err);
      }
    }

    // ── Built-in aiDataEntry path ──────────────────────────────────────────
    try {
      const result = await aiDataEntry.mutateAsync({ instruction: text, confirmed: false });
      if (result.stage === "parsed") {
        setMessages(prev => [...prev, { type: "parsed", data: result }]);
        setChatHistory(prev => [...prev, { role: "assistant" as const, content: result.summary }]);
        if (result.missingFields.length === 0 && result.operation !== "UNKNOWN") {
          setPendingParsed(result);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setMessages(prev => [...prev, { type: "error", text: msg }]);
    }
  };

  // ── Confirm built-in parsed operation ────────────────────────────────────────
  const handleConfirm = async (parsed: ParsedResult) => {
    setPendingParsed(null);
    setMessages(prev => [...prev, { type: "info", text: isAr ? "جارٍ التنفيذ في Odoo..." : "Executing in Odoo..." }]);

    try {
      const result = await aiDataEntry.mutateAsync({
        instruction: parsed.summary,
        confirmed: true,
        parsedOperation: parsed.parsedJson,
      });
      if (result.stage === "executed") {
        setMessages(prev => [...prev, { type: "executed", data: result }]);
        setChatHistory(prev => [...prev, { role: "assistant" as const, content: result.result.message }]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Execution failed";
      setMessages(prev => [...prev, { type: "error", text: msg }]);
    }
  };

  // ── Confirm bridge pending actions ────────────────────────────────────────────
  const handleBridgeConfirm = async (actions: BridgePendingMessage["actions"]) => {
    setPendingBridgeActions(null);
    setMessages(prev => [...prev, { type: "info", text: isAr ? "جارٍ التنفيذ في Odoo عبر NEO Bridge..." : "Executing in Odoo via NEO Bridge..." }]);

    try {
      const result = await neoBridgeExecute.mutateAsync({ actions });
      const allOk = result.success;
      const summary = result.results
        .map(r => `${r.tool_name}: ${r.success ? "✓" : "✗ " + (r.error ?? "")}`)
        .join(", ");

      setMessages(prev => [...prev, {
        type: "executed",
        data: {
          stage: "executed",
          operation: "BRIDGE_EXECUTE",
          result: {
            success: allOk,
            id: null,
            message: summary,
          },
        },
      }]);
      setChatHistory(prev => [...prev, { role: "assistant" as const, content: summary }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bridge execution failed";
      setMessages(prev => [...prev, { type: "error", text: msg }]);
    }
  };

  const handleCancel = () => {
    setPendingParsed(null);
    setPendingBridgeActions(null);
    setMessages(prev => [...prev, { type: "info", text: isAr ? "تم إلغاء العملية." : "Operation cancelled." }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Bridge status badge ───────────────────────────────────────────────────────
  const bridgeStatus = bridgeHealth.data;
  const bridgeOk = bridgeStatus?.configured && bridgeStatus?.status === "ok";
  const bridgeNotConfigured = !bridgeStatus?.configured;

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#05080F] text-white">

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 bg-[#0A0F1E]">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-[#05080F]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-lg leading-tight">
              {isAr ? "إدخال البيانات بالذكاء الاصطناعي" : "NEO AI Data Entry"}
            </h1>
            <p className="text-white/40 text-xs truncate">
              {isAr
                ? "اكتب أو تحدث بالعربية أو الإنجليزية — NEO سينفذ في Odoo"
                : "Type or speak in Arabic or English — NEO executes in Odoo"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="border-amber-400/30 text-amber-400 text-xs">
              <Zap className="w-3 h-3 mr-1" />
              {isAr ? "NEO AI" : "NEO AI"}
            </Badge>
            {/* Bridge status */}
            {bridgeNotConfigured ? (
              <Badge variant="outline" className="border-white/20 text-white/40 text-xs">
                <WifiOff className="w-3 h-3 mr-1" />
                {isAr ? "Bridge غير مُهيَّأ" : "Bridge not configured"}
              </Badge>
            ) : bridgeOk ? (
              <Badge variant="outline" className="border-green-400/30 text-green-400 text-xs">
                <Wifi className="w-3 h-3 mr-1" />
                {isAr ? "Bridge متصل" : "Bridge online"}
                {bridgeStatus.odooVersion && <span className="ml-1 opacity-60">v{bridgeStatus.odooVersion}</span>}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-red-400/30 text-red-400 text-xs">
                <WifiOff className="w-3 h-3 mr-1" />
                {isAr ? "Bridge غير متاح" : "Bridge offline"}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 border-white/10 bg-transparent text-white/40 hover:text-white hover:bg-white/10"
              onClick={() => bridgeHealth.refetch()}
              title="Refresh bridge status"
            >
              <RefreshCw className={`w-3 h-3 ${bridgeHealth.isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Quick Examples ── */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-white/5 bg-[#080C18]">
        <p className="text-white/30 text-xs mb-2">{isAr ? "أمثلة سريعة:" : "Quick examples:"}</p>
        <div className="flex gap-2 flex-wrap">
          {examples.slice(0, 3).map((ex, i) => (
            <button
              key={i}
              onClick={() => setInput(ex)}
              className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/50 hover:border-amber-400/40 hover:text-amber-400 transition-colors bg-white/5 hover:bg-amber-400/5 text-left"
            >
              {ex.length > 60 ? ex.slice(0, 60) + "…" : ex}
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages ── */}
      <ScrollArea className="flex-1 min-h-0 px-6 py-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} isAr={isAr} />
          ))}

          {/* Built-in confirmation card */}
          {pendingParsed && !pendingBridgeActions && (
            <ConfirmCard
              parsed={pendingParsed}
              isAr={isAr}
              onConfirm={() => handleConfirm(pendingParsed)}
              onCancel={handleCancel}
              isPending={isBusy}
            />
          )}

          {/* Bridge confirmation card */}
          {pendingBridgeActions && (
            <BridgeConfirmCard
              actions={pendingBridgeActions}
              isAr={isAr}
              onConfirm={() => handleBridgeConfirm(pendingBridgeActions)}
              onCancel={handleCancel}
              isPending={isBusy}
            />
          )}

          {/* Typing indicator */}
          {isBusy && !pendingParsed && !pendingBridgeActions && (
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isAr ? "NEO يعالج طلبك..." : "NEO is processing..."}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* ── Input ── */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-white/10 bg-[#0A0F1E]">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          {/* Voice button */}
          {isSupported && (
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isBusy}
              variant="outline"
              className={`h-[52px] w-[52px] p-0 rounded-xl flex-shrink-0 border transition-all ${
                isListening
                  ? "border-red-400/60 bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse"
                  : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
              }`}
              title={isListening ? (isAr ? "إيقاف التسجيل" : "Stop recording") : (isAr ? "تسجيل صوتي" : "Voice input")}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          )}

          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? (isAr ? "جارٍ الاستماع..." : "Listening...")
                : (isAr
                    ? "اكتب تعليماتك هنا... (Enter للإرسال، Shift+Enter لسطر جديد)"
                    : "Type your instruction here... (Enter to send, Shift+Enter for new line)")
            }
            className={`flex-1 min-h-[52px] max-h-32 resize-none bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-amber-400/40 focus:ring-amber-400/20 rounded-xl transition-all ${
              isListening ? "border-red-400/30 bg-red-500/5" : ""
            }`}
            dir={isAr ? "rtl" : "ltr"}
            disabled={isBusy}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isBusy}
            className="h-[52px] w-[52px] p-0 bg-amber-500 hover:bg-amber-400 text-[#05080F] rounded-xl shadow-lg shadow-amber-500/30 flex-shrink-0"
          >
            {isBusy ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-white/20 text-xs text-center mt-2">
          {isAr
            ? "NEO يقرأ تعليماتك ويطلب تأكيدك قبل أي تنفيذ في Odoo"
            : "NEO reads your instruction and asks for confirmation before executing in Odoo"}
        </p>
      </div>
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isAr }: { msg: ChatMessage; isAr: boolean }) {
  if (msg.type === "user") {
    return (
      <div className={`flex ${isAr ? "justify-start" : "justify-end"}`}>
        <div className="max-w-[80%] bg-amber-500/20 border border-amber-400/20 rounded-2xl rounded-tr-sm px-4 py-3 text-white text-sm" dir={isAr ? "rtl" : "ltr"}>
          {msg.text}
        </div>
      </div>
    );
  }

  if (msg.type === "info") {
    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-[#05080F]" />
        </div>
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 text-white/70 text-sm" dir={isAr ? "rtl" : "ltr"}>
          {msg.text}
        </div>
      </div>
    );
  }

  if (msg.type === "bridge_message") {
    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-[#05080F]" />
        </div>
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 space-y-1">
          <p className="text-white text-sm whitespace-pre-wrap" dir={isAr ? "rtl" : "ltr"}>{msg.content}</p>
          {msg.source && (
            <p className="text-white/30 text-xs">
              {msg.source === "bridge" ? "NEO Bridge" : "NEO Built-in"}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (msg.type === "bridge_pending") {
    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-[#05080F]" />
        </div>
        <div className="flex-1 bg-amber-500/10 border border-amber-400/20 rounded-2xl rounded-tl-sm px-4 py-3 space-y-2">
          <p className="text-amber-300 text-sm font-medium">
            {isAr ? "جاهز للتنفيذ — يرجى التأكيد أدناه" : "Ready to execute — please confirm below"}
          </p>
          <div className="space-y-1">
            {msg.actions.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-white/60">
                <ChevronRight className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span className="font-mono text-amber-400/80">{a.tool_name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === "error") {
    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
          <XCircle className="w-4 h-4 text-red-400" />
        </div>
        <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-2xl rounded-tl-sm px-4 py-3 text-red-300 text-sm">
          {msg.text}
        </div>
      </div>
    );
  }

  if (msg.type === "parsed") {
    const { data } = msg;
    const meta = OP_META[data.operation] ?? OP_META.UNKNOWN;
    const Icon = meta.icon;
    const hasMissing = data.missingFields.length > 0;

    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-[#05080F]" />
        </div>
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${meta.color}`} />
            <span className="text-white/60 text-xs font-medium uppercase tracking-wider">{meta.label}</span>
          </div>
          <p className="text-white text-sm" dir={isAr ? "rtl" : "ltr"}>{data.summary}</p>
          {hasMissing && (
            <div className="flex flex-wrap gap-1 mt-1">
              {data.missingFields.map(f => (
                <Badge key={f} variant="outline" className="border-amber-400/30 text-amber-400 text-xs">
                  {f}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (msg.type === "executed") {
    const { data } = msg;
    const success = data.result.success;
    return (
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${success ? "bg-green-500/20 border border-green-500/30" : "bg-red-500/20 border border-red-500/30"}`}>
          {success ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
        </div>
        <div className={`flex-1 rounded-2xl rounded-tl-sm px-4 py-3 ${success ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
          <p className={`text-sm font-medium ${success ? "text-green-300" : "text-red-300"}`}>
            {success ? (isAr ? "تم التنفيذ بنجاح" : "Executed Successfully") : (isAr ? "فشل التنفيذ" : "Execution Failed")}
          </p>
          <p className="text-white/60 text-xs mt-1">{data.result.message}</p>
          {success && data.result.id !== undefined && data.result.id !== null && (
            <p className="text-white/40 text-xs mt-0.5">
              {isAr ? `معرّف السجل: ${String(data.result.id)}` : `Record ID: ${String(data.result.id)}`}
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ── Built-in Confirmation Card ────────────────────────────────────────────────
function ConfirmCard({
  parsed, isAr, onConfirm, onCancel, isPending,
}: {
  parsed: ParsedResult;
  isAr: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const meta = OP_META[parsed.operation] ?? OP_META.UNKNOWN;
  const Icon = meta.icon;

  return (
    <Card className="bg-[#0D1525] border border-amber-400/30 shadow-xl shadow-amber-500/10 max-w-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-sm">
          <Icon className={`w-4 h-4 ${meta.color}`} />
          {isAr ? "تأكيد العملية" : "Confirm Operation"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-white/80 text-sm" dir={isAr ? "rtl" : "ltr"}>{parsed.summary}</p>
        <Separator className="bg-white/10" />
        <div className="space-y-1">
          {Object.entries(parsed.fields).map(([key, val]) => (
            <div key={key} className="flex items-start gap-2 text-xs">
              <ChevronRight className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
              <span className="text-white/40 font-mono">{key}:</span>
              <span className="text-white/70 break-all">{JSON.stringify(val)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-[#05080F] font-semibold text-sm h-9"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />{isAr ? "جارٍ التنفيذ..." : "Executing..."}</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-2" />{isAr ? "تأكيد وتنفيذ" : "Confirm & Execute"}</>
            )}
          </Button>
          <Button
            onClick={onCancel}
            disabled={isPending}
            variant="outline"
            className="flex-1 border-white/20 text-white/70 hover:bg-white/5 bg-transparent text-sm h-9"
          >
            <XCircle className="w-4 h-4 mr-2" />
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Bridge Confirmation Card ──────────────────────────────────────────────────
function BridgeConfirmCard({
  actions, isAr, onConfirm, onCancel, isPending,
}: {
  actions: BridgePendingMessage["actions"];
  isAr: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <Card className="bg-[#0D1525] border border-amber-400/30 shadow-xl shadow-amber-500/10 max-w-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-sm">
          <Zap className="w-4 h-4 text-amber-400" />
          {isAr ? "تأكيد عمليات NEO Bridge" : "Confirm NEO Bridge Actions"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-white/60 text-xs">
          {isAr
            ? `سيتم تنفيذ ${actions.length} عملية في Odoo`
            : `${actions.length} operation${actions.length !== 1 ? "s" : ""} will be executed in Odoo`}
        </p>
        <Separator className="bg-white/10" />
        <div className="space-y-2">
          {actions.map((action, i) => (
            <div key={i} className="bg-white/5 rounded-lg px-3 py-2 space-y-1">
              <div className="flex items-center gap-2">
                <ChevronRight className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span className="text-amber-400 text-xs font-mono font-medium">{action.tool_name}</span>
              </div>
              <div className="pl-5 space-y-0.5">
                {Object.entries(action.tool_args).slice(0, 5).map(([k, v]) => (
                  <div key={k} className="flex items-start gap-2 text-xs">
                    <span className="text-white/30 font-mono">{k}:</span>
                    <span className="text-white/60 break-all">{JSON.stringify(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-[#05080F] font-semibold text-sm h-9"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />{isAr ? "جارٍ التنفيذ..." : "Executing..."}</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-2" />{isAr ? "تأكيد وتنفيذ" : "Confirm & Execute"}</>
            )}
          </Button>
          <Button
            onClick={onCancel}
            disabled={isPending}
            variant="outline"
            className="flex-1 border-white/20 text-white/70 hover:bg-white/5 bg-transparent text-sm h-9"
          >
            <XCircle className="w-4 h-4 mr-2" />
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
