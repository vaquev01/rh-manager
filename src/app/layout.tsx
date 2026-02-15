import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { ClientShell } from "@/components/client-shell";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "People Ops Multi-Empresa",
  description:
    "Sistema operacional de People Ops com dashboard vivo, pagamentos do dia, comunicados, recrutamento e desenvolvimento.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "People Ops Multi-Empresa",
    description: "Central operacional de RH com dashboard, pagamentos, comunicados, recrutamento e desenvolvimento.",
    type: "website",
    locale: "pt_BR"
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9fcff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" }
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className={inter.className}>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
