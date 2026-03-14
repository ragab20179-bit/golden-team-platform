/**
 * About Us — Public Page
 * Design: "Prestige Dark" — Deep navy/charcoal, gold accents, Space Grotesk + Playfair Display
 * Color: #05080F bg, amber-400 accent
 * Layout: Hero → story → values → team → milestones → certifications → CTA
 */
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  Award, Shield, Globe, Users, Target, Lightbulb, Heart,
  ArrowRight, ChevronRight, CheckCircle, Star, TrendingUp, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt-hero-corporate-LAR4ea7VBJH3jL9DF5uSJy.webp";

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

const VALUES = [
  { icon: Shield, title: "Integrity First", desc: "Every engagement is governed by transparency, honesty, and ethical conduct. We build trust through consistent delivery and open communication." },
  { icon: Target, title: "Results-Driven", desc: "We measure our success by your outcomes. Every project has clear KPIs, and we hold ourselves accountable to delivering measurable value." },
  { icon: Lightbulb, title: "Innovation-Led", desc: "We continuously invest in emerging technologies — particularly AI — to ensure our clients always have access to cutting-edge solutions." },
  { icon: Globe, title: "GCC-Rooted", desc: "Deep regional expertise, cultural understanding, and established government relationships across Saudi Arabia, UAE, and the wider GCC." },
  { icon: Users, title: "Partnership Mindset", desc: "We work as an extension of your team, not as external vendors. Long-term relationships and client success are our primary metrics." },
  { icon: Heart, title: "People-Centered", desc: "Technology serves people, not the other way around. We design solutions that empower employees and improve the human experience at work." },
];

const MILESTONES = [
  { year: "2010", title: "Founded in Riyadh", desc: "Golden Team established as an IT services and business consultancy firm serving the Saudi market." },
  { year: "2014", title: "ISO 9001 Certification", desc: "Achieved ISO 9001:2008 certification, demonstrating commitment to quality management excellence." },
  { year: "2017", title: "GCC Expansion", desc: "Extended operations to UAE and Bahrain, establishing Golden Team as a regional enterprise services provider." },
  { year: "2019", title: "ASTRA PM Launch", desc: "Launched the ASTRA Project Management platform, purpose-built for GCC construction and infrastructure projects." },
  { year: "2022", title: "AI Division Established", desc: "Formed the AI & Digital Transformation practice, beginning development of the NEO AI Core platform." },
  { year: "2024", title: "NEO AI Core v1.0", desc: "Released NEO AI Core — the first hybrid Manus + GPT-4 enterprise AI orchestration platform for the GCC market." },
  { year: "2026", title: "Golden Team Enterprise Platform", desc: "Launched the fully integrated enterprise platform combining all services, NEO AI, and ASTRA PM in one unified ecosystem." },
];

const TEAM = [
  { name: "Mohammed Al-Rashidi", role: "Chief Executive Officer", expertise: "20+ years in enterprise IT and business development across the GCC" },
  { name: "Sarah Al-Mahmoud", role: "Chief Technology Officer", expertise: "AI/ML architecture, cloud infrastructure, and digital transformation" },
  { name: "Ahmed Al-Farsi", role: "Head of Consultancy", expertise: "ISO 9001, organizational excellence, and GCC regulatory compliance" },
  { name: "Fatima Al-Zahra", role: "Head of ASTRA PM", expertise: "Project management, construction technology, and PMO establishment" },
  { name: "Khalid Al-Otaibi", role: "Head of Cybersecurity", expertise: "NCA ECC, SAMA CSF, ISO 27001, and enterprise security architecture" },
  { name: "Nour Al-Hassan", role: "NEO AI Lead Architect", expertise: "LLM orchestration, RAG systems, and enterprise AI integration" },
];

const STATS = [
  { value: "15+", label: "Years of Excellence" },
  { value: "200+", label: "Projects Delivered" },
  { value: "50+", label: "Expert Team Members" },
  { value: "3", label: "GCC Countries" },
];

