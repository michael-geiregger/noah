"use client";

import { useEffect, useRef, useState } from "react";
import { DeluxeGate } from "@/components/DeluxeGate";
import { getApi, type ProfessorTurn } from "@/lib/data";
import { useI18n, type DictKey, type Tri } from "@/lib/i18n";

const EXAMPLES: Tri[] = [
  { de: "Wie fliegt ein Flugzeug?", en: "How does a plane fly?", ja: "飛行機はどうやってとぶの？" },
  { de: "Warum ist der Himmel blau?", en: "Why is the sky blue?", ja: "空はどうして青いの？" },
  { de: "Wie funktioniert ein Magnet?", en: "How does a magnet work?", ja: "磁石はどうしてくっつくの？" },
  { de: "Was kann ich mit einem Strohhalm erfinden?", en: "What can I invent with a straw?", ja: "ストローで何を発明できる？" },
];

export default function ProfessorPage() {
  const { t } = useI18n();
  return (
    <DeluxeGate title={t("dlxPerkProf")} icon="🤖">
      <Chat />
    </DeluxeGate>
  );
}

function Chat() {
  const { t, lang } = useI18n();
  const [turns, setTurns] = useState<ProfessorTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<DictKey | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, pending]);

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || pending) return;
    setError(null);
    setPending(text);
    setQuestion("");
    try {
      const res = await getApi().askProfessor(text, lang, turns);
      setTurns((old) => [...old, { question: text, answer: res.answer }]);
      setRemaining(res.remaining);
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setQuestion(text);
      if (m === "daily-limit") {
        setError("profLimit");
        setRemaining(0);
      } else setError(m === "busy" ? "profBusy" : m === "not-configured" ? "profNotConfigured" : "errorGeneric");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="card form prof">
      <div className="bubble prof-bubble">
        <span className="prof-face">⚙️</span>
        <p>{t("profIntro")}</p>
      </div>

      {turns.length === 0 && !pending && (
        <div>
          <div className="muted" style={{ fontWeight: 800, marginBottom: 6 }}>💡 {t("profExamples")}</div>
          <div className="row">
            {EXAMPLES.map((ex, i) => (
              <button key={i} className="btn secondary small" onClick={() => ask(ex[lang])}>
                {ex[lang]}
              </button>
            ))}
          </div>
        </div>
      )}

      {turns.map((turn, i) => (
        <div key={i} className="form" style={{ gap: 8 }}>
          <div className="bubble me-bubble">{turn.question}</div>
          <div className="bubble prof-bubble">
            <span className="prof-face">⚙️</span>
            <p style={{ whiteSpace: "pre-wrap" }}>{turn.answer}</p>
          </div>
        </div>
      ))}
      {pending && (
        <>
          <div className="bubble me-bubble">{pending}</div>
          <div className="bubble prof-bubble">
            <span className="prof-face spin">⚙️</span>
            <p className="muted">{t("profThinking")}</p>
          </div>
        </>
      )}
      <div ref={end} />

      {error && <p className="err">{t(error)}</p>}
      <form
        className="row"
        style={{ flexWrap: "nowrap" }}
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={500}
          placeholder={t("profPlaceholder")}
          disabled={!!pending || remaining === 0}
          style={{ flex: 1, minWidth: 0 }}
        />
        <button className="btn" disabled={!!pending || !question.trim() || remaining === 0}>
          {t("profAsk")}
        </button>
      </form>
      <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
        {remaining !== null && (
          <>
            ❓ {remaining} {t("profRemaining")} ·{" "}
          </>
        )}
        {t("profNote")}
      </p>
    </div>
  );
}
