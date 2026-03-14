/**
 * NEO AI Chat Context — Shared chat engine used by Portal Dashboard and Meeting Module
 * Provides: message state, send logic, typing indicator, conversation history
 * Language-aware: responds in Arabic or English based on LanguageContext
 */
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "neo" | "system";
  content: string;
  timestamp: Date;
  module?: string; // which AI module handled this
  engine?: "manus" | "gpt4"; // which engine was used
  isTyping?: boolean;
}

interface NEOChatContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  sendMessage: (text: string, lang?: "en" | "ar") => void;
  clearMessages: () => void;
  addSystemMessage: (content: string) => void;
}

const NEOChatContext = createContext<NEOChatContextType | null>(null);

// Simulated NEO AI responses — in production this calls the real Manus/GPT-4 API
const NEO_RESPONSES_EN: Record<string, string[]> = {
  greeting: [
    "Hello! I'm NEO, your AI business assistant. I'm running on the Hybrid Core (80% Manus + 20% GPT-4). How can I assist you today?",
    "Welcome back! NEO AI Core is online and ready. What would you like to work on?",
  ],
  hr: [
    "I can help with HR tasks. I have access to OrangeHRM and can process leave requests, check attendance, or retrieve employee records. What do you need?",
    "For HR operations, I can query employee data, process payroll requests, or schedule performance reviews. Please describe what you need.",
  ],
  finance: [
    "Connecting to Odoo 19 ERP... I can process invoices, check budget status, create journal entries, or generate financial reports. What transaction would you like to process?",
    "Financial AI module activated. I can handle accounts payable/receivable, budget forecasting, or expense approvals. Please describe the transaction.",
  ],
  procurement: [
    "Smart Procurement module engaged. I can create purchase orders, check vendor lists, or initiate approval workflows. For amounts above your authority limit, I'll route to ASTRA AMG for approval. What do you need?",
  ],
  meeting: [
    "Meeting Assistant active. I'm recording this session and will generate a full transcript, action items, and analysis report when the meeting ends. What would you like to discuss?",
    "I'm your ASTRA Meeting Assistant. I can take notes, track decisions, assign action items, and generate a post-meeting report. How can I help?",
  ],
  legal: [
    "Legal AI module engaged. I can review contracts, extract key obligations, flag risk clauses, or draft standard agreements. Please share the document or describe what you need.",
  ],
  qms: [
    "QMS AI active. I can help with ISO 9001 compliance checks, non-conformance reports, audit scheduling, or document control. What quality management task do you need?",
  ],
  default: [
    "I've received your request. Let me analyze this and route it to the appropriate module. One moment...",
    "Processing your request through the NEO Orchestration Core. I'll gather the required data and present it for your approval before executing any action.",
    "Understood. I'm checking the relevant systems and will present you with options. Please confirm before I proceed with any transaction.",
    "I can help with that. Let me access the relevant data from our integrated systems. Would you like me to proceed?",
  ],
};

const NEO_RESPONSES_AR: Record<string, string[]> = {
  greeting: [
    "مرحباً! أنا نيو، مساعدك الذكي للأعمال. أعمل على النواة الهجينة (80% مانوس + 20% GPT-4). كيف يمكنني مساعدتك اليوم؟",
    "أهلاً بعودتك! نظام نيو الذكي متصل وجاهز. بماذا تريد أن نبدأ؟",
  ],
  hr: [
    "يمكنني المساعدة في مهام الموارد البشرية. لدي وصول إلى نظام OrangeHRM ويمكنني معالجة طلبات الإجازات أو التحقق من الحضور أو استرداد سجلات الموظفين. ماذا تحتاج؟",
  ],
  finance: [
    "جاري الاتصال بنظام Odoo 19... يمكنني معالجة الفواتير أو التحقق من الميزانية أو إنشاء قيود محاسبية أو إنشاء تقارير مالية. ما المعاملة التي تريد معالجتها؟",
  ],
  meeting: [
    "مساعد الاجتماعات نشط. أنا أسجل هذه الجلسة وسأنشئ نصاً كاملاً وبنوداً للعمل وتقرير تحليلي عند انتهاء الاجتماع. ماذا تريد أن تناقش؟",
  ],
  default: [
    "تلقيت طلبك. دعني أحلله وأوجهه إلى الوحدة المناسبة. لحظة من فضلك...",
    "جاري معالجة طلبك من خلال نواة نيو التنسيقية. سأجمع البيانات المطلوبة وأعرضها عليك للموافقة قبل تنفيذ أي إجراء.",
    "مفهوم. أنا أتحقق من الأنظمة ذات الصلة وسأقدم لك الخيارات. يرجى التأكيد قبل المتابعة في أي معاملة.",
  ],
};

