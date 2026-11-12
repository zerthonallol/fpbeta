import type { Lang } from "./story";
export const LANG_KEY = "park-lang";
let current: Lang = "ru";
export const getLang = () => current;
export const setLang = (l: Lang) => { current = l; try { localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ } };
export const loadLang = (): Lang => {
  try {
    const s = localStorage.getItem(LANG_KEY);
    if (s === "ru" || s === "en") current = s;
    else current = navigator.language?.toLowerCase().startsWith("ru") ? "ru" : "en";
  } catch { /* ignore */ }
  return current;
};
/** Pick the string for the active language. */
export const L = (ru: string, en: string) => (current === "en" ? en : ru);
