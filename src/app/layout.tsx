import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScentPersona | 气味人格测试",
  description: "测出你当下人生阶段的味道。先测，再闻，找到你的本命香。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
