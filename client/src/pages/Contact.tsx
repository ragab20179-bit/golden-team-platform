/**
 * Contact — Public Page with Lead Capture Form
 * Design: "Prestige Dark" — Deep navy/charcoal, gold accents, Space Grotesk + Playfair Display
 * Color: #05080F bg, amber-400 accent
 * Layout: Hero → contact info cards → lead capture form → map placeholder → footer
 */
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Phone, Mail, MapPin, Clock, ArrowRight, ChevronRight,
  Send, CheckCircle, Building, MessageSquare, User, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

const CONTACT_CARDS = [
  {
    icon: Phone, title: "Call Us", color: "amber",
    lines: ["+966 11 XXX XXXX", "+966 55 XXX XXXX"],
    sub: "Sunday – Thursday, 8:00 AM – 5:00 PM AST"
  },
  {
    icon: Mail, title: "Email Us", color: "blue",
    lines: ["info@goldenteam.sa", "support@goldenteam.sa"],
    sub: "We respond within 4 business hours"
  },
  {
    icon: MapPin, title: "Visit Us", color: "emerald",
    lines: ["King Fahd Road, Al Olaya", "Riyadh 12211, Saudi Arabia"],
    sub: "Headquarters — Riyadh"
  },
  {
    icon: Clock, title: "Business Hours", color: "violet",
    lines: ["Sun – Thu: 8:00 AM – 5:00 PM", "Fri – Sat: Closed"],
    sub: "AST (UTC+3)"
  },
];

const SERVICES_OPTIONS = [
  "IT Infrastructure & Data Centers",
  "Cloud Solutions & Migration",
  "Cybersecurity & Compliance",
  "Network Design & Management",
  "Software Development & Integration",
  "AI & Automation (NEO AI Core)",
  "ASTRA PM — Project Management",
  "ISO 9001 Quality Advisory",
  "Business Development Strategy",
  "Organizational Excellence",
  "Digital Transformation",
  "GCC Market Entry",
  "Other / General Inquiry",
];

const colorMap: Record<string, string> = {
  amber: "from-amber-500 to-amber-600 bg-amber-500/10 text-amber-400",
  blue: "from-blue-500 to-blue-600 bg-blue-500/10 text-blue-400",
  emerald: "from-emerald-500 to-emerald-600 bg-emerald-500/10 text-emerald-400",
  violet: "from-violet-500 to-violet-600 bg-violet-500/10 text-violet-400",
};

