import { PaidGate } from "@/components/PaidGate";

// Nur für zahlende DELUXE-Mitglieder (und Noah als Admin)
export default function Layout({ children }: { children: React.ReactNode }) {
  return <PaidGate>{children}</PaidGate>;
}
