"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <strong>TPWE</strong> · {t("appLong")} · © Noah ·{" "}
      <Link href="/admin" aria-label={t("navAdmin")} style={{ textDecoration: "none" }}>
        🔒
      </Link>
    </footer>
  );
}
