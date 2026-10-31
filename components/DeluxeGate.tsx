"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { useAccount } from "@/lib/useAccount";
import { BackLink } from "./BackLink";

/** Zeigt den Inhalt nur DELUXE-Mitgliedern (und Noah als Admin). */
export function DeluxeGate({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  const { t } = useI18n();
  const { hasAccess, loading } = useAccount();

  return (
    <>
      <BackLink href="/deluxe" />
      <h1>
        {icon} {title}
      </h1>
      {loading ? (
        <p>{t("loading")}</p>
      ) : hasAccess ? (
        children
      ) : (
        <div className="card" style={{ textAlign: "center", maxWidth: 460, margin: "20px auto" }}>
          <div style={{ fontSize: "3rem" }}>🔒💎</div>
          <h2>{t("dlxOnlyMembers")}</h2>
          <p className="muted">{t("dlxOnlyMembersSub")}</p>
          <Link href="/deluxe" className="btn yellow">
            💎 {t("dlxBuy")}
          </Link>
        </div>
      )}
    </>
  );
}
