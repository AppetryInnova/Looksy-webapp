import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "../globals.css";
import { Providers } from "@/components/Providers";
import Toast from "@/components/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Looksy | Tu Asistente de Estilo",
  description: "Red social de moda y asistente de estilo con IA.",
  icons: {
    icon: '/icon-192x192.png',
    shortcut: '/favicon.png',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    title: 'Looksy',
    statusBarStyle: 'default',
    capable: true,
  },
};

export const viewport = {
  themeColor: '#121212',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import ConditionalLayout from "@/components/ConditionalLayout";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { PostHogProvider } from "@/providers/PostHogProvider";

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <PostHogProvider>
            <Providers>
              <ConditionalLayout>
                <ServiceWorkerRegister />
                {children}
              </ConditionalLayout>
              <Toast />
            </Providers>
          </PostHogProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
