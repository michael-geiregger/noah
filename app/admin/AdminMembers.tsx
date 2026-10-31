"use client";

import { getApi } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { formatPrice, useData } from "@/lib/useData";

export function AdminMembers() {
  const { t, lang } = useI18n();
  const api = getApi();
  const { data, error, reload } = useData(() => api.listMembers());

  if (error) return <p className="err">{t("errorGeneric")} {error}</p>;
  if (!data) return <p>{t("loading")}</p>;

  const deluxe = data.filter((m) => m.membership);
  const revenue = deluxe.reduce((sum, m) => sum + (m.membership?.source === "stripe" ? m.membership.amount_cents : 0), 0) / 100;

  const act = async (fn: () => Promise<void>) => {
    await fn();
    reload();
  };

  return (
    <div className="form">
      <div className="grid">
        <div className="card">
          <div className="muted">👥 {t("memTotal")}</div>
          <div className="price" style={{ fontSize: "2rem" }}>{data.length}</div>
        </div>
        <div className="card">
          <div className="muted">💎 {t("memDeluxe")}</div>
          <div className="price" style={{ fontSize: "2rem" }}>{deluxe.length}</div>
        </div>
        <div className="card">
          <div className="muted">💶 {t("memRevenue")}</div>
          <div className="price" style={{ fontSize: "2rem" }}>{formatPrice(revenue, lang)}</div>
        </div>
      </div>

      {data.length === 0 && <div className="card">{t("memNone")}</div>}
      <div className="list">
        {data.map((m) => (
          <div key={m.id} className="card list-item" style={{ opacity: m.blocked ? 0.6 : 1 }}>
            <div className="thumb">{m.avatar}</div>
            <div className="grow">
              <strong>{m.display_name}</strong>{" "}
              {m.membership && <span className="pill">💎 DELUXE</span>}{" "}
              {m.blocked && <span className="pill">🚫 {t("memBlocked")}</span>}
              <div className="muted" style={{ fontSize: "0.9rem", wordBreak: "break-all" }}>{m.email}</div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>
                ⭐ {m.rocket_stars} · {t("accMemberSince")} {new Date(m.created_at).toLocaleDateString(lang)}
                {m.membership &&
                  ` · 💎 ${new Date(m.membership.paid_at).toLocaleDateString(lang)} (${
                    m.membership.source === "stripe"
                      ? `${t("memPaidStripe")}, ${formatPrice(m.membership.amount_cents / 100, lang)}`
                      : t("memPaidAdmin")
                  })`}
              </div>
            </div>
            <button
              className={`btn small ${m.membership ? "secondary" : ""}`}
              onClick={() => {
                if (m.membership && !confirm(t("confirmDelete"))) return;
                act(() => api.adminSetMembership(m.id, !m.membership));
              }}
            >
              {m.membership ? `✖️ ${t("memRevoke")}` : `💎 ${t("memGrant")}`}
            </button>
            <button className={`btn small ${m.blocked ? "" : "danger"}`} onClick={() => act(() => api.adminSetBlocked(m.id, !m.blocked))}>
              {m.blocked ? `✅ ${t("memUnblock")}` : `🚫 ${t("memBlock")}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
