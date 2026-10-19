import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from '@tanstack/react-router';
export type Language = 'en' | 'ar';
export type Bilingual = { en: string; ar: string };

// Load a language's fonts before showing it, so the text never flashes in a fallback font the first
// time a visitor switches language (the other language's fonts are also fetched while the browser is idle).
const fontsFor = (l: Language): [string, string][] =>
  l === 'ar' ? [['1em Cairo', '\u0627'], ['1em Cairo', 'A']] : [['1em "DM Sans"', 'A'], ['1em Manrope', 'A']];
function warmFonts(l: Language): Promise<unknown> {
  const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
  if (!fonts) return Promise.resolve();
  return Promise.all(fontsFor(l).map(([face, text]) => fonts.load(face, text))).catch(() => undefined);
}
const LanguageContext = createContext<{lang: Language; setLang: (l: Language) => void; t: (en: string, ar: string) => string}>({lang: 'en', setLang: () => {}, t: en => en});
export function LanguageProvider({children, initial = 'en'}: {children: ReactNode; initial?: Language}) {
 const [lang, setLangState] = useState<Language>(initial);
 const router = useRouter();
 const apply = (l: Language) => {
  document.cookie = `earth-language=${l}; path=/; max-age=31536000; SameSite=Lax`;
  document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  setLangState(l);
  // Arabic and English have their own URLs (/ar/...): move to the other one, then refresh titles and descriptions.
  const { pathname, search, hash } = window.location;
  const bare = pathname.replace(/^\/ar(?=\/|$)/, '') || '/';
  const next = (l === 'ar' ? '/ar' + (bare === '/' ? '' : bare) : bare) + search + hash;
  if (next !== pathname + search + hash) router.history.push(next);
  void router.invalidate();
 };
 // Wait (at most 0.7 s) for the new language's fonts; instant when they are already loaded.
 const setLang = (l: Language) => {
  void Promise.race([warmFonts(l), new Promise((resolve) => setTimeout(resolve, 700))]).then(() => apply(l));
 };
 useEffect(() => { // browser back/forward between /ar and English pages
  setLangState(initial);
  document.documentElement.lang = initial; document.documentElement.dir = initial === 'ar' ? 'rtl' : 'ltr';
 }, [initial]);
 useEffect(() => {
  const other: Language = lang === 'ar' ? 'en' : 'ar';
  const run = () => { void warmFonts(other); };
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) { w.requestIdleCallback(run, { timeout: 4000 }); return; }
  const id = setTimeout(run, 2500);
  return () => clearTimeout(id);
 }, [lang]);
 return <LanguageContext.Provider value={{lang, setLang, t: (en, ar) => lang === 'ar' ? ar : en}}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
/** Reads the active language from the root route's loader data inside a leaf head(). */
export function headLang(matches: ReadonlyArray<{ loaderData?: unknown }>): Language {
 const data = matches[0]?.loaderData as { lang?: Language } | undefined;
 return data?.lang === 'ar' ? 'ar' : 'en';
}
