"use client";

import { useState } from "react";
import { getApi, type Challenge, type GameName, type Reward } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/useData";

type Sub = "challenges" | "taler" | "board" | "professor";

export function AdminDeluxe() {
  const { t } = useI18n();
  const [sub, setSub] = useState<Sub>("challenges");
  const subs: { key: Sub; label: string }[] = [
    { key: "challenges", label: `🎯 ${t("admChallenges")}` },
    { key: "taler", label: `🪙 ${t("admTalerShop")}` },
    { key: "board", label: `📌 ${t("admBoard")}` },
    { key: "professor", label: `🤖 ${t("admProfessor")}` },
  ];
  return (
    <>
      <div className="tabs">
        {subs.map((s) => (
          <button key={s.key} className={sub === s.key ? "on" : ""} onClick={() => setSub(s.key)} style={{ fontSize: "0.9rem" }}>
            {s.label}
          </button>
        ))}
      </div>
      {sub === "challenges" && <Challenges />}
      {sub === "taler" && <TalerShop />}
      {sub === "board" && <Board />}
      {sub === "professor" && <Professor />}
    </>
  );
}

/** Namen der Mitglieder für Anzeigen (id → "🤖 Lena") */
function useMemberNames() {
  const { data } = useData(() => getApi().listMembers());
  return (id: string) => {
    const m = data?.find((x) => x.id === id);
    return m ? `${m.avatar} ${m.display_name}` : "…";
  };
}

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

