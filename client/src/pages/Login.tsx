/**
 * Login Page — Employee Portal Authentication
 * Design: "Neural Depth" — glass morphism login card on deep space background
 *
 * Authentication options:
 *   1. Google Sign-In  → /api/auth/google  (real OAuth 2.0)
 *   2. Manus OAuth     → getLoginUrl()     (Manus platform OAuth)
 *   3. Email/Password  → placeholder (not yet backed by DB — shows toast)
 */
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Brain, ArrowRight, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

const PORTAL_BG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt-hero-corporate-LAR4ea7VBJH3jL9DF5uSJy.webp";

/** Google "G" SVG icon — official brand asset colours */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  /** Build the Google auth URL with returnPath so the callback redirects back to the portal */
  const googleLoginUrl = `/api/auth/google?returnPath=${encodeURIComponent("/portal")}`;

  /** Manus OAuth URL */
  const manusLoginUrl = getLoginUrl();

  return (
    <div className="min-h-screen bg-[#060B14] flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={PORTAL_BG} alt="" className="w-full h-full object-cover opacity-40" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, rgba(6,11,20,0.95) 70%)",
          }}
        />
      </div>

      {/* Floating orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-5 pointer-events-none"
        style={{ background: "radial-gradient(circle, #3B82F6, transparent)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-5 pointer-events-none"
        style={{ background: "radial-gradient(circle, #06B6D4, transparent)" }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Back to home */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors"
        >
          ← {t("Back to Golden Team", "العودة إلى الصفحة الرئيسية")}
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card border border-white/8 p-8 rounded-2xl"
          style={{ background: "rgba(13,27,62,0.5)" }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 neo-pulse">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h1
              className="text-2xl font-bold text-white mb-1"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {t("Employee Portal", "بوابة الموظفين")}
            </h1>
            <p className="text-white/40 text-sm">
              {t("Golden Team Trading Services", "شركة الفريق الذهبي للخدمات التجارية")}
            </p>
          </div>

          {/* NEO AI status */}
          <div
            className="flex items-center justify-center gap-2 mb-6 p-2.5 rounded-lg border border-emerald-500/20"
            style={{ background: "rgba(16,185,129,0.05)" }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">
              {t("NEO AI Core — Online & Ready", "نواة NEO AI — متصلة وجاهزة")}
            </span>
          </div>

          {/* ── Sign-in options ── */}
          <div className="space-y-3">
            {/* Google Sign-In */}
            <a href={googleLoginUrl} className="block">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold text-sm flex items-center justify-center gap-3 transition-all duration-200 hover:shadow-md"
              >
                <GoogleIcon />
                {t("Continue with Google", "المتابعة باستخدام Google")}
              </Button>
            </a>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/25 text-xs">{t("or", "أو")}</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Manus OAuth */}
            <a href={manusLoginUrl} className="block">
              <Button
                type="button"
                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white border-0 font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Brain className="w-4 h-4" />
                {t("Continue with Manus", "المتابعة باستخدام Manus")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>

          {/* Info note */}
          <p className="mt-5 text-center text-xs text-white/25 leading-relaxed">
            {t(
              "Sign in with your Golden Team Google Workspace account or your Manus account.",
              "سجّل الدخول باستخدام حساب Google Workspace الخاص بشركة الفريق الذهبي أو حساب Manus."
            )}
          </p>
        </motion.div>

        {/* Security note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 mt-6 text-xs text-white/25"
        >
          <Shield className="w-3 h-3" />
          {t(
            "Secured by ASTRA AMG Governance · JWT + OAuth 2.0",
            "محمي بحوكمة ASTRA AMG · JWT + OAuth 2.0"
          )}
          <Lock className="w-3 h-3" />
        </motion.div>
      </div>
    </div>
  );
}
