import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { headers } from "next/headers";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import { Toaster } from "sonner";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Livyn — Faith. Every Day. Every Step.",
  description:
    "Livyn menemani perjalanan imanmu setiap hari: renungan, Alkitab, AI Pastor, pengingat doa, dan khotbah — tanpa gangguan media sosial.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Livyn",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF8" },
    { media: "(prefers-color-scheme: dark)", color: "#0D1512" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The Content-Security-Policy set in proxy.ts allows scripts by per-request
  // nonce. Next.js can only stamp that nonce onto its script tags while
  // rendering for a real request, so a page prerendered at build time would ship
  // script tags the browser then refuses to run — a blank screen, not a
  // degraded one. Waiting for the connection here opts every route into dynamic
  // rendering, which is the price of dropping 'unsafe-inline'.
  await connection();

  // next-themes writes its own inline script to set the theme class before first
  // paint. Next.js stamps its own tags with the nonce but knows nothing about
  // that one, so it has to be handed over explicitly — otherwise CSP blocks it
  // and every visitor gets a flash of the wrong theme.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="id" suppressHydrationWarning className={`${inter.variable} ${manrope.variable} h-full`}>
      <body className="min-h-full antialiased font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange nonce={nonce}>
          <AuthProvider>
            {children}
            <ServiceWorkerRegister />
            <Toaster
              richColors
              position="top-center"
              theme="system"
              toastOptions={{
                className: "!rounded-2xl !border-border-subtle !shadow-[var(--shadow-lg)] !font-sans",
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