function detectIntent(text: string): string {
  const lower = text.toLowerCase();
  if (/hello|hi|مرحب|أهلا|السلام/.test(lower)) return "greeting";
  if (/hr|leave|employee|salary|موارد|إجازة|موظف/.test(lower)) return "hr";
  if (/invoice|payment|budget|finance|فاتورة|ميزانية|مالي/.test(lower)) return "finance";
  if (/purchase|vendor|procurement|مشتريات|مورد/.test(lower)) return "procurement";
  if (/meeting|agenda|transcript|اجتماع|محضر/.test(lower)) return "meeting";
  if (/contract|legal|agreement|عقد|قانوني/.test(lower)) return "legal";
  if (/iso|quality|audit|nonconformance|جودة|تدقيق/.test(lower)) return "qms";
  return "default";
}

function pickResponse(intent: string, lang: "en" | "ar"): { content: string; engine: "manus" | "gpt4"; module: string } {
  const map = lang === "ar" ? NEO_RESPONSES_AR : NEO_RESPONSES_EN;
  const responses = map[intent] || map["default"];
  const content = responses[Math.floor(Math.random() * responses.length)];
  // GPT-4 handles legal and complex finance, Manus handles everything else
  const engine: "manus" | "gpt4" = (intent === "legal" || intent === "finance") ? "gpt4" : "manus";
  const moduleMap: Record<string, string> = {
    greeting: "Conversational AI", hr: "HR Integration", finance: "Financial AI",
    procurement: "Smart Procurement", meeting: "Meeting Assistant",
    legal: "Legal AI", qms: "QMS AI", default: "Conversational AI",
  };
  return { content, engine, module: moduleMap[intent] || "Conversational AI" };
}

export function NEOChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "neo",
      content: "NEO AI Core online. Hybrid engine active — 80% Manus + 20% GPT-4. I'm ready to assist with HR, Finance, Procurement, Legal, QMS, and all business operations. How can I help you today?",
      timestamp: new Date(),
      module: "Conversational AI",
      engine: "manus",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback((text: string, lang: "en" | "ar" = "en") => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate NEO thinking delay (0.8–2.2s)
    const delay = 800 + Math.random() * 1400;
    setTimeout(() => {
      const intent = detectIntent(text);
      const { content, engine, module } = pickResponse(intent, lang);
      const neoMsg: ChatMessage = {
        id: `neo-${Date.now()}`,
        role: "neo",
        content,
        timestamp: new Date(),
        module,
        engine,
      };
      setMessages((prev) => [...prev, neoMsg]);
      setIsTyping(false);
    }, delay);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([{
      id: "welcome-reset",
      role: "neo",
      content: "NEO AI Core ready. New session started. How can I assist you?",
      timestamp: new Date(),
      module: "Conversational AI",
      engine: "manus",
    }]);
  }, []);

  const addSystemMessage = useCallback((content: string) => {
    setMessages((prev) => [...prev, {
      id: `sys-${Date.now()}`,
      role: "system",
      content,
      timestamp: new Date(),
    }]);
  }, []);

  return (
    <NEOChatContext.Provider value={{ messages, isTyping, sendMessage, clearMessages, addSystemMessage }}>
      {children}
    </NEOChatContext.Provider>
  );
}

export function useNEOChat() {
  const ctx = useContext(NEOChatContext);
  if (!ctx) throw new Error("useNEOChat must be used within NEOChatProvider");
  return ctx;
}
