import { createContext, useContext, useState, type ReactNode } from 'react';
import { useRouter } from '@tanstack/react-router';
export type Language = 'en' | 'ar';
export type Bilingual = { en: string; ar: string };
const LanguageContext = createContext<{lang: Language; setLang: (l: Language) => void; t: (en: string, ar: string) => string}>({lang: 'en', setLang: () => {}, t: en => en});
export function LanguageProvider({children, initial = 'en'}: {children: ReactNode; initial?: Language}) {
 const [lang, setLangState] = useState<Language>(initial);
 const router = useRouter();
 const setLang = (l: Language) => {
  document.cookie = `earth-language=${l}; path=/; max-age=31536000; SameSite=Lax`;
  document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  setLangState(l);
  void router.invalidate(); // re-run head() so titles and descriptions follow the language
 };
 return <LanguageContext.Provider value={{lang, setLang, t: (en, ar) => lang === 'ar' ? ar : en}}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
/** Reads the active language from the root route's loader data inside a leaf head(). */
export function headLang(matches: ReadonlyArray<{ loaderData?: unknown }>): Language {
 const data = matches[0]?.loaderData as { lang?: Language } | undefined;
 return data?.lang === 'ar' ? 'ar' : 'en';
}
