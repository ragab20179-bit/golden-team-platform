/**
 * Login Page — Employee Portal Authentication
 * Design: "Neural Depth" — glass morphism login card on deep space background
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Brain, Eye, EyeOff, ArrowRight, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const PORTAL_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt-hero-corporate-LAR4ea7VBJH3jL9DF5uSJy.webp";

export default function Login() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error(t("Please enter your credentials", "يرجى إدخال بيانات الدخول")); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(t("Welcome back! Redirecting to portal...", "مرحباً بعودتك! جارٍ التوجيه إلى البوابة..."));
      setTimeout(() => setLocation("/portal"), 800);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#060B14] flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={PORTAL_BG} alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, rgba(6,11,20,0.95) 70%)" }} />
      </div>

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-5 pointer-events-none" style={{ background: "radial-gradient(circle, #3B82F6, transparent)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-5 pointer-events-none" style={{ background: "radial-gradient(circle, #06B6D4, transparent)" }} />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Back to home */}
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors">
          ← {t("Back to Golden Team", "العودة إلى الصفحة الرئيسية")}
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="glass-card border border-white/8 p-8 rounded-2xl" style={{ background: "rgba(13,27,62,0.5)" }}>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 neo-pulse">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{t("Employee Portal", "بوابة الموظفين")}</h1>
            <p className="text-white/40 text-sm">{t("Golden Team Trading Services", "شركة الفريق الذهبي للخدمات التجارية")}</p>
          </div>

          {/* NEO AI status */}
          <div className="flex items-center justify-center gap-2 mb-6 p-2.5 rounded-lg border border-emerald-500/20" style={{ background: "rgba(16,185,129,0.05)" }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">{t("NEO AI Core — Online & Ready", "نواة NEO AI — متصلة وجاهزة")}</span>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label className="text-white/60 text-xs mb-1.5 block">{t("Employee Email", "البريد الإلكتروني للموظف")}</Label>
              <Input
                type="email"
                placeholder="employee@goldenteam.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-blue-500/50 h-11"
              />
            </div>
            <div>
              <Label className="text-white/60 text-xs mb-1.5 block">{t("Password", "كلمة المرور")}</Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-blue-500/50 h-11 pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white border-0 font-semibold">
                {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t("Authenticating...", "جارٍ التحقق...")}</span>
              ) : (
                <span className="flex items-center gap-2">{t("Access Portal", "دخول البوابة")} <ArrowRight className="w-4 h-4" /></span>
              )}
            </Button>
          </form>

          {/* Demo access */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <button onClick={() => { setEmail("demo@goldenteam.com"); setPassword("demo1234"); }}
              className="w-full text-xs text-white/30 hover:text-white/60 transition-colors py-1">
              {t("Use demo credentials", "استخدام بيانات تجريبية")}
            </button>
          </div>
        </motion.div>

        {/* Security note */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 mt-6 text-xs text-white/25">
          <Shield className="w-3 h-3" />
          {t("Secured by ASTRA AMG Governance · JWT + OAuth", "محمي بحوكمة ASTRA AMG · JWT + OAuth")}
          <Lock className="w-3 h-3" />
        </motion.div>
      </div>
    </div>
  );
}
