"use client";

import { useState } from "react";
import { DeluxeGate } from "@/components/DeluxeGate";
import { getApi, type RedemptionStatus } from "@/lib/data";
import { useI18n, type DictKey } from "@/lib/i18n";
import { jingle } from "@/lib/sound";
import { useData } from "@/lib/useData";

const STATUS: Record<RedemptionStatus, { icon: string; label: DictKey }> = {
  neu: { icon: "⏳", label: "talerStatusNeu" },
  erledigt: { icon: "✅", label: "talerStatusErledigt" },
  abgelehnt: { icon: "↩️", label: "talerStatusAbgelehnt" },
};

export default function TalerPage() {
  const { t } = useI18n();
  return (
    <DeluxeGate title={t("talerTitle")} icon="🪙">
      <Taler />
    </DeluxeGate>
  );
}

function Taler() {
  const { t, lang, pick } = useI18n();
  const api = getApi();
  const { data, reload } = useData(async () => {
    const [balance, rewards, redemptions] = await Promise.all([api.talerBalance(), api.listRewards(), api.listRedemptions()]);
    return { balance, rewards, redemptions };
  });
  const [msg, setMsg] = useState<{ ok: boolean; key: DictKey } | null>(null);

  if (!data) return <p>{t("loading")}</p>;

  const redeem = async (id: string) => {
    if (!confirm(t("talerConfirm"))) return;
    setMsg(null);
    try {
      await api.redeemReward(id);
      jingle([659, 784, 1047]);
      setMsg({ ok: true, key: "talerDone" });
    } catch (e) {
      setMsg({ ok: false, key: e instanceof Error && e.message === "not-enough-taler" ? "talerNotEnough" : "errorGeneric" });
    }
    reload();
  };

  return (
    <>
      <div className="card taler-balance">
        <div className="muted">{t("talerBalance")}</div>
        <div className="coin-count">🪙 {data.balance}</div>
        <p className="muted" style={{ margin: 0 }}>{t("talerHow")}</p>
      </div>
      {msg && <p className={msg.ok ? "ok" : "err"}>{t(msg.key)}</p>}

      <h2 className="section-title">🎁 {t("talerRewards")}</h2>
      {data.rewards.length === 0 && <p className="muted">{t("talerNoRewards")}</p>}
      <div className="grid">
        {data.rewards.map((r) => {
          const affordable = data.balance >= r.cost;
          return (
            <div key={r.id} className="tile yellow" style={{ minHeight: 0 }}>
              <span className="icon">{r.emoji}</span>
              <span className="title">{pick(r, "title")}</span>
              <span className="price">🪙 {r.cost}</span>
              <button className="btn small" disabled={!affordable} onClick={() => redeem(r.id)} style={{ alignSelf: "flex-start" }}>
                {affordable ? t("talerRedeem") : `🔒 ${t("talerNotEnough")}`}
              </button>
            </div>
          );
        })}
      </div>

      {data.redemptions.length > 0 && (
        <>
          <h2 className="section-title">📜 {t("talerMine")}</h2>
          <div className="list">
            {data.redemptions.map((r) => (
              <div key={r.id} className="card list-item" style={{ padding: 12 }}>
                <div className="grow">
                  <strong>{r.reward_title}</strong> <span className="muted">· 🪙 {r.cost}</span>
                  <div className="muted" style={{ fontSize: "0.85rem" }}>{new Date(r.created_at).toLocaleDateString(lang)}</div>
                </div>
                <span className="pill">
                  {STATUS[r.status].icon} {t(STATUS[r.status].label)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