export default function About() {
  const [, navigate] = useLocation();

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
              { label: "Home", path: "/" },
              { label: "IT Solutions", path: "/it-solutions" },
              { label: "ASTRA PM", path: "/astra-pm" },
              { label: "Consultancy", path: "/consultancy" },
              { label: "About", path: "/about" },
              { label: "Contact", path: "/contact" },
            ].map(({ label, path }) => (
              <button key={label} onClick={() => navigate(path)}
                className={`text-sm tracking-wide transition-colors ${path === "/about" ? "text-amber-400 font-semibold" : "text-white/60 hover:text-amber-400"}`}>
                {label}
              </button>
            ))}
          </div>
          <Button onClick={() => navigate("/login")}
            className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold text-xs tracking-widest uppercase px-5">
            Employee Portal
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-16 min-h-[55vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05080F] via-[#05080F]/90 to-[#05080F]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05080F] via-transparent to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
              <button onClick={() => navigate("/")} className="text-white/40 hover:text-white/70 text-sm transition-colors">Home</button>
              <ChevronRight className="w-3 h-3 text-white/30" />
              <span className="text-amber-400 text-sm">About Us</span>
            </motion.div>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-300 text-xs tracking-widest uppercase mb-6">
              <Star className="w-3 h-3" /> Our Story
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Fifteen Years of<br /><span className="text-amber-400">Building the Future</span><br />of GCC Enterprise
            </motion.h1>
            <motion.p variants={fadeUp} className="text-white/60 text-xl max-w-2xl leading-relaxed">
              Golden Team Trading Services was founded with a singular mission: to help GCC organizations harness the power of technology and strategic thinking to achieve their full potential.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-white/8 bg-white/2 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map(({ value, label }) => (
              <motion.div key={label} variants={fadeUp}>
                <div className="text-3xl font-bold text-amber-400 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{value}</div>
                <div className="text-white/50 text-sm">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Story ── */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}
            className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeUp}>
              <h2 className="text-4xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                Who We Are
              </h2>
              <div className="space-y-4 text-white/60 leading-relaxed">
                <p>
                  Golden Team Trading Services is a Riyadh-headquartered enterprise services company operating across Saudi Arabia, the UAE, and Bahrain. We specialize in three interconnected domains: IT Solutions, Project Management (ASTRA PM), and Strategic Business Consultancy.
                </p>
                <p>
                  What distinguishes us is our integration of cutting-edge AI technology — specifically our proprietary NEO AI Core platform — into every service we deliver. NEO AI is not a bolt-on feature; it is the intelligence layer that runs through our entire service portfolio, enabling our clients to operate faster, smarter, and with greater confidence.
                </p>
                <p>
                  We are ISO 9001:2015 certified and operate under a rigorous quality management framework that ensures every engagement meets the highest standards of delivery, documentation, and client satisfaction.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {["ISO 9001:2015 Certified", "NCA ECC Compliant", "Saudi Vision 2030 Aligned", "GDPR & PDPL Ready"].map((tag) => (
                  <div key={tag} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/20 bg-amber-500/8 text-amber-300 text-xs">
                    <CheckCircle className="w-3 h-3" /> {tag}
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
              {[
                { icon: TrendingUp, title: "Growth-Focused", desc: "Every solution is designed to scale with your business and deliver compounding returns over time." },
                { icon: Shield, title: "Security-First", desc: "All our solutions are built with security and compliance as foundational requirements, not afterthoughts." },
                { icon: Zap, title: "AI-Powered", desc: "NEO AI Core is embedded in every service, delivering intelligence and automation at enterprise scale." },
                { icon: Award, title: "Excellence-Driven", desc: "ISO 9001 certified processes ensure consistent, high-quality delivery across every engagement." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="p-5 rounded-xl border border-white/8 bg-white/2">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-white font-semibold text-sm mb-1">{title}</div>
                  <div className="text-white/40 text-xs leading-relaxed">{desc}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-20 bg-gradient-to-b from-[#080D1A] to-[#05080F]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-14">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Our Core Values
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-2xl mx-auto">
              Six principles that guide every decision, every engagement, and every interaction.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.05 }} variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} variants={fadeUp}
                className="group p-6 rounded-2xl border border-white/8 bg-white/2 hover:bg-amber-500/3 hover:border-amber-400/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                  <Icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white text-base mb-2">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Milestones ── */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Our Journey
            </motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.05 }} variants={stagger}
            className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-amber-400/40 via-amber-400/20 to-transparent hidden lg:block" />
            <div className="space-y-8">
              {MILESTONES.map(({ year, title, desc }, i) => (
                <motion.div key={year} variants={fadeUp}
                  className={`flex flex-col lg:flex-row items-center gap-8 ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"}`}>
                  <div className={`flex-1 ${i % 2 === 0 ? "lg:text-right" : "lg:text-left"}`}>
                    <div className="p-6 rounded-2xl border border-white/8 bg-white/2 inline-block text-left">
                      <div className="text-amber-400 font-bold text-sm tracking-widest mb-2">{year}</div>
                      <div className="text-white font-semibold mb-1">{title}</div>
                      <div className="text-white/40 text-sm">{desc}</div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0 z-10 shadow-lg shadow-amber-500/30">
                    <div className="w-3 h-3 rounded-full bg-[#05080F]" />
                  </div>
                  <div className="flex-1 hidden lg:block" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Leadership Team ── */}
      <section className="py-20 bg-gradient-to-b from-[#080D1A] to-[#05080F]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-14">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Leadership Team
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-2xl mx-auto">
              Experienced leaders with deep GCC expertise and a shared commitment to client success.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.05 }} variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEAM.map(({ name, role, expertise }) => (
              <motion.div key={name} variants={fadeUp}
                className="group p-6 rounded-2xl border border-white/8 bg-white/2 hover:bg-amber-500/3 hover:border-amber-400/20 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4">
                  <span className="text-[#05080F] font-bold text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </span>
                </div>
                <div className="text-white font-semibold text-base mb-1">{name}</div>
                <div className="text-amber-400 text-xs font-semibold tracking-wide mb-3">{role}</div>
                <div className="text-white/40 text-xs leading-relaxed">{expertise}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Ready to Work<br /><span className="text-amber-400">With Golden Team?</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg mb-10">
              Let us show you how our integrated approach to IT, project management, and consultancy can transform your organization.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
              <Button onClick={() => navigate("/contact")}
                className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold px-10 py-4 text-sm tracking-wide">
                Get In Touch <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={() => navigate("/it-solutions")} variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent px-10 py-4 text-sm">
                Explore Our Services
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 bg-[#05080F] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white/30 text-sm">© 2026 Golden Team Trading Services. All rights reserved.</div>
          <div className="flex gap-6">
            {["/", "/it-solutions", "/astra-pm", "/consultancy", "/about", "/contact"].map((path, i) => (
              <button key={path} onClick={() => navigate(path)}
                className="text-white/30 hover:text-white/60 text-sm transition-colors">
                {["Home", "IT Solutions", "ASTRA PM", "Consultancy", "About", "Contact"][i]}
              </button>
            ))}
          </div>
          <div className="text-white/30 text-sm">ISO 9001:2015 · Powered by NEO AI</div>
        </div>
      </footer>
    </div>
  );
}
