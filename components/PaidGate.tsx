"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { useAccount } from "@/lib/useAccount";

/** Inhalt nur für zahlende DELUXE-Mitglieder (und Noah als Admin). */
export function PaidGate({ children }: { children: ReactNode }) {
  const { loading, hasAccess } = useAccount();
  const { t } = useI18n();
  if (loading) return <p>{t("loading")}</p>;
  if (hasAccess) return <>{children}</>;
  return <PayWall />;
}

export function PayWall() {
  const { t } = useI18n();
  const { profile } = useAccount();
  return (
    <div className="card" style={{ textAlign: "center", maxWidth: 480, margin: "20px auto" }}>
      <div style={{ fontSize: "3rem" }}>🔒💎</div>
      <h2>{t("payTitle")}</h2>
      <p className="muted">{t("paySub")}</p>
      <div className="row" style={{ justifyContent: "center" }}>
        {!profile && (
          <Link href="/konto?next=/deluxe" className="btn secondary">
            🪪 {t("accLoginTab")}
          </Link>
        )}
        <Link href="/deluxe" className="btn yellow">
          💎 {t("dlxBuy")}
        </Link>
      </div>
    </div>
  );
}
