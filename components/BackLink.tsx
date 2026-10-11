"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export function BackLink({ href }: { href: string }) {
  const { t } = useI18n();
  return (
    <Link href={href} className="backlink">
      ← {t("back")}
    </Link>
  );
}
