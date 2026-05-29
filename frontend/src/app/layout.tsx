import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Proje Yönetimi", template: "%s · Proje Yönetimi" },
  description: "Keyboard-first issue tracking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`dark ${inter.variable}`}>
      <body className="bg-zinc-950 text-zinc-100 font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
