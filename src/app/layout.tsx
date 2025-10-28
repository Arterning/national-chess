import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
// import { zhCN } from '@clerk/localizations';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "四国军棋 - 在线对战平台",
  description: "体验经典四国军棋，支持实时多人对战",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="zh-CN">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
