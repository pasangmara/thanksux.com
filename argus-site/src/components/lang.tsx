"use client";

import { createContext, useContext } from "react";
import { CONTENT, type Content } from "@/lib/content";
import type { Lang } from "@/lib/i18n";

const LangContext = createContext<Lang>("en");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
export const useContent = (): Content => CONTENT[useContext(LangContext)];
