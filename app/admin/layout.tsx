import type { Metadata } from "next";

// Admin-Bereich nicht in Suchmaschinen anzeigen
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
