/**
 * Language Context — Arabic/English bilingual toggle with RTL support
 * Flips the entire portal to Arabic RTL when activated
 */
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { type Lang } from "@/lib/i18n";

export type { Lang };

interface LanguageContextType {
  lang: Lang;
  isRTL: boolean;
  toggleLang: () => void;
  setLang: (lang: Lang) => void;
  t: (en: string, ar: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem("gt-lang") as Lang) || "en";
  });

  const isRTL = lang === "ar";

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    localStorage.setItem("gt-lang", lang);
  }, [lang, isRTL]);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "en" ? "ar" : "en"));
  }, []);

  const t = useCallback((en: string, ar: string) => (lang === "ar" ? ar : en), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, isRTL, toggleLang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
