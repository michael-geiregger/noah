"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { notifyAuthChanged } from "@/lib/adminEvents";
import { getApi } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { AVATARS, badgesFor, rankFor } from "@/lib/rank";
import { useAccount } from "@/lib/useAccount";

export default function AccountPage() {
  return (
    <Suspense>
      <Account />
    </Suspense>
  );
}

function Account() {
  const { t } = useI18n();
  const { profile, membership, loading, reload } = useAccount();

  if (loading) return <p>{t("loading")}</p>;
  if (!profile) return <AuthForms />;

  return <IdCard key={profile.id} onChanged={reload} profile={profile} membership={membership} />;
}

function IdCard({
  profile,
  membership,
  onChanged,
}: {
  profile: NonNullable<ReturnType<typeof useAccount>["profile"]>;
  membership: ReturnType<typeof useAccount>["membership"];
  onChanged: () => void;
}) {
  const { t, lang } = useI18n();
  const api = getApi();
  const [name, setName] = useState(profile.display_name);
  const [picking, setPicking] = useState(false);
  const [saved, setSaved] = useState(false);
  const rank = rankFor(profile.rocket_stars);
  const badges = badgesFor(profile, membership);

  const save = async (patch: { display_name?: string; avatar?: string }) => {
    await api.updateMyProfile(patch);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    notifyAuthChanged();
    onChanged();
  };

  return (
    <>
      <h1>🪪 {t("accTitle")}</h1>
      {profile.blocked && <p className="card err">{t("accBlocked")}</p>}

      <div className={`idcard ${membership ? "deluxe" : ""}`}>
        <div className="idcard-head">
          <span>⚙️ TPWE</span>
          {membership && <span className="pill">💎 DELUXE</span>}
        </div>
        <div className="idcard-body">
          <button className="idcard-avatar" onClick={() => setPicking(!picking)} aria-label={t("accChooseAvatar")}>
            {profile.avatar}
          </button>
          <div className="form" style={{ gap: 6, flex: 1, minWidth: 0 }}>
            <form
              className="row"
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim()) save({ display_name: name.trim() });
              }}
            >
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} aria-label={t("accName")} style={{ flex: 1, minWidth: 0, fontWeight: 900, fontSize: "1.2rem" }} />
              {name.trim() !== profile.display_name && (
                <button className="btn small">💾</button>
              )}
            </form>
            <div>
              {rank.icon} <strong>{t(rank.key)}</strong>
            </div>
            <div className="muted" style={{ fontSize: "0.9rem" }}>
              {t("accMemberSince")} {new Date(profile.created_at).toLocaleDateString(lang)}
            </div>
          </div>
        </div>
        {picking && (
          <div className="avatar-grid">
            {AVATARS.map((a) => (
              <button
                key={a}
                className={a === profile.avatar ? "on" : ""}
                onClick={() => {
                  setPicking(false);
                  save({ avatar: a });
                }}
              >
                {a}
              </button>
            ))}
          </div>
        )}
        <div className="idcard-stats">
          <div>
            <strong>⭐ {profile.rocket_stars}</strong>
            <span>{t("accStars")}</span>
          </div>
          <div>
            <strong>❓ {profile.quiz_best}</strong>
            <span>{t("accQuizBest")}</span>
          </div>
        </div>
      </div>
      {saved && <p className="ok">{t("saved")}</p>}

      <h2 className="section-title">🏅 {t("accBadges")}</h2>
      {badges.length === 0 ? (
        <p className="muted">{t("accNoBadges")}</p>
      ) : (
        <div className="row">
          {badges.map((b) => (
            <span key={b.key} className="badge-chip">
              <span style={{ fontSize: "1.6rem" }}>{b.icon}</span> {t(b.key)}
            </span>
          ))}
        </div>
      )}

      <div className="row" style={{ marginTop: 24 }}>
        {!membership && (
          <Link href="/deluxe" className="btn yellow">
            💎 {t("dlxBuy")}
          </Link>
        )}
        <button
          className="btn secondary"
          onClick={async () => {
            await api.logout();
            notifyAuthChanged();
          }}
        >
          {t("accLogout")}
        </button>
      </div>
    </>
  );
}

function AuthForms() {
  const { t } = useI18n();
  const api = getApi();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [parents, setParents] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; check?: boolean } | null>(null);

  const done = () => {
    notifyAuthChanged();
    if (next?.startsWith("/")) router.push(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "login") {
        await api.login(email.trim(), password);
        done();
      } else {
        const result = await api.signUp(email.trim(), password, name.trim());
        if (result === "confirm-email") setMsg({ ok: true, text: t("accConfirmEmail") });
        else done();
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      const known: Record<string, string> = {
        "already-registered": t("accAlready"),
        network: t("accNetwork"),
        "server-unreachable": t("accServerDown"),
        "confirm-email": t("accNotConfirmed"),
      };
      if (m === "signup-disabled") known[m] = t("accSignupOff");
      if (m.startsWith("email-setup:")) known[m] = `${t("accEmailSetup")} [${m.slice(12)}]`;
      setMsg({ ok: false, text: known[m] ?? (mode === "login" ? t("accWrong") : `${t("errorGeneric")} [${m}]`), check: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 460, margin: "10px auto" }}>
      <h1>🪪 {t("accTitle")}</h1>
      <p className="muted">{t("accIntro")}</p>
      <div className="tabs">
        <button className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>
          {t("accLoginTab")}
        </button>
        <button className={mode === "register" ? "on" : ""} onClick={() => setMode("register")}>
          ✨ {t("accRegisterTab")}
        </button>
      </div>
      <form className="form" onSubmit={submit}>
        {mode === "register" && (
          <label className="field">
            {t("accName")}
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} required placeholder="Captain Zahnrad" />
          </label>
        )}
        <label className="field">
          {t("adminEmail")}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label className="field">
          {t("adminPassword")} {mode === "register" && <span className="muted">({t("accPasswordHint")})</span>}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "register" ? 8 : undefined}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
        </label>
        {mode === "register" && (
          <label className="row" style={{ fontWeight: 700, flexWrap: "nowrap", alignItems: "flex-start" }}>
            <input type="checkbox" checked={parents} onChange={(e) => setParents(e.target.checked)} required style={{ marginTop: 5 }} />
            <span>{t("accParents")}</span>
          </label>
        )}
        {msg && <p className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
        {msg?.check && api.mode === "online" && (
          <p className="muted" style={{ margin: 0 }}>
            🩺 <Link href="/check">{t("accCheckLink")}</Link>
          </p>
        )}
        <button className="btn" disabled={busy}>
          {mode === "login" ? t("accLoginTab") : t("accCreate")}
        </button>
      </form>
    </div>
  );
}
