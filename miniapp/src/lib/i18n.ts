import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import type { Locale } from "./scoring/types";

export type { Locale };

const STORAGE_KEY = "lang";

function readSaved(): Locale {
  try {
    const saved = Taro.getStorageSync(STORAGE_KEY);
    if (saved === "en" || saved === "zh") return saved;
  } catch {
    /* ignore */
  }
  return "zh";
}

let current: Locale = readSaved();

type Listener = (l: Locale) => void;
const listeners = new Set<Listener>();

export function getLocale(): Locale {
  return current;
}

/** Localized tab bar labels (tabBar text in app.config.ts is the zh fallback). */
const TAB_LABELS: Record<Locale, string[]> = {
  zh: ["首页", "产品", "订单", "我的"],
  en: ["Home", "Shop", "Orders", "Me"],
};

/** Update the tab bar text at runtime to match the active locale. */
export function syncTabBar(locale: Locale = current): void {
  const labels = TAB_LABELS[locale] ?? TAB_LABELS.zh;
  labels.forEach((text, index) => {
    try {
      Taro.setTabBarItem({ index, text });
    } catch {
      /* not on a tabBar page / unsupported */
    }
  });
}

export function setLocale(next: Locale): void {
  if (next !== "zh" && next !== "en") return;
  current = next;
  try {
    Taro.setStorageSync(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn(next));
  syncTabBar(next);
}

export function toggleLocale(): void {
  setLocale(current === "zh" ? "en" : "zh");
}

/** Subscribe a component to the active locale; re-renders on change. */
export function useLang(): {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
} {
  const [locale, setL] = useState<Locale>(current);
  useEffect(() => {
    const fn: Listener = (l) => setL(l);
    listeners.add(fn);
    setL(current);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return { locale, setLocale, toggleLocale };
}

export function pick(locale: Locale, zh: string, en: string): string {
  return locale === "en" ? en : zh;
}

/** Set the native navigation bar title to match the active locale (per page). */
export function useNavTitle(zh: string, en: string): void {
  const { locale } = useLang();
  useEffect(() => {
    try {
      Taro.setNavigationBarTitle({ title: locale === "en" ? en : zh });
    } catch {
      /* ignore */
    }
  }, [locale, zh, en]);
}
