"use client";

import { useState } from "react";
import { getApi, type Video } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/useData";
import { uploadErrorKey } from "./upload";

const EMPTY: Partial<Video> = { title: "", description: "", topic: "", published: true };

export function AdminVideos() {
  const { t } = useI18n();
  const api = getApi();
  const { data, reload } = useData(() => api.listVideos(true));
  const [editing, setEditing] = useState<Partial<Video> | null>(null);

  if (editing)
    return (
      <VideoEditor
        initial={editing}
        onClose={() => {
          setEditing(null);
          reload();
        }}
      />
    );

  return (
    <div className="form">
      <div>
        <button className="btn yellow" onClick={() => setEditing({ ...EMPTY })}>
          ➕ {t("newVideo")}
        </button>
      </div>
      <div className="list">
        {data?.map((v) => (
          <div key={v.id} className="card list-item">
            <div className="thumb">🎬</div>
            <div className="grow">
              <strong>{v.title}</strong> {!v.published && <span className="pill">🙈 {t("hidden")}</span>}
              {v.topic && <div className="muted">{v.topic}</div>}
            </div>
            <button className="btn small" onClick={() => setEditing(v)}>
              ✏️ {t("edit")}
            </button>
            <button
              className="btn small danger"
              onClick={async () => {
                if (!confirm(t("confirmDelete"))) return;
                await api.deleteVideo(v.id);
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

function VideoEditor({ initial, onClose }: { initial: Partial<Video>; onClose: () => void }) {
  const { t } = useI18n();
  const api = getApi();
  const [v, setV] = useState<Partial<Video>>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const set = <K extends keyof Video>(k: K, val: Video[K]) => setV((old) => ({ ...old, [k]: val }));

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setMsg(t("uploading"));
    try {
      set("video_url", await api.uploadFile(file, "videos"));
      setMsg("✅");
    } catch (e) {
      setMsg(t(uploadErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.saveVideo(v);
      onClose();
    } catch (err) {
      setMsg(`${t("errorGeneric")} ${err instanceof Error ? err.message : ""}`);
      setBusy(false);
    }
  };

  return (
    <form className="card form" onSubmit={save}>
      <h2>{v.id ? `✏️ ${t("edit")}` : `➕ ${t("newVideo")}`}</h2>
      <label className="field">
        {t("fTitle")}
        <input value={v.title ?? ""} onChange={(e) => set("title", e.target.value)} required />
      </label>
      <label className="field">
        {t("fTopic")}
        <input value={v.topic ?? ""} onChange={(e) => set("topic", e.target.value)} />
      </label>
      <label className="field">
        {t("fDesc")}
        <textarea value={v.description ?? ""} onChange={(e) => set("description", e.target.value)} rows={3} />
      </label>
      <label className="field">
        {t("fVideoFile")}
        <input type="file" accept="video/*" onChange={(e) => upload(e.target.files?.[0])} />
      </label>
      {v.video_url && <video src={v.video_url} controls style={{ width: "100%", maxWidth: 360, borderRadius: 12 }} />}
      <label className="field">
        {t("fYoutube")}
        <input type="url" placeholder="https://youtu.be/…" value={v.youtube_url ?? ""} onChange={(e) => set("youtube_url", e.target.value)} />
      </label>
      <label className="row" style={{ fontWeight: 700 }}>
        <input type="checkbox" checked={!!v.published} onChange={(e) => set("published", e.target.checked)} />
        {t("fPublished")}
      </label>
      <details className="translations">
        <summary>🌍 {t("fTranslations")}</summary>
        <label className="field">
          {t("fTitle")} (English)
          <input value={v.title_en ?? ""} onChange={(e) => set("title_en", e.target.value)} />
        </label>
        <label className="field">
          {t("fTitle")} (日本語)
          <input value={v.title_ja ?? ""} onChange={(e) => set("title_ja", e.target.value)} />
        </label>
      </details>
      {msg && <p className="muted">{msg}</p>}
      <div className="row">
        <button className="btn" disabled={busy}>
          💾 {t("save")}
        </button>
        <button type="button" className="btn secondary" onClick={onClose}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
