"use client";

import { useState } from "react";
import { BackLink } from "@/components/BackLink";
import { QUIZ } from "@/lib/content";
import { useI18n } from "@/lib/i18n";

export default function QuizPage() {
  const { t, lang } = useI18n();
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = index >= QUIZ.length;

  const choose = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    if (i === QUIZ[index].correct) setScore((s) => s + 1);
  };

  const next = () => {
    setChosen(null);
    setIndex((i) => i + 1);
  };

  const restart = () => {
    setIndex(0);
    setScore(0);
    setChosen(null);
  };

  if (done) {
    const medal = score === QUIZ.length ? "🏆" : score >= QUIZ.length / 2 ? "🥈" : "💪";
    return (
      <>
        <BackLink href="/spielen" />
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "4rem" }}>{medal}</div>
          <h1>{t("quizDone")}</h1>
          <p style={{ fontSize: "1.4rem", fontWeight: 900 }}>
            {score} / {QUIZ.length} {t("quizScore")}
          </p>
          <button className="btn yellow" onClick={restart}>
            🔁 {t("quizAgain")}
          </button>
        </div>
      </>
    );
  }

  const q = QUIZ[index];
  return (
    <>
      <BackLink href="/spielen" />
      <h1>❓ {t("tileQuiz")}</h1>
      <div className="card form">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="pill">
            {t("quizQuestion")} {index + 1} {t("quizOf")} {QUIZ.length}
          </span>
          <span className="pill">⭐ {score}</span>
        </div>
        <div className="progress">
          <div style={{ width: `${(index / QUIZ.length) * 100}%` }} />
        </div>
        <h2>{q.q[lang]}</h2>
        <div className="answers">
          {q.answers.map((a, i) => {
            const state = chosen === null ? "" : i === q.correct ? "right" : i === chosen ? "wrong" : "";
            return (
              <button key={i} className={`answer ${state}`} onClick={() => choose(i)} disabled={chosen !== null}>
                {a[lang]}
              </button>
            );
          })}
        </div>
        {chosen !== null && (
          <>
            <p className={chosen === q.correct ? "ok" : "err"}>{chosen === q.correct ? t("quizRight") : t("quizWrong")}</p>
            <p>
              <strong>{t("didYouKnow")}</strong> {q.fact[lang]}
            </p>
            <div>
              <button className="btn" onClick={next}>
                {t("quizNext")} →
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
