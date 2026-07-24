import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClubeZN | Clube de Vantagens Zona Norte",
  description: "Plataforma de vantagens e descontos para moradores da Zona Norte de Porto Alegre.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "ClubeZN | Clube de Vantagens Zona Norte",
    description: "Plataforma de vantagens e descontos para moradores da Zona Norte de Porto Alegre.",
    siteName: "ClubeZN",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClubeZN | Clube de Vantagens Zona Norte",
    description: "Plataforma de vantagens e descontos para moradores da Zona Norte de Porto Alegre.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
