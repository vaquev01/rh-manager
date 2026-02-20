import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ClientShell } from "@/components/client-shell";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d9488",
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "B People | People Ops",
  description: "Plataforma inteligente de People Ops multi-empresa",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "B People — People Ops Multi-Empresa",
    description: "Escalas, pagamentos, comunicados, recrutamento e desenvolvimento — tudo em uma plataforma inteligente.",
    type: "website",
    locale: "pt_BR",
  },
  robots: { index: true, follow: true },
  keywords: ["people ops", "rh", "escalas", "pagamentos", "recrutamento", "comunicados", "gestão de equipe"],
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="B People" />
      </head>
      <body className={inter.className}>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