function Challenges() {
  const { t, lang } = useI18n();
  const api = getApi();
  const { data, reload } = useData(() => api.listChallenges());
  const [edit, setEdit] = useState<Partial<Challenge> | null>(null);

  const startNew = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 7 * 24 * 3600 * 1000);
    setEdit({ title: "", game: "rocket", prize: "", starts_at: start.toISOString(), ends_at: end.toISOString() });
  };

  if (edit)
    return (
      <form
        className="card form"
        onSubmit={async (e) => {
          e.preventDefault();
          await api.saveChallenge(edit);
          setEdit(null);
          reload();
        }}
      >
        <label className="field">
          {t("fTitle")}
          <input value={edit.title ?? ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} required placeholder="Mond-Woche 🌕" />
        </label>
        <div className="row">
          <label className="field" style={{ flex: 1 }}>
            {t("admGame")}
            <select value={edit.game} onChange={(e) => setEdit({ ...edit, game: e.target.value as GameName })}>
              <option value="rocket">🚀 {t("gameRocket")}</option>
              <option value="quiz">❓ {t("gameQuiz")}</option>
            </select>
          </label>
          <label className="field" style={{ flex: 2 }}>
            🎁 {t("chPrize")}
            <input value={edit.prize ?? ""} onChange={(e) => setEdit({ ...edit, prize: e.target.value })} />
          </label>
        </div>
        <div className="row">
          <label className="field" style={{ flex: 1 }}>
            {t("admStart")}
            <input type="datetime-local" value={toLocalInput(edit.starts_at!)} onChange={(e) => setEdit({ ...edit, starts_at: new Date(e.target.value).toISOString() })} required />
          </label>
          <label className="field" style={{ flex: 1 }}>
            {t("admEnd")}
            <input type="datetime-local" value={toLocalInput(edit.ends_at!)} onChange={(e) => setEdit({ ...edit, ends_at: new Date(e.target.value).toISOString() })} required />
          </label>
        </div>
        <details className="translations">
          <summary>🌍 {t("fTranslations")}</summary>
          <label className="field">
            {t("fTitle")} (English)
            <input value={edit.title_en ?? ""} onChange={(e) => setEdit({ ...edit, title_en: e.target.value })} />
          </label>
          <label className="field">
            {t("fTitle")} (日本語)
            <input value={edit.title_ja ?? ""} onChange={(e) => setEdit({ ...edit, title_ja: e.target.value })} />
          </label>
        </details>
        <div className="row">
          <button className="btn">💾 {t("save")}</button>
          <button type="button" className="btn secondary" onClick={() => setEdit(null)}>
            {t("cancel")}
          </button>
        </div>
      </form>
    );

  const now = new Date().toISOString();
  return (
    <div className="form">
      <div>
        <button className="btn yellow" onClick={startNew}>
          ➕ {t("admNewChallenge")}
        </button>
      </div>
      <div className="list">
        {data?.map((c) => (
          <div key={c.id} className="card list-item">
            <div className="thumb">{c.game === "rocket" ? "🚀" : "❓"}</div>
            <div className="grow">
              <strong>{c.title}</strong> {c.starts_at <= now && now < c.ends_at && <span className="pill">🟢 live</span>}
              <div className="muted" style={{ fontSize: "0.9rem" }}>
                {new Date(c.starts_at).toLocaleString(lang)} – {new Date(c.ends_at).toLocaleString(lang)}
                {c.prize && ` · 🎁 ${c.prize}`}
              </div>
            </div>
            <button className="btn small" onClick={() => setEdit(c)}>
              ✏️ {t("edit")}
            </button>
            <button
              className="btn small danger"
              onClick={async () => {
                if (!confirm(t("confirmDelete"))) return;
                await api.deleteChallenge(c.id);
                reload();
              }}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TalerShop() {
  const { t, lang } = useI18n();
  const api = getApi();
  const name = useMemberNames();
  const { data, reload } = useData(async () => {
    const [rewards, redemptions] = await Promise.all([api.listRewards(true), api.listRedemptions()]);
    return { rewards, redemptions };
  });
  const [edit, setEdit] = useState<Partial<Reward> | null>(null);

  return (
    <div className="form">
      <h2>🎁 {t("talerRewards")}</h2>
      {edit ? (
        <form
          className="card form"
          onSubmit={async (e) => {
            e.preventDefault();
            await api.saveReward({ ...edit, cost: Math.max(1, Number(edit.cost) || 1) });
            setEdit(null);
            reload();
          }}
        >
          <div className="row">
            <label className="field" style={{ flex: 3 }}>
              {t("fTitle")}
              <input value={edit.title ?? ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} required />
            </label>
            <label className="field" style={{ flex: 1 }}>
              Emoji
              <input value={edit.emoji ?? ""} onChange={(e) => setEdit({ ...edit, emoji: e.target.value })} maxLength={8} />
            </label>
            <label className="field" style={{ flex: 1 }}>
              🪙 {t("admCost")}
              <input type="number" min={1} value={edit.cost ?? 10} onChange={(e) => setEdit({ ...edit, cost: Number(e.target.value) })} />
            </label>
          </div>
          <label className="row" style={{ fontWeight: 700 }}>
            <input type="checkbox" checked={!!edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />
            {t("admActive")}
          </label>
          <details className="translations">
            <summary>🌍 {t("fTranslations")}</summary>
            <label className="field">
              {t("fTitle")} (English)
              <input value={edit.title_en ?? ""} onChange={(e) => setEdit({ ...edit, title_en: e.target.value })} />
            </label>
            <label className="field">
              {t("fTitle")} (日本語)
              <input value={edit.title_ja ?? ""} onChange={(e) => setEdit({ ...edit, title_ja: e.target.value })} />
            </label>
          </details>
          <div className="row">
            <button className="btn">💾 {t("save")}</button>
            <button type="button" className="btn secondary" onClick={() => setEdit(null)}>
              {t("cancel")}
            </button>
          </div>
        </form>
      ) : (
        <div>
          <button className="btn yellow" onClick={() => setEdit({ title: "", emoji: "🎁", cost: 20, active: true })}>
            ➕ {t("admNewReward")}
          </button>
        </div>
      )}
      <div className="list">
        {data?.rewards.map((r) => (
          <div key={r.id} className="card list-item" style={{ opacity: r.active ? 1 : 0.6 }}>
            <div className="thumb">{r.emoji}</div>
            <div className="grow">
              <strong>{r.title}</strong> <span className="muted">· 🪙 {r.cost}</span> {!r.active && <span className="pill">🙈 {t("hidden")}</span>}
            </div>
            <button className="btn small" onClick={() => setEdit(r)}>
              ✏️
            </button>
            <button
              className="btn small danger"
              onClick={async () => {
                if (!confirm(t("confirmDelete"))) return;
                await api.deleteReward(r.id);
                reload();
              }}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      <h2 className="section-title">📜 {t("admRedemptions")}</h2>
      {data?.redemptions.length === 0 && <p className="muted">{t("admNoRedemptions")}</p>}
      <div className="list">
        {data?.redemptions.map((r) => (
          <div key={r.id} className="card list-item">
            <div className="grow">
              <strong>{r.reward_title}</strong> <span className="muted">· 🪙 {r.cost}</span>
              <div className="muted" style={{ fontSize: "0.9rem" }}>
                {name(r.user_id)} · {new Date(r.created_at).toLocaleString(lang)}
              </div>
            </div>
            {r.status === "neu" ? (
              <>
                <button
                  className="btn small"
                  onClick={async () => {
                    await api.setRedemptionStatus(r.id, "erledigt");
                    reload();
                  }}
                >
                  ✅ {t("admDone")}
                </button>
                <button
                  className="btn small secondary"
                  onClick={async () => {
                    await api.setRedemptionStatus(r.id, "abgelehnt");
                    reload();
                  }}
                >
                  ↩️ {t("admDecline")}
                </button>
              </>
            ) : (
              <span className="pill">{r.status === "erledigt" ? `✅ ${t("talerStatusErledigt")}` : `↩️ ${t("talerStatusAbgelehnt")}`}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Board() {
  const { t, lang } = useI18n();
  const api = getApi();
  const { data, reload } = useData(() => api.listBoardPosts());
  if (data && data.length === 0) return <div className="card">{t("pinEmpty")}</div>;
  return (
    <div className="list">
      {data?.map((p) => (
        <div key={p.id} className="card form" style={{ gap: 6 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>
              {p.author_avatar} {p.author_name}
            </strong>
            <span className="muted">{new Date(p.created_at).toLocaleString(lang)}</span>
          </div>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{p.text}</p>
          <div className="row">
            {!p.approved && <span className="pill">⏳ {t("waiting")}</span>}
            <button
              className={`btn small ${p.approved ? "secondary" : ""}`}
              onClick={async () => {
                await api.setBoardPostApproved(p.id, !p.approved);
                reload();
              }}
            >
              {p.approved ? `🙈 ${t("unapprove")}` : `✅ ${t("approve")}`}
            </button>
            <button
              className="btn small danger"
              onClick={async () => {
                if (!confirm(t("confirmDelete"))) return;
                await api.deleteBoardPost(p.id);
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

function Professor() {
  const { t, lang } = useI18n();
  const name = useMemberNames();
  const { data } = useData(() => getApi().listAiQuestions());
  if (data && data.length === 0) return <div className="card">{t("admNoQuestions")}</div>;
  return (
    <div className="list">
      {data?.map((q) => (
        <details key={q.id} className="card">
          <summary style={{ cursor: "pointer" }}>
            <strong>{q.question}</strong>
            <div className="muted" style={{ fontSize: "0.85rem" }}>
              {name(q.user_id)} · {new Date(q.created_at).toLocaleString(lang)} · {q.lang.toUpperCase()}
            </div>
          </summary>
          <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>⚙️ {q.answer}</p>
        </details>
      ))}
    </div>
  );
}
