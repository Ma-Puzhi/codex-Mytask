import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Tasks",
  description: "每日任务、晚间复盘与休息日工作台",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