export default function Contact() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    company: "", role: "", service: "", budget: "", message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.service || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Your inquiry has been received. We will contact you within 4 business hours.");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#05080F] text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* ── Top Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#05080F]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <span className="text-[#05080F] font-bold text-base" style={{ fontFamily: "'Playfair Display', serif" }}>GT</span>
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>GOLDEN TEAM</div>
              <div className="text-amber-400/60 text-[9px] tracking-widest uppercase">Trading Services</div>
            </div>
          </button>
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: t("Home", "الرئيسية"), path: "/" },
              { label: t("IT Solutions", "حلول تقنية المعلومات"), path: "/it-solutions" },
              { label: t("ASTRA PM", "ASTRA لإدارة المشاريع"), path: "/astra-pm" },
              { label: t("Consultancy", "الاستشارات"), path: "/consultancy" },
              { label: t("About", "من نحن"), path: "/about" },
              { label: t("Contact", "تواصل معنا"), path: "/contact" },
            ].map(({ label, path }) => (
              <button key={label} onClick={() => navigate(path)}
                className={`text-sm tracking-wide transition-colors ${path === "/contact" ? "text-amber-400 font-semibold" : "text-white/60 hover:text-amber-400"}`}>
                {label}
              </button>
            ))}
          </div>
          <Button onClick={() => navigate("/login")}
            className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold text-xs tracking-widest uppercase px-5">
            {t("Employee Portal", "بوابة الموظفين")}
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-16 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5" />
        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" animate="show" variants={stagger} className="text-center">
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 mb-6">
              <button onClick={() => navigate("/")} className="text-white/40 hover:text-white/70 text-sm transition-colors">{t("Home", "الرئيسية")}</button>
              <ChevronRight className="w-3 h-3 text-white/30" />
              <span className="text-amber-400 text-sm">{t("Contact", "تواصل معنا")}</span>
            </motion.div>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-300 text-xs tracking-widest uppercase mb-6">
              <MessageSquare className="w-3 h-3" /> {t("Get In Touch", "تواصل معنا")}
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("Let's Start a", "لنبدأ")}<br /><span className="text-amber-400">{t("Conversation", "حوارًا")}</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-white/60 text-xl max-w-2xl mx-auto">
              {t("Whether you have a specific project in mind or just want to explore how Golden Team can help your organization, our team is ready to listen.", "سواء كان لديك مشروع محدد أو ترغب في استكشاف كيف يمكن للفريق الذهبي مساعدتك، فريقنا مستعد للاستماع.")}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Contact Cards ── */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CONTACT_CARDS.map(({ icon: Icon, title, color, lines, sub }) => {
              const c = colorMap[color].split(" ");
              return (
                <motion.div key={title} variants={fadeUp}
                  className="p-6 rounded-2xl border border-white/8 bg-white/2 text-center">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c[0]} ${c[1]} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-white font-semibold text-sm mb-3">{title}</div>
                  {lines.map((line) => (
                    <div key={line} className="text-white/70 text-sm">{line}</div>
                  ))}
                  <div className="text-white/30 text-xs mt-2">{sub}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Lead Capture Form ── */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                {t("Send Us an Inquiry", "أرسل استفساراً")}
              </h2>
              <p className="text-white/50">
                {t("Complete the form below and a senior consultant will contact you within 4 business hours.", "املأ النموذج أدناه وسيتواصل معك مستشار أول خلال 4 ساعات عمل.")}
              </p>
            </motion.div>

            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 px-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {t("Inquiry Received", "تم استلام استفسارك")}
                </h3>
                <p className="text-white/60 mb-8 max-w-md mx-auto">
                  {t("Thank you for reaching out. A member of our team will contact you at", "شكراً لتواصلك معنا. سيتواصل معك أحد أعضاء فريقنا على")} <span className="text-white">{form.email}</span> {t("within 4 business hours.", "خلال 4 ساعات عمل.")}
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button onClick={() => { setSubmitted(false); setForm({ firstName: "", lastName: "", email: "", phone: "", company: "", role: "", service: "", budget: "", message: "" }); }}
                    variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                    {t("Submit Another Inquiry", "إرسال استفسار جديد")}
                  </Button>
                  <Button onClick={() => navigate("/")} className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold">
                    {t("Back to Home", "العودة للرئيسية")}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.form variants={fadeUp} onSubmit={handleSubmit}
                className="p-8 rounded-2xl border border-white/10 bg-white/2 space-y-6">
                {/* Name Row */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-xs font-semibold tracking-wide uppercase mb-2">
                      {t("First Name", "الاسم الأول")} <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        placeholder="Mohammed" required
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-amber-400/50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs font-semibold tracking-wide uppercase mb-2">
                      {t("Last Name", "اسم العائلة")}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        placeholder="Al-Rashidi"
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-amber-400/50" />
                    </div>
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-xs font-semibold tracking-wide uppercase mb-2">
                      {t("Email Address", "البريد الإلكتروني")} <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="m.rashidi@company.com" required
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-amber-400/50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs font-semibold tracking-wide uppercase mb-2">
                      {t("Phone Number", "رقم الجوال")}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+966 5X XXX XXXX"
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-amber-400/50" />
                    </div>
                  </div>
                </div>

                {/* Company & Role */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-xs font-semibold tracking-wide uppercase mb-2">
                      {t("Company / Organization", "الشركة / المنظمة")}
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                        placeholder="Your Company Name"
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-amber-400/50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs font-semibold tracking-wide uppercase mb-2">
                      {t("Your Role / Title", "مسماك الوظيفي")}
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                        placeholder="CTO, IT Manager, Director..."
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-amber-400/50" />
                    </div>
                  </div>
                </div>

                {/* Service & Budget */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-xs font-semibold tracking-wide uppercase mb-2">
                      {t("Service of Interest", "الخدمة المطلوبة")} <span className="text-amber-400">*</span>
                    </label>
                    <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })} required>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-amber-400/50">
                        <SelectValue placeholder="Select a service..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0D1220] border-white/10">
                        {SERVICES_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s} className="text-white/80 focus:bg-amber-500/10 focus:text-amber-300">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs font-semibold tracking-wide uppercase mb-2">
                      {t("Estimated Budget (SAR)", "الميزانية التقديرية (ريال)")}
                    </label>
                    <Select value={form.budget} onValueChange={(v) => setForm({ ...form, budget: v })}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-amber-400/50">
                        <SelectValue placeholder="Select budget range..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0D1220] border-white/10">
                        {["Under SAR 50,000", "SAR 50,000 – 200,000", "SAR 200,000 – 500,000", "SAR 500,000 – 1,000,000", "Over SAR 1,000,000", "Not yet determined"].map((b) => (
                          <SelectItem key={b} value={b} className="text-white/80 focus:bg-amber-500/10 focus:text-amber-300">{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-white/60 text-xs font-semibold tracking-wide uppercase mb-2">
                    {t("Message / Project Description", "الرسالة / وصف المشروع")} <span className="text-amber-400">*</span>
                  </label>
                  <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Please describe your project, challenge, or question. The more detail you provide, the better we can prepare for our conversation..."
                    rows={5} required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-amber-400/50 resize-none" />
                </div>

                {/* Privacy Note */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/5">
                  <CheckCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-white/40 text-xs leading-relaxed">
                    {t("Your information is protected under our Privacy Policy and Saudi Arabia's Personal Data Protection Law (PDPL). We will never share your data with third parties without your explicit consent.", "معلوماتك محمية بموجب سياسة الخصوصية ونظام حماية البيانات الشخصية السعودي. لن نشارك بياناتك مع أطراف ثالثة دون موافقتك الصريحة.")}
                  </p>
                </div>

                <Button type="submit" disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold py-4 text-sm tracking-wide">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#05080F]/30 border-t-[#05080F] rounded-full animate-spin" />
                      {t("Sending Inquiry...", "جاري الإرسال...")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" /> {t("Send Inquiry", "إرسال الاستفسار")}
                    </span>
                  )}
                </Button>
              </motion.form>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Office Locations ── */}
      <section className="py-16 bg-gradient-to-b from-[#080D1A] to-[#05080F]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-10">
            <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("Our Offices", "مكاتبنا")}
            </motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="grid md:grid-cols-3 gap-6">
            {[
              { city: "Riyadh", country: "Saudi Arabia", address: "King Fahd Road, Al Olaya\nRiyadh 12211, KSA", type: "Headquarters", flag: "🇸🇦" },
              { city: "Dubai", country: "United Arab Emirates", address: "Dubai Internet City\nDubai, UAE", type: "Regional Office", flag: "🇦🇪" },
              { city: "Manama", country: "Bahrain", address: "Bahrain Financial Harbour\nManama, Bahrain", type: "Branch Office", flag: "🇧🇭" },
            ].map(({ city, country, address, type, flag }) => (
              <motion.div key={city} variants={fadeUp}
                className="p-6 rounded-2xl border border-white/8 bg-white/2 text-center">
                <div className="text-4xl mb-3">{flag}</div>
                <div className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-1">{type}</div>
                <div className="text-white font-bold text-xl mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{city}</div>
                <div className="text-white/40 text-sm mb-3">{country}</div>
                <div className="text-white/50 text-xs whitespace-pre-line">{address}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 bg-[#05080F] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white/30 text-sm">{t("© 2026 Golden Team Trading Services. All rights reserved.", "© 2026 شركة الفريق الذهبي للخدمات التجارية. جميع الحقوق محفوظة.")}</div>
          <div className="flex gap-6">
            {["/", "/it-solutions", "/astra-pm", "/consultancy", "/about", "/contact"].map((path, i) => (
              <button key={path} onClick={() => navigate(path)}
                className="text-white/30 hover:text-white/60 text-sm transition-colors">
                {[t("Home","الرئيسية"), t("IT Solutions","حلول تقنية المعلومات"), t("ASTRA PM","ASTRA لإدارة المشاريع"), t("Consultancy","الاستشارات"), t("About","من نحن"), t("Contact","تواصل معنا")][i]}
              </button>
            ))}
          </div>
          <div className="text-white/30 text-sm">{t("ISO 9001:2015 · Powered by NEO AI", "ISO 9001:2015 · مدعوم بـ NEO AI")}</div>
        </div>
      </footer>
    </div>
  );
}
