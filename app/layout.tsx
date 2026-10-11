import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "TPWE – Noahs Erfinder-Welt",
  description: "Technik, Physik, Wissenschaft und Erfindungen – die App von Noah.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "TPWE", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fffbe3",
};

// Setzt Hell/Dunkel vor dem ersten Zeichnen, damit nichts aufblitzt.
const themeScript = `try{var t=localStorage.getItem('tpwe-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <I18nProvider>
          <TopBar />
          <main className="container">{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
