"use client";

import { useState } from "react";
import { DeluxeGate } from "@/components/DeluxeGate";
import { getApi } from "@/lib/data";
import { useI18n, type DictKey } from "@/lib/i18n";
import { useAccount } from "@/lib/useAccount";
import { useData } from "@/lib/useData";

export default function PinboardPage() {
  const { t } = useI18n();
  return (
    <DeluxeGate title={t("pinTitle")} icon="📌">
      <Pinboard />
    </DeluxeGate>
  );
}

function Pinboard() {
  const { t, lang } = useI18n();
  const api = getApi();
  const { profile } = useAccount();
  const { data: posts, reload } = useData(() => api.listBoardPosts());
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; key: DictKey } | null>(null);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      await api.addBoardPost(text.trim());
      setText("");
      setMsg({ ok: true, key: "pinSent" });
      reload();
    } catch (err) {
      setMsg({ ok: false, key: err instanceof Error && err.message === "too-many-posts" ? "pinTooMany" : "errorGeneric" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <form className="card form" onSubmit={post}>
        <p className="muted" style={{ margin: 0 }}>🛡️ {t("pinRules")}</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={300} rows={3} placeholder={t("pinPlaceholder")} />
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="muted" style={{ fontSize: "0.85rem" }}>{text.length}/300</span>
          <button className="btn yellow" disabled={busy || !text.trim()}>
            📌 {t("pinPost")}
          </button>
        </div>
        {msg && <p className={msg.ok ? "ok" : "err"} style={{ margin: 0 }}>{t(msg.key)}</p>}
      </form>

      <div className="pinboard">
        {posts && posts.length === 0 && <p className="muted">{t("pinEmpty")}</p>}
        {posts?.map((p, i) => (
          <div key={p.id} className="pin-note" style={{ transform: `rotate(${((i * 37) % 5) - 2}deg)` }}>
            <div className="row" style={{ justifyContent: "space-between", gap: 6 }}>
              <strong>
                {p.author_avatar} {p.author_name}
              </strong>
              <span className="muted" style={{ fontSize: "0.8rem" }}>{new Date(p.created_at).toLocaleDateString(lang)}</span>
            </div>
            <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{p.text}</p>
            {(!p.approved || p.user_id === profile?.id) && (
              <div className="row" style={{ marginTop: 8, justifyContent: "space-between" }}>
                {!p.approved ? <span className="pill">⏳ {t("pinWaiting")}</span> : <span />}
                {p.user_id === profile?.id && (
                  <button
                    className="btn small secondary"
                    onClick={async () => {
                      if (!confirm(t("confirmDelete"))) return;
                      await api.deleteBoardPost(p.id);
                      reload();
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
