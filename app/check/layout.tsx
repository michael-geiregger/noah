import type { Metadata } from "next";

export const metadata: Metadata = { title: "TPWE – Prüfung", robots: { index: false, follow: false } };

export default function CheckLayout({ children }: { children: React.ReactNode }) {
  return children;
}
