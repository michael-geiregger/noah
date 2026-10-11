"use client";

import { getApi } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/useData";

export function AdminComments() {
  const { t, lang } = useI18n();
  const api = getApi();
  const { data, reload } = useData(async () => {
    const [comments, products, videos] = await Promise.all([
      api.listAllComments(),
      api.listProducts(true),
      api.listVideos(true),
    ]);
    const names = new Map<string, string>();
    products.forEach((p) => names.set(p.id, `💡 ${p.name}`));
    videos.forEach((v) => names.set(v.id, `🎬 ${v.title}`));
    return { comments, names };
  });

  if (data && data.comments.length === 0) return <div className="card">{t("noCommentsAdmin")}</div>;

  return (
    <div className="list">
      {data?.comments.map((c) => (
        <div key={c.id} className="card form" style={{ gap: 6 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span>
              <strong>{c.author_name}</strong> → {data.names.get(c.product_id || c.video_id || "") ?? "?"}
            </span>
            <span className="muted">{new Date(c.created_at).toLocaleString(lang)}</span>
          </div>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{c.text}</p>
          <div className="row">
            {!c.approved && <span className="pill">⏳ {t("waiting")}</span>}
            <button
              className={`btn small ${c.approved ? "secondary" : ""}`}
              onClick={async () => {
                await api.setCommentApproved(c.id, !c.approved);
                reload();
              }}
            >
              {c.approved ? `🙈 ${t("unapprove")}` : `✅ ${t("approve")}`}
            </button>
            <button
              className="btn small danger"
              onClick={async () => {
                if (!confirm(t("confirmDelete"))) return;
                await api.deleteComment(c.id);
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
