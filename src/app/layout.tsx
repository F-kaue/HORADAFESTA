import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const jakarta = localFont({
  src: [
    { path: "../fonts/PlusJakartaSans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/PlusJakartaSans-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/PlusJakartaSans-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/PlusJakartaSans-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Hora da Festa",
    template: "%s | Hora da Festa",
  },
  description: "Hora da Festa — Buffet móvel & eventos em Caucaia e região",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#F7F4F0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('horadafesta-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${jakarta.variable} font-sans`}>
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: "font-sans text-sm shadow-elevated",
            },
          }}
        />
      </body>
    </html>
  );
}
