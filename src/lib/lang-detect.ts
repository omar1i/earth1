import { createIsomorphicFn } from '@tanstack/react-start';
import { getCookie, getRequestHeader } from '@tanstack/react-start/server';
import type { Language } from './language';

export const LANG_COOKIE = 'earth-language';

// Server: language cookie, then Accept-Language, then English. Client: same cookie.
export const detectLanguage = createIsomorphicFn()
  .server((): Language => {
    const saved = getCookie(LANG_COOKIE);
    if (saved === 'ar' || saved === 'en') return saved;
    const accept = (getRequestHeader('accept-language') || '').trim().toLowerCase();
    return accept.startsWith('ar') ? 'ar' : 'en';
  })
  .client((): Language => {
    const m = document.cookie.match(/(?:^|;\s*)earth-language=(ar|en)/);
    if (m) return m[1] as Language;
    return document.documentElement.lang === 'ar' ? 'ar' : 'en';
  });
