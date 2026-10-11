"use client";

import { useState } from "react";
import { Comments } from "@/components/Comments";
import { getApi, type Video } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { useData, youtubeEmbed } from "@/lib/useData";

export default function VideosPage() {
  const { t } = useI18n();
  const { data, loading, error } = useData(() => getApi().listVideos());
  const [topic, setTopic] = useState<string | null>(null);

  const topics = [...new Set((data ?? []).map((v) => v.topic?.trim()).filter(Boolean))] as string[];
  const shown = (data ?? []).filter((v) => !topic || v.topic?.trim() === topic);

  return (
    <>
      <h1>🎬 {t("videosTitle")}</h1>
      <p className="muted">{t("videosIntro")}</p>
      {topics.length > 1 && (
        <div className="row" style={{ marginBottom: 14 }}>
          <button className={`btn small ${topic ? "secondary" : ""}`} onClick={() => setTopic(null)}>
            {t("allTopics")}
          </button>
          {topics.map((tp) => (
            <button key={tp} className={`btn small ${topic === tp ? "" : "secondary"}`} onClick={() => setTopic(tp)}>
              {tp}
            </button>
          ))}
        </div>
      )}
      {loading && <p>{t("loading")}</p>}
      {error && <p className="err">{t("errorGeneric")}</p>}
      {data && data.length === 0 && <div className="card">{t("videosEmpty")}</div>}
      <div className="grid-lg">
        {shown.map((v) => (
          <VideoCard key={v.id} v={v} />
        ))}
      </div>
    </>
  );
}

function VideoCard({ v }: { v: Video }) {
  const { t, pick } = useI18n();
  const [showComments, setShowComments] = useState(false);
  const embed = v.youtube_url ? youtubeEmbed(v.youtube_url) : null;

  return (
    <div className="card form">
      {v.video_url ? (
        <video className="video-frame" src={v.video_url} controls preload="metadata" playsInline />
      ) : embed ? (
        <iframe className="video-frame" src={embed} title={v.title} allowFullScreen allow="encrypted-media; picture-in-picture" />
      ) : null}
      <div>
        {v.topic && <span className="pill">{v.topic}</span>}
        <h2 style={{ marginTop: 6 }}>{pick(v, "title")}</h2>
        {v.description && <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{v.description}</p>}
      </div>
      <div>
        <button className="btn secondary small" onClick={() => setShowComments(!showComments)}>
          💬 {t("comments")}
        </button>
      </div>
      {showComments && <Comments target={{ video_id: v.id }} />}
    </div>
  );
}
