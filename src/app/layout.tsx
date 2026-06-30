import type { Metadata } from "next";
import "./globals.css";
import { LangProvider } from "@/lib/i18n/LangProvider";
import { HTML_LANG } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";

export function generateMetadata(): Metadata {
  const locale = getLocale();
  return locale === "en"
    ? {
        title: "ScentPersona | Scent Persona Quiz",
        description:
          "Discover the scent of your current life chapter. Test first, then smell — and find your signature scent.",
      }
    : {
        title: "ScentPersona | 气味人格测试",
        description: "测出你当下人生阶段的味道。先测，再闻，找到你的本命香。",
      };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getLocale();
  return (
    <html lang={HTML_LANG[locale]}>
      <body className="min-h-screen flex flex-col">
        <LangProvider initialLocale={locale}>{children}</LangProvider>
      </body>
    </html>
  );
}
