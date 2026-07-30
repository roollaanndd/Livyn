import type { Metadata, Viewport } from "next";
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning className={`${inter.variable} ${manrope.variable} h-full`}>
      <body className="min-h-full antialiased font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
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
