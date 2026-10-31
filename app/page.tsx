"use client";

import Link from "next/link";
import { Tile } from "@/components/Tile";
import { useI18n } from "@/lib/i18n";
import { useAccount } from "@/lib/useAccount";

export default function Home() {
  const { t } = useI18n();
  const { hasAccess, profile, loading } = useAccount();

  return (
    <>
      <section className="hero">
        <span className="badge">{t("appLong")}</span>
        <h1>{t("welcome")}</h1>
        <p>{hasAccess ? t("welcomeSub") : t("paySub")}</p>
      </section>

      {loading ? null : hasAccess ? (
        <div className="grid-3">
          <Tile href="/spielen" icon="🎮" title={t("navPlay")} sub={t("tilePlay")} variant="blue" big />
          <Tile href="/shop" icon="🛒" title={t("navShop")} sub={t("tileShop")} variant="yellow" big />
          <Tile href="/videos" icon="🎬" title={t("navVideos")} sub={t("tileVideos")} variant="blue" big />
        </div>
      ) : (
        <>
          <div className="row" style={{ justifyContent: "center", marginBottom: 28 }}>
            {!profile && (
              <Link href="/konto?next=/deluxe" className="btn secondary" style={{ fontSize: "1.1rem" }}>
                🪪 {t("accLoginTab")}
              </Link>
            )}
            <Link href="/deluxe" className="btn yellow" style={{ fontSize: "1.2rem" }}>
              💎 {t("dlxBuy")} · 10,50 €
            </Link>
          </div>
          <h2 className="section-title" style={{ justifyContent: "center" }}>✨ {t("landingWhat")}</h2>
          <div className="grid-3">
            {[
              { icon: "🎮", title: t("navPlay"), sub: t("tilePlay") },
              { icon: "🛒", title: t("navShop"), sub: t("tileShop") },
              { icon: "🎬", title: t("navVideos"), sub: t("tileVideos") },
              { icon: "🏆", title: t("dlxPerkBoard"), sub: t("dlxPerkBoardSub") },
              { icon: "🤖", title: t("dlxPerkProf"), sub: t("dlxPerkProfSub") },
              { icon: "🪙", title: t("dlxPerkTaler"), sub: t("dlxPerkTalerSub") },
            ].map((x) => (
              <Link key={x.title} href="/deluxe" className="tile locked" style={{ minHeight: 0 }}>
                <span className="icon">{x.icon}</span>
                <span className="title">{x.title}</span>
                <span className="sub">{x.sub}</span>
                <span className="lock">🔒</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
