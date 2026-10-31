"use client";

import Link from "next/link";
import { useState } from "react";
import { DeluxeGate } from "@/components/DeluxeGate";
import { getApi, type Challenge, type GameName, type LeaderRow } from "@/lib/data";
import { useI18n, type DictKey } from "@/lib/i18n";
import { useData } from "@/lib/useData";

const GAMES: { key: GameName; label: DictKey; icon: string; href: string }[] = [
  { key: "rocket", label: "gameRocket", icon: "🚀", href: "/spielen/rakete" },
  { key: "quiz", label: "gameQuiz", icon: "❓", href: "/spielen/quiz" },
];

/** Montag 00:00 der aktuellen Woche */
function weekStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString();
}

export default function LeaderboardPage() {
  const { t } = useI18n();
  return (
    <DeluxeGate title={t("lbTitle")} icon="🏆">
      <Board />
    </DeluxeGate>
  );
}

function Board() {
  const { t, lang, pick } = useI18n();
  const api = getApi();
  const [game, setGame] = useState<GameName>("rocket");
  const [period, setPeriod] = useState<"week" | "all">("week");

  const { data: challenge } = useData(async () => {
    const now = new Date().toISOString();
    const active = (await api.listChallenges()).find((c) => c.starts_at <= now && now < c.ends_at) ?? null;
    if (!active) return null;
    return { challenge: active, rows: await api.leaderboard(active.game, active.starts_at, active.ends_at) };
  });
  const { data: rows } = useData(() => api.leaderboard(game, period === "week" ? weekStart() : undefined), [game, period]);

  return (
    <>
      <div className="card form challenge-card">
        <h2>🎯 {t("chTitle")}</h2>
        {!challenge ? (
          <p className="muted" style={{ margin: 0 }}>{t("chNone")}</p>
        ) : (
          <ChallengeView c={challenge.challenge} rows={challenge.rows} lang={lang} title={pick(challenge.challenge, "title")} />
        )}
      </div>

      <div className="tabs" style={{ marginTop: 20 }}>
        {GAMES.map((g) => (
          <button key={g.key} className={game === g.key ? "on" : ""} onClick={() => setGame(g.key)}>
            {g.icon} {t(g.label)}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button className={period === "week" ? "on" : ""} onClick={() => setPeriod("week")}>
          📅 {t("lbThisWeek")}
        </button>
        <button className={period === "all" ? "on" : ""} onClick={() => setPeriod("all")}>
          ♾️ {t("lbAllTime")}
        </button>
      </div>
      <Ranking rows={rows} />
    </>
  );
}

function ChallengeView({ c, rows, lang, title }: { c: Challenge; rows: LeaderRow[]; lang: string; title: string }) {
  const { t } = useI18n();
  const g = GAMES.find((x) => x.key === c.game)!;
  return (
    <>
      <div style={{ fontSize: "1.3rem", fontWeight: 900 }}>
        {g.icon} {title}
      </div>
      <div className="muted">
        {t(g.label)} · {t("chEnds")} {new Date(c.ends_at).toLocaleString(lang, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
        {c.prize && (
          <>
            {" "}
            · 🎁 {t("chPrize")}: <strong>{c.prize}</strong>
          </>
        )}
      </div>
      <Ranking rows={rows} compact />
      <div>
        <Link href={g.href} className="btn yellow">
          {g.icon} {t("chPlay")}
        </Link>
      </div>
    </>
  );
}

function Ranking({ rows, compact }: { rows: LeaderRow[] | null; compact?: boolean }) {
  const { t } = useI18n();
  if (!rows) return <p>{t("loading")}</p>;
  if (rows.length === 0) return <p className="muted">{t("lbEmpty")}</p>;
  const medal = ["🥇", "🥈", "🥉"];
  return (
    <ol className="ranking">
      {rows.slice(0, compact ? 5 : 20).map((r, i) => (
        <li key={i} className={r.is_me ? "me" : ""}>
          <span className="place">{medal[i] ?? i + 1}</span>
          <span className="who">
            <span style={{ fontSize: "1.4rem" }}>{r.avatar}</span> {r.display_name}
            {r.is_me && <span className="pill">{t("lbYou")}</span>}
          </span>
          <span className="pts">
            {r.points} <span className="muted">{t("lbPoints")}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
