"use client";

import { useI18n } from "@/lib/i18n";

export function Stars({ avg, count }: { avg: number; count: number }) {
  const { t } = useI18n();
  if (!count) return <span className="muted">{t("noRatings")}</span>;
  const full = Math.round(avg);
  return (
    <span>
      <span className="stars" aria-label={`${avg.toFixed(1)} / 5`}>
        {"★".repeat(full)}
        {"☆".repeat(5 - full)}
      </span>{" "}
      <span className="muted">
        {avg.toFixed(1)} ({count} {t("ratings")})
      </span>
    </span>
  );
}
