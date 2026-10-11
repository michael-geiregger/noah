"use client";

import Link from "next/link";
import { ProductMedia } from "@/components/ProductMedia";
import { Stars } from "@/components/Stars";
import { getApi } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { averageStars, formatPrice, useData } from "@/lib/useData";

export default function ShopPage() {
  const { t, pick, lang } = useI18n();
  const api = getApi();
  const { data, loading, error } = useData(async () => {
    const [products, ratings] = await Promise.all([api.listProducts(), api.listRatings()]);
    return { products, ratings };
  });

  return (
    <>
      <h1>🛒 {t("shopTitle")}</h1>
      <p className="muted">{t("shopIntro")}</p>
      {loading && <p>{t("loading")}</p>}
      {error && <p className="err">{t("errorGeneric")}</p>}
      {data && data.products.length === 0 && <div className="card">{t("shopEmpty")}</div>}
      <div className="grid">
        {data?.products.map((p) => {
          const r = averageStars(data.ratings, p.id);
          return (
            <Link key={p.id} href={`/shop/${p.id}`} className="tile" style={{ minHeight: 0 }}>
              <ProductMedia p={p} />
              <span className="title">{pick(p, "name")}</span>
              <Stars avg={r.avg} count={r.count} />
              <span className="row" style={{ justifyContent: "space-between", marginTop: "auto" }}>
                <span className="price">{formatPrice(Number(p.price), lang)}</span>
                <span className="btn small">{t("details")} →</span>
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
