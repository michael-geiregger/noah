"use client";

import { getApi, type OrderStatus } from "@/lib/data";
import { useI18n, type DictKey } from "@/lib/i18n";
import { useData } from "@/lib/useData";

const STATUS: { key: OrderStatus; label: DictKey; icon: string }[] = [
  { key: "neu", label: "statusNeu", icon: "🆕" },
  { key: "in_arbeit", label: "statusInArbeit", icon: "🔧" },
  { key: "erledigt", label: "statusErledigt", icon: "✅" },
];

export function AdminOrders() {
  const { t, lang } = useI18n();
  const api = getApi();
  const { data, reload } = useData(() => api.listOrders());

  if (data && data.length === 0) return <div className="card">{t("noOrders")}</div>;

  return (
    <div className="list">
      {data?.map((o) => (
        <div key={o.id} className="card form" style={{ gap: 6 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>
              {o.quantity}× {o.product_name}
            </strong>
            <span className="muted">{new Date(o.created_at).toLocaleString(lang)}</span>
          </div>
          <div>
            👤 {o.customer_name} · 📞 {o.contact}
          </div>
          {o.message && <div style={{ whiteSpace: "pre-wrap" }}>💬 {o.message}</div>}
          <div className="row">
            {STATUS.map((s) => (
              <button
                key={s.key}
                className={`btn small ${o.status === s.key ? "" : "secondary"}`}
                onClick={async () => {
                  await api.setOrderStatus(o.id, s.key);
                  reload();
                }}
              >
                {s.icon} {t(s.label)}
              </button>
            ))}
            <button
              className="btn small danger"
              onClick={async () => {
                if (!confirm(t("confirmDelete"))) return;
                await api.deleteOrder(o.id);
                reload();
              }}
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
