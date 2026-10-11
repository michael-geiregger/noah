"use client";

import { useState } from "react";
import { getApi, type CommentTarget } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/useData";

export function Comments({ target }: { target: CommentTarget }) {
  const { t, lang } = useI18n();
  const api = getApi();
  const key = "product_id" in target ? target.product_id : target.video_id;
  const { data } = useData(() => api.listComments(target), [key]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    setState("sending");
    try {
      await api.addComment({ ...target, author_name: name.trim(), text: text.trim() });
      setText("");
      setState("sent");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="form">
      <h2>💬 {t("comments")}</h2>
      {data && data.length === 0 && <p className="muted">{t("noComments")}</p>}
      <div className="list">
        {data?.map((c) => (
          <div key={c.id} className="card" style={{ padding: 12 }}>
            <strong>{c.author_name}</strong>{" "}
            <span className="muted" style={{ fontSize: "0.85rem" }}>
              {new Date(c.created_at).toLocaleDateString(lang)}
            </span>
            <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{c.text}</p>
          </div>
        ))}
      </div>
      <form className="form" onSubmit={send}>
        <label className="field">
          {t("commentName")}
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
        </label>
        <label className="field">
          {t("commentText")}
          <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={500} rows={3} required />
        </label>
        <div className="row">
          <button className="btn" disabled={state === "sending"}>
            ✉️ {t("commentSend")}
          </button>
          {state === "sent" && <span className="ok">{t("commentThanks")}</span>}
          {state === "error" && <span className="err">{t("errorGeneric")}</span>}
        </div>
      </form>
    </div>
  );
}
