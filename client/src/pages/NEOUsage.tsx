/**
 * NEO AI Usage Dashboard — /portal/neo-usage
 *
 * Displays real-time AI usage metrics from neo_ai_usage table:
 * - Summary KPI cards (total calls, tokens, cost, avg latency)
 * - Daily cost/calls chart (last 30 days) using Chart.js via recharts
 * - Per-module cost breakdown table
 * - Recent AI calls log
 *
 * All data sourced from DB — no hardcoded figures.
 * Bilingual: Arabic / English.
 */

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line
} from "recharts";
import {
  TrendingUp, Zap, DollarSign, Clock, Activity,
  Brain, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import PortalLayout from "@/components/PortalLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCost(usd: number | string): string {
  const n = typeof usd === "string" ? parseFloat(usd) : usd;
  if (n < 0.001) return `$${(n * 1000).toFixed(4)}m`;
  return `$${n.toFixed(4)}`;
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const MODULE_LABELS: Record<string, { en: string; ar: string }> = {
  financial:     { en: "Financial AI",    ar: "الذكاء المالي" },
  risk:          { en: "Risk AI",         ar: "ذكاء المخاطر" },
  decision:      { en: "Decision AI",     ar: "ذكاء القرار" },
  critical:      { en: "Critical AI",     ar: "التفكير النقدي" },
  qms:           { en: "QMS AI",          ar: "ذكاء الجودة" },
  business:      { en: "Business AI",     ar: "ذكاء الأعمال" },
  conversational:{ en: "Conversational",  ar: "المحادثة" },
  chat:          { en: "NEO Chat",        ar: "محادثة NEO" },
};

const ENGINE_COLORS: Record<string, string> = {
  gpt:    "#8b5cf6",
  manus:  "#f59e0b",
  hybrid: "#06b6d4",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({
  icon: Icon, label, value, sub, color
}: { icon: React.ElementType; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-white/50 text-xs mb-1">{label}</div>
        <div className="text-white font-bold text-xl leading-tight">{value}</div>
        {sub && <div className="text-white/40 text-xs mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NEOUsage() {
  const { lang } = useLanguage();
  const [days, setDays] = useState(30);
  const [showAllCalls, setShowAllCalls] = useState(false);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } =
    trpc.neoModules.getUsageStats.useQuery(undefined, { refetchInterval: 60_000 });

  const { data: dailyRaw, isLoading: dailyLoading } =
    trpc.neoModules.getDailyUsage.useQuery({ days }, { refetchInterval: 60_000 });

  const { data: recentCalls, isLoading: callsLoading } =
    trpc.neoModules.getRecentCalls.useQuery({ limit: showAllCalls ? 100 : 20 });

  // Aggregate daily data: merge gpt/manus/hybrid rows by day
  const dailyChart = useMemo(() => {
    if (!dailyRaw) return [];
    const byDay: Record<string, { day: string; gpt: number; manus: number; hybrid: number; total: number; costUsd: number }> = {};
    for (const row of dailyRaw) {
      if (!byDay[row.day]) byDay[row.day] = { day: row.day, gpt: 0, manus: 0, hybrid: 0, total: 0, costUsd: 0 };
      byDay[row.day][row.engine as "gpt" | "manus" | "hybrid"] += row.calls;
      byDay[row.day].total += row.calls;
      byDay[row.day].costUsd += row.costUsd;
    }
    return Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day));
  }, [dailyRaw]);

  const moduleRows = useMemo(() => {
    if (!stats) return [];
    const modules = Object.keys(stats.costByModule);
    return modules
      .map(m => ({
        module: m,
        label: MODULE_LABELS[m]?.[lang] ?? m,
        calls: stats.callsByModule[m] ?? 0,
        cost: stats.costByModule[m] ?? 0,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [stats, lang]);

  const isLoading = statsLoading || dailyLoading;

  return (
    <PortalLayout
      title={lang === "ar" ? "لوحة استخدام الذكاء الاصطناعي" : "AI Usage Dashboard"}
      subtitle={lang === "ar" ? "مقاييس حقيقية من جدول neo_ai_usage" : "Real metrics from neo_ai_usage table"}
      badge="NEO"
      badgeColor="bg-pink-500/10 text-pink-400 border-pink-500/20"
    >
      <div className="space-y-6">

        {/* ── Header row ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-pink-400" />
            <span className="text-white/60 text-sm">
              {lang === "ar" ? "يتجدد كل 60 ثانية" : "Auto-refreshes every 60s"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {[7, 14, 30, 60].map(d => (
              <Button
                key={d}
                size="sm"
                variant={days === d ? "default" : "outline"}
                className={days === d ? "bg-pink-600 hover:bg-pink-500 text-white text-xs" : "text-white/50 text-xs bg-transparent border-white/10"}
                onClick={() => setDays(d)}
              >
                {d}d
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="text-white/50 text-xs bg-transparent border-white/10"
              onClick={() => refetchStats()}
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              icon={Activity}
              label={lang === "ar" ? "إجمالي الاستدعاءات" : "Total AI Calls"}
              value={String(stats?.totalCalls ?? 0)}
              sub={`${lang === "ar" ? "اليوم" : "Today"}: ${stats?.todayCalls ?? 0}`}
              color="bg-violet-500/20 text-violet-400"
            />
            <KPICard
              icon={Zap}
              label={lang === "ar" ? "إجمالي الرموز" : "Total Tokens"}
              value={fmtTokens(stats?.totalTokens ?? 0)}
              sub={`GPT-4o: ${fmtTokens(stats?.gptTokens ?? 0)}`}
              color="bg-amber-500/20 text-amber-400"
            />
            <KPICard
              icon={DollarSign}
              label={lang === "ar" ? "التكلفة الإجمالية" : "Total Cost (USD)"}
              value={fmtCost(stats?.totalCostUsd ?? "0")}
              sub={`${lang === "ar" ? "اليوم" : "Today"}: ${fmtCost(stats?.todayCostUsd ?? "0")}`}
              color="bg-emerald-500/20 text-emerald-400"
            />
            <KPICard
              icon={Clock}
              label={lang === "ar" ? "متوسط زمن الاستجابة" : "Avg Latency"}
              value={`${stats?.avgLatencyMs ?? 0}ms`}
              sub={`GPT: ${stats?.gptCalls ?? 0} | Manus: ${stats?.manusCalls ?? 0}`}
              color="bg-cyan-500/20 text-cyan-400"
            />
          </div>
        )}

        {/* ── Daily Chart ── */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">
              {lang === "ar" ? `الاستدعاءات اليومية — آخر ${days} يوم` : `Daily AI Calls — Last ${days} Days`}
            </h3>
            <div className="flex items-center gap-3 text-xs text-white/50">
              {Object.entries(ENGINE_COLORS).map(([engine, color]) => (
                <span key={engine} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  {engine.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
          {dailyLoading ? (
            <div className="h-48 bg-white/5 animate-pulse rounded-lg" />
          ) : dailyChart.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-white/30 text-sm">
              {lang === "ar" ? "لا توجد بيانات بعد — ابدأ باستخدام وحدات NEO AI" : "No data yet — start using NEO AI modules to see usage here"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "#0a0f1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                  itemStyle={{ color: "rgba(255,255,255,0.6)" }}
                />
                <Bar dataKey="gpt"    stackId="a" fill={ENGINE_COLORS.gpt}    name="GPT-4o" />
                <Bar dataKey="manus"  stackId="a" fill={ENGINE_COLORS.manus}  name="Manus" />
                <Bar dataKey="hybrid" stackId="a" fill={ENGINE_COLORS.hybrid} name="Hybrid" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Cost chart ── */}
        {dailyChart.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-white font-semibold text-sm mb-4">
              {lang === "ar" ? "التكلفة اليومية (USD)" : "Daily Cost (USD)"}
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={dailyChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickFormatter={v => `$${v.toFixed(4)}`} />
                <Tooltip
                  contentStyle={{ background: "#0a0f1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                  formatter={(v: number) => [`$${v.toFixed(6)}`, "Cost"]}
                />
                <Line type="monotone" dataKey="costUsd" stroke="#10b981" strokeWidth={2} dot={false} name="Cost USD" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Per-module breakdown ── */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-white font-semibold text-sm mb-4">
            {lang === "ar" ? "التكلفة حسب الوحدة" : "Cost by Module"}
          </h3>
          {statsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-white/5 animate-pulse rounded" />)}
            </div>
          ) : moduleRows.length === 0 ? (
            <div className="text-white/30 text-sm text-center py-6">
              {lang === "ar" ? "لا توجد بيانات بعد" : "No module data yet"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 border-b border-white/10">
                    <th className="text-left py-2 pr-4">{lang === "ar" ? "الوحدة" : "Module"}</th>
                    <th className="text-right py-2 pr-4">{lang === "ar" ? "الاستدعاءات" : "Calls"}</th>
                    <th className="text-right py-2">{lang === "ar" ? "التكلفة" : "Cost (USD)"}</th>
                  </tr>
                </thead>
                <tbody>
                  {moduleRows.map(row => (
                    <tr key={row.module} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-2 pr-4">
                        <span className="text-white/80">{row.label}</span>
                        <span className="text-white/30 text-xs ml-2">({row.module})</span>
                      </td>
                      <td className="text-right py-2 pr-4 text-white/60">{row.calls}</td>
                      <td className="text-right py-2 text-emerald-400 font-mono">{fmtCost(row.cost)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/20">
                    <td className="py-2 pr-4 text-white/50 font-medium">{lang === "ar" ? "الإجمالي" : "Total"}</td>
                    <td className="text-right py-2 pr-4 text-white/60">{stats?.totalCalls ?? 0}</td>
                    <td className="text-right py-2 text-emerald-400 font-bold font-mono">{fmtCost(stats?.totalCostUsd ?? "0")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* ── Pricing note ── */}
        {stats?.pricingNote && (
          <div className="text-white/30 text-xs px-1">
            ℹ️ {stats.pricingNote}
          </div>
        )}

        {/* ── Recent calls log ── */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">
              {lang === "ar" ? "آخر الاستدعاءات" : "Recent AI Calls"}
            </h3>
            <Button
              size="sm"
              variant="outline"
              className="text-white/50 text-xs bg-transparent border-white/10"
              onClick={() => setShowAllCalls(!showAllCalls)}
            >
              {showAllCalls ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
              {showAllCalls ? (lang === "ar" ? "عرض أقل" : "Show less") : (lang === "ar" ? "عرض الكل" : "Show all")}
            </Button>
          </div>
          {callsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-white/5 animate-pulse rounded" />)}
            </div>
          ) : !recentCalls || recentCalls.length === 0 ? (
            <div className="text-white/30 text-sm text-center py-6">
              {lang === "ar" ? "لا توجد استدعاءات بعد" : "No AI calls recorded yet"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-white/40 border-b border-white/10">
                    <th className="text-left py-2 pr-3">{lang === "ar" ? "الوقت" : "Time"}</th>
                    <th className="text-left py-2 pr-3">{lang === "ar" ? "الوحدة" : "Module"}</th>
                    <th className="text-left py-2 pr-3">{lang === "ar" ? "المحرك" : "Engine"}</th>
                    <th className="text-right py-2 pr-3">{lang === "ar" ? "الرموز" : "Tokens"}</th>
                    <th className="text-right py-2 pr-3">{lang === "ar" ? "التكلفة" : "Cost"}</th>
                    <th className="text-right py-2">{lang === "ar" ? "الزمن" : "Latency"}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCalls.map(call => (
                    <tr key={call.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-2 pr-3 text-white/40">
                        {new Date(call.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3 text-white/70">
                        {MODULE_LABELS[call.module]?.[lang] ?? call.module}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge
                          className="text-[10px] px-1.5 py-0"
                          style={{
                            background: ENGINE_COLORS[call.engine] + "20",
                            color: ENGINE_COLORS[call.engine],
                            border: `1px solid ${ENGINE_COLORS[call.engine]}40`,
                          }}
                        >
                          {call.engine.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="text-right py-2 pr-3 text-white/60 font-mono">
                        {fmtTokens(call.totalTokens)}
                      </td>
                      <td className="text-right py-2 pr-3 text-emerald-400 font-mono">
                        {fmtCost(call.estimatedCostUsd ?? "0")}
                      </td>
                      <td className="text-right py-2 text-white/40 font-mono">
                        {call.latencyMs ? `${call.latencyMs}ms` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </PortalLayout>
  );
}
