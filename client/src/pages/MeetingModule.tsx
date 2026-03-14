/**
 * NEO AI Meeting Module — ASTRA Meeting Assistant
 * Design: Neural Depth — deep space dark, glass morphism, Space Grotesk
 * Features: Meeting scheduler, live transcription, face/body language analysis,
 *           bilingual AR/EN support, post-meeting report generation, task extraction
 */
import { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import NEOChatWindow from "@/components/NEOChatWindow";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Video, Mic, MicOff, VideoOff, Users, Clock, FileText,
  Brain, Zap, Globe, BarChart2, CheckCircle2, AlertCircle,
  Calendar, Play, Square, Download, MessageSquare, Eye,
  Activity, Star, ChevronRight, Plus, Search, Filter, MessageCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const FADE = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const UPCOMING_MEETINGS = [
  {
    id: 1, title: "Q2 Financial Review", time: "Today, 14:00", duration: "60 min",
    participants: ["Ahmed Al-Rashid", "Sara Mohammed", "Omar Khalid"],
    type: "Financial", lang: "AR/EN", status: "scheduled",
    agenda: ["Revenue analysis", "Cost optimization", "Q3 forecast"],
  },
  {
    id: 2, title: "IT Infrastructure Planning", time: "Tomorrow, 10:00", duration: "90 min",
    participants: ["Khalid Ibrahim", "Nora Hassan", "Tech Team"],
    type: "Technical", lang: "EN", status: "scheduled",
    agenda: ["Docker deployment review", "NEO AI integration", "Security audit"],
  },
  {
    id: 3, title: "Client Onboarding — ACME Corp", time: "Mar 16, 09:00", duration: "45 min",
    participants: ["Sales Team", "Client Representatives"],
    type: "Client", lang: "AR/EN", status: "scheduled",
    agenda: ["Platform demo", "Contract review", "Next steps"],
  },
];

const PAST_MEETINGS = [
  {
    id: 4, title: "Weekly Operations Standup", date: "Mar 13, 2026", duration: "32 min",
    participants: 8, sentiment: 87, tasks: 5, decisions: 3,
    transcription: true, report: true, lang: "AR/EN",
  },
  {
    id: 5, title: "NEO AI Architecture Review", date: "Mar 12, 2026", duration: "78 min",
    participants: 4, sentiment: 92, tasks: 12, decisions: 7,
    transcription: true, report: true, lang: "EN",
  },
  {
    id: 6, title: "HR Policy Update Discussion", date: "Mar 10, 2026", duration: "55 min",
    participants: 6, sentiment: 74, tasks: 8, decisions: 4,
    transcription: true, report: true, lang: "AR",
  },
];

const AI_CAPABILITIES = [
  { icon: Mic, label: "Live Transcription", desc: "Real-time bilingual Arabic/English transcription with speaker identification", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { icon: Eye, label: "Face Recognition", desc: "Automatic participant identification and attendance tracking", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { icon: Activity, label: "Body Language Analysis", desc: "Engagement scoring, sentiment detection, and personality profiling from video", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { icon: Brain, label: "NEO Intelligence", desc: "Real-time topic extraction, decision capture, and action item generation", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { icon: FileText, label: "Auto Report Generation", desc: "Full meeting report with transcription, analysis, and task plan after meeting ends", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { icon: Globe, label: "Bilingual AR/EN", desc: "Seamless Arabic and English language switching with RTL/LTR support", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
];

const MEETING_FLOW_STEPS = [
  { step: "01", title: "Pre-Meeting Brief", desc: "NEO prepares agenda summary, participant profiles, and relevant documents 15 minutes before the meeting", icon: Calendar },
  { step: "02", title: "Live Transcription", desc: "Real-time bilingual transcription with speaker diarization. NEO greets participants and introduces itself in 5 seconds", icon: Mic },
  { step: "03", title: "Behavioural Analysis", desc: "Continuous face recognition, engagement scoring, and body language analysis throughout the session", icon: Eye },
  { step: "04", title: "Decision Capture", desc: "NEO automatically flags decisions, action items, and key discussion points in real time", icon: Brain },
  { step: "05", title: "Post-Meeting Review", desc: "Full report and task plan shown in chat before final report generation — user can add specific analysis", icon: BarChart2 },
  { step: "06", title: "Report & Sync", desc: "Final report exported to Knowledge Base, tasks pushed to ASTRA PM, decisions logged to Audit trail", icon: CheckCircle2 },
];

export default function MeetingModule() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "live">("upcoming");
  const [selectedMeeting, setSelectedMeeting] = useState<number | null>(null);
  const [liveActive, setLiveActive] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [showNEOChat, setShowNEOChat] = useState(false);
  const { lang, t } = useLanguage();
  const [liveTranscript] = useState([
    { speaker: "Ahmed Al-Rashid", lang: "AR", text: "نبدأ بمراجعة أداء الربع الثاني...", time: "14:02" },
    { speaker: "NEO AI", lang: "EN", text: "Transcribing: 'Let us begin with the Q2 performance review...' — Sentiment: Neutral (82%)", time: "14:02", isNeo: true },
    { speaker: "Sara Mohammed", lang: "EN", text: "Revenue is up 18% vs Q1, driven by IT Solutions contracts.", time: "14:04" },
    { speaker: "NEO AI", lang: "EN", text: "📌 Key Metric Captured: +18% revenue growth Q2 vs Q1. Action item detected.", time: "14:04", isNeo: true },
    { speaker: "Omar Khalid", lang: "AR", text: "هل يمكننا مناقشة تحسين تكاليف البنية التحتية؟", time: "14:06" },
    { speaker: "NEO AI", lang: "EN", text: "Transcribing: 'Can we discuss optimising infrastructure costs?' — Topic shift: Cost Management", time: "14:06", isNeo: true },
  ]);

  return (
    <PortalLayout
      title="NEO AI Meeting Assistant"
      subtitle="ASTRA Meeting Intelligence — Bilingual AR/EN"
      badge="LIVE AI"
      badgeColor="text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
    >
      <div className="p-4 md:p-6 space-y-6">

        {/* Header Stats */}
        <motion.div
          variants={FADE} initial="hidden" animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            { label: "Meetings This Month", value: "24", icon: Calendar, color: "text-blue-400", sub: "+6 vs last month" },
            { label: "Hours Transcribed", value: "38.5h", icon: Mic, color: "text-cyan-400", sub: "Bilingual AR/EN" },
            { label: "Tasks Generated", value: "147", icon: CheckCircle2, color: "text-emerald-400", sub: "Auto-extracted by NEO" },
            { label: "Avg Engagement", value: "84%", icon: Activity, color: "text-violet-400", sub: "Body language score" },
          ].map((stat, i) => (
            <motion.div key={i} variants={FADE} transition={{ delay: i * 0.07 }}
              className="glass-card rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-bold ${stat.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{stat.value}</div>
              <div className="text-[11px] text-white/30 mt-1">{stat.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* AI Capabilities Grid */}
        <motion.div variants={FADE} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3">NEO Meeting Intelligence Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {AI_CAPABILITIES.map((cap, i) => (
              <motion.div key={i} variants={FADE} transition={{ delay: 0.1 + i * 0.06 }}
                className={`rounded-xl p-4 border ${cap.bg} flex items-start gap-3`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cap.bg} border`}>
                  <cap.icon className={`w-4 h-4 ${cap.color}`} />
                </div>
                <div>
                  <div className={`text-sm font-semibold ${cap.color} mb-1`}>{cap.label}</div>
                  <div className="text-xs text-white/40 leading-relaxed">{cap.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Meeting Flow */}
        <motion.div variants={FADE} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3">ASTRA Meeting Intelligence Flow</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {MEETING_FLOW_STEPS.map((step, i) => (
              <motion.div key={i} variants={FADE} transition={{ delay: 0.2 + i * 0.06 }}
                className="glass-card rounded-xl p-4 border border-white/5 flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-blue-400">{step.step}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white mb-1">{step.title}</div>
                  <div className="text-xs text-white/40 leading-relaxed">{step.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={FADE} initial="hidden" animate="show" transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-1 mb-4 p-1 rounded-xl bg-white/3 border border-white/5 w-fit">
            {(["upcoming", "past", "live"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
                  ${activeTab === tab ? "bg-blue-600 text-white shadow-lg" : "text-white/40 hover:text-white"}`}>
                {tab === "live" ? "🔴 Live Session" : tab === "upcoming" ? "📅 Upcoming" : "📋 Past Meetings"}
              </button>
            ))}
            <Button size="sm" className="ml-2 bg-blue-600 hover:bg-blue-700 text-white text-xs"
              onClick={() => toast.success("Meeting scheduler opening...")}>
              <Plus className="w-3 h-3 mr-1" /> Schedule
            </Button>
          </div>

          {/* Upcoming Meetings */}
          {activeTab === "upcoming" && (
            <div className="space-y-3">
              {UPCOMING_MEETINGS.map((meeting, i) => (
                <motion.div key={meeting.id} variants={FADE} transition={{ delay: i * 0.07 }}
                  className="glass-card rounded-xl p-4 border border-white/5 hover:border-blue-500/20 transition-all cursor-pointer"
                  onClick={() => setSelectedMeeting(selectedMeeting === meeting.id ? null : meeting.id)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Video className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white">{meeting.title}</span>
                          <Badge className="text-[10px] border border-blue-500/30 bg-blue-500/10 text-blue-300">{meeting.type}</Badge>
                          <Badge className="text-[10px] border border-violet-500/30 bg-violet-500/10 text-violet-300">🌐 {meeting.lang}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{meeting.time}</span>
                          <span>{meeting.duration}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{meeting.participants.length} participants</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                        onClick={(e) => { e.stopPropagation(); setActiveTab("live"); setLiveActive(true); toast.success("Joining meeting with NEO AI..."); }}>
                        <Play className="w-3 h-3 mr-1" /> Join
                      </Button>
                      <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${selectedMeeting === meeting.id ? "rotate-90" : ""}`} />
                    </div>
                  </div>
                  {selectedMeeting === meeting.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-4 border-t border-white/5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Agenda</div>
                          {meeting.agenda.map((item, j) => (
                            <div key={j} className="flex items-center gap-2 text-xs text-white/60 mb-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              {item}
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Participants</div>
                          {meeting.participants.map((p, j) => (
                            <div key={j} className="flex items-center gap-2 text-xs text-white/60 mb-1">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                                {p.charAt(0)}
                              </div>
                              {p}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <div className="flex items-center gap-2 text-xs text-blue-300">
                          <Brain className="w-3 h-3" />
                          <span className="font-semibold">NEO Pre-Meeting Brief</span>
                        </div>
                        <p className="text-xs text-white/40 mt-1">NEO will prepare participant profiles, relevant documents, and agenda summary 15 minutes before the meeting. Language: {meeting.lang}.</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Past Meetings */}
          {activeTab === "past" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input placeholder="Search meetings..." className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50" />
                </div>
                <Button variant="outline" size="sm" className="border-white/10 text-white/50 hover:text-white text-xs h-8">
                  <Filter className="w-3 h-3 mr-1" /> Filter
                </Button>
              </div>
              {PAST_MEETINGS.map((meeting, i) => (
                <motion.div key={meeting.id} variants={FADE} transition={{ delay: i * 0.07 }}
                  className="glass-card rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-white/40" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white">{meeting.title}</span>
                          <Badge className="text-[10px] border border-white/10 bg-white/5 text-white/40">🌐 {meeting.lang}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                          <span>{meeting.date}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{meeting.duration}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{meeting.participants}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                          <div>
                            <div className="text-[10px] text-white/30 mb-1">Engagement Score</div>
                            <div className="flex items-center gap-2">
                              <Progress value={meeting.sentiment} className="w-20 h-1.5" />
                              <span className={`text-xs font-semibold ${meeting.sentiment >= 85 ? "text-emerald-400" : meeting.sentiment >= 70 ? "text-amber-400" : "text-rose-400"}`}>{meeting.sentiment}%</span>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-white/30">Tasks</div>
                            <div className="text-sm font-bold text-cyan-400">{meeting.tasks}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-white/30">Decisions</div>
                            <div className="text-sm font-bold text-violet-400">{meeting.decisions}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="border-white/10 text-white/50 hover:text-white text-xs h-7"
                        onClick={() => toast.success("Opening meeting report...")}>
                        <FileText className="w-3 h-3 mr-1" /> Report
                      </Button>
                      <Button size="sm" variant="outline" className="border-white/10 text-white/50 hover:text-white text-xs h-7"
                        onClick={() => toast.success("Downloading transcript...")}>
                        <Download className="w-3 h-3 mr-1" /> Transcript
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Live Session */}
          {activeTab === "live" && (
            <div className="space-y-4">
              {/* Live Meeting Header */}
              <div className="glass-card rounded-xl p-4 border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <div className="text-sm font-bold text-white">Q2 Financial Review</div>
                      <div className="text-xs text-white/40">Duration: 00:12:34 · 3 participants · AR/EN</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setMicOn(!micOn)}
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all
                        ${micOn ? "border-white/10 bg-white/5 text-white/60 hover:text-white" : "border-rose-500/30 bg-rose-500/10 text-rose-400"}`}>
                      {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setCamOn(!camOn)}
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all
                        ${camOn ? "border-white/10 bg-white/5 text-white/60 hover:text-white" : "border-rose-500/30 bg-rose-500/10 text-rose-400"}`}>
                      {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </button>
                    <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
                      onClick={() => { setLiveActive(false); toast.success("Meeting ended. NEO is generating the report..."); }}>
                      <Square className="w-3 h-3 mr-1" /> End Meeting
                    </Button>
                  </div>
                </div>
              </div>

              {/* Participant Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {["Ahmed Al-Rashid", "Sara Mohammed", "Omar Khalid"].map((name, i) => (
                  <div key={i} className="glass-card rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{name}</div>
                        <div className="text-[10px] text-white/30">Speaking · Engaged</div>
                      </div>
                      <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <div className="flex justify-between text-[10px] text-white/30 mb-0.5">
                          <span>Engagement</span><span className="text-emerald-400">{[88, 92, 79][i]}%</span>
                        </div>
                        <Progress value={[88, 92, 79][i]} className="h-1" />
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-white/30 mb-0.5">
                          <span>Sentiment</span><span className="text-blue-400">{["Positive", "Positive", "Neutral"][i]}</span>
                        </div>
                        <Progress value={[82, 90, 65][i]} className="h-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Transcript */}
              <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-white">Live Transcription</span>
                    <Badge className="text-[10px] border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">AR/EN</Badge>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                </div>
                <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                  {liveTranscript.map((entry, i) => (
                    <div key={i} className={`flex gap-3 ${entry.isNeo ? "pl-2 border-l-2 border-blue-500/40" : ""}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                        ${entry.isNeo ? "bg-blue-500/20 border border-blue-500/30" : "bg-white/10 border border-white/10"}`}>
                        {entry.isNeo ? <Brain className="w-3.5 h-3.5 text-blue-400" /> : entry.speaker.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[11px] font-semibold ${entry.isNeo ? "text-blue-400" : "text-white/70"}`}>{entry.speaker}</span>
                          <Badge className={`text-[9px] border ${entry.lang === "AR" ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-blue-500/30 bg-blue-500/10 text-blue-300"}`}>{entry.lang}</Badge>
                          <span className="text-[10px] text-white/20 ml-auto">{entry.time}</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${entry.isNeo ? "text-blue-200/70" : "text-white/60"}`}>{entry.text}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-xs text-white/20 animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    NEO is listening...
                  </div>
                </div>
              </div>

              {/* NEO AI Chat Fallback Panel */}
              <div className="glass-card rounded-xl border border-violet-500/20 bg-violet-500/3 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-semibold text-white">
                      {t("NEO AI Chat — Meeting Fallback", "نيو للمحادثة — بديل الاجتماع")}
                    </span>
                    <Badge className="text-[10px] border border-violet-500/30 bg-violet-500/10 text-violet-300">
                      {t("Audio/Video Fallback", "بديل الصوت/الفيديو")}
                    </Badge>
                  </div>
                  <button
                    onClick={() => setShowNEOChat(!showNEOChat)}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors border border-violet-500/20 rounded-lg px-3 py-1 hover:bg-violet-500/10"
                  >
                    {showNEOChat ? t("Collapse", "طي") : t("Expand Chat", "فتح المحادثة")}
                  </button>
                </div>
                {!showNEOChat && (
                  <div className="px-4 py-3 text-xs text-white/30">
                    {t(
                      "If audio or video fails, continue the meeting entirely through NEO AI text chat. All meeting intelligence features remain active — transcription, decision capture, and action items.",
                      "إذا فشل الصوت أو الفيديو، تابع الاجتماع بالكامل عبر محادثة نيو النصية. تبقى جميع ميزات الذكاء الاجتماعي نشطة — النسخ والقرارات وبنود العمل."
                    )}
                  </div>
                )}
                {showNEOChat && (
                  <div className="h-96">
                    <NEOChatWindow
                      compact={true}
                      showHeader={false}
                      placeholder={t(
                        "Continue your meeting via text — NEO captures all decisions and action items...",
                        "تابع اجتماعك عبر النص — نيو يلتقط جميع القرارات وبنود العمل..."
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Real-time NEO Insights */}
              <div className="glass-card rounded-xl border border-blue-500/10 bg-blue-500/3 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-blue-300">NEO Real-Time Insights</span>
                  <Badge className="text-[10px] border border-blue-500/30 bg-blue-500/10 text-blue-300 ml-auto">Live</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg bg-white/3 border border-white/5 p-3">
                    <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Decisions Captured</div>
                    <div className="text-lg font-bold text-emerald-400">2</div>
                    <div className="text-[11px] text-white/40 mt-1">Q2 budget approved, Q3 targets set</div>
                  </div>
                  <div className="rounded-lg bg-white/3 border border-white/5 p-3">
                    <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Action Items</div>
                    <div className="text-lg font-bold text-cyan-400">4</div>
                    <div className="text-[11px] text-white/40 mt-1">3 assigned, 1 pending owner</div>
                  </div>
                  <div className="rounded-lg bg-white/3 border border-white/5 p-3">
                    <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Meeting Sentiment</div>
                    <div className="text-lg font-bold text-violet-400">87%</div>
                    <div className="text-[11px] text-white/40 mt-1">Positive · Productive</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </PortalLayout>
  );
}
