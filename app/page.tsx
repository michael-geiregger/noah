"use client";

import Link from "next/link";
import { Tile } from "@/components/Tile";
import { useI18n } from "@/lib/i18n";
import { useAccount } from "@/lib/useAccount";

export default function Home() {
  const { t } = useI18n();
  const { isDeluxe } = useAccount();

  return (
    <>
      <section className="hero">
        <span className="badge">{t("appLong")}</span>
        <h1>{t("welcome")}</h1>
        <p>{t("welcomeSub")}</p>
      </section>

      <div className="grid-3">
        <Tile href="/spielen" icon="🎮" title={t("navPlay")} sub={t("tilePlay")} variant="blue" big />
        <Tile href="/shop" icon="🛒" title={t("navShop")} sub={t("tileShop")} variant="yellow" big />
        <Tile href="/videos" icon="🎬" title={t("navVideos")} sub={t("tileVideos")} variant="blue" big />
      </div>

      <Link href="/deluxe" className="deluxe-banner">
        <span className="icon">💎</span>
        <span style={{ flex: 1 }}>
          <span className="title">TPWE DELUXE</span>
          <span className="sub">{isDeluxe ? t("dlxHub") : t("dlxBannerSub")}</span>
        </span>
        <span className="btn yellow">{isDeluxe ? `${t("open")} →` : t("dlxBuy")}</span>
      </Link>
    </>
  );
}
