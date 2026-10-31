import Anthropic from "@anthropic-ai/sdk";
import { canUseDeluxe, ConfigError, json, supabaseAdmin, userFromRequest } from "@/lib/server/deluxe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAILY_LIMIT = 20;
const MAX_QUESTION = 500;
const MAX_HISTORY = 6;

const LANG_NAME: Record<string, string> = { de: "Deutsch", en: "English", ja: "日本語 (einfaches Japanisch für Kinder, viel Hiragana)" };

const REFUSAL: Record<string, string> = {
  de: "Hmm, darauf kann ich leider nicht antworten. 🤔 Frag mich gern etwas über Technik, Physik, Wissenschaft oder Erfindungen!",
  en: "Hmm, I can't answer that one. 🤔 Ask me something about technology, physics, science or inventions!",
  ja: "うーん、それにはこたえられないよ。🤔 テクノロジー・物理・科学・発明のことをきいてね！",
};

function systemPrompt(lang: string) {
  return `Du bist „Professor Zahnrad“ ⚙️, der freundliche Erfinder-Professor in der App TPWE (Technik, Physik, Wissenschaft, Erfindungen). Die App gehört Noah (8 Jahre) und ist Teil von Noahs eigener Erfinder-Firma.

Wer fragt: meistens Kinder zwischen 6 und 12 Jahren, manchmal Erwachsene.

So antwortest du:
- Immer auf ${LANG_NAME[lang] ?? "Deutsch"}.
- Kurz: höchstens etwa 120 Wörter. Einfache Wörter, kurze Sätze.
- Mit einem anschaulichen Vergleich aus dem Alltag eines Kindes. Ein, zwei passende Emojis sind gut.
- Wenn es passt: eine kleine, ungefährliche Experiment-Idee zum Nachmachen.
- Ehrlich: Wenn du etwas nicht sicher weißt, sag das.
- Nur einfacher Text, keine Überschriften oder Tabellen.

Sicherheit (sehr wichtig):
- Schlage nie gefährliche Experimente vor (Feuer, Steckdose/Netzstrom, Chemikalien, scharfe Werkzeuge, Höhe). Wenn danach gefragt wird, erkläre kindgerecht warum es gefährlich ist und dass so etwas nur mit Erwachsenen geht.
- Frag nie nach persönlichen Daten (Name, Adresse, Schule, Telefonnummer, Fotos) und rate, solche Daten nirgends zu verraten.
- Bleib bei Technik, Physik, Wissenschaft, Natur und Erfindungen. Bei anderen Themen lenke freundlich zurück.
- Wenn ein Kind traurig, ängstlich oder in Gefahr wirkt: antworte liebevoll und rate, mit Eltern oder einem anderen vertrauten Erwachsenen zu sprechen.`;
}

type Turn = { question: string; answer: string };

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new ConfigError("ANTHROPIC_API_KEY fehlt");

    const user = await userFromRequest(req);
    if (!user) return json({ error: "not-logged-in" }, 401);
    if (!(await canUseDeluxe(user))) return json({ error: "not-member" }, 403);

    const body = (await req.json().catch(() => ({}))) as { question?: unknown; lang?: unknown; history?: unknown };
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const lang = typeof body.lang === "string" && body.lang in LANG_NAME ? body.lang : "de";
    if (!question || question.length > MAX_QUESTION) return json({ error: "bad-request" }, 400);

    const history = (Array.isArray(body.history) ? body.history : [])
      .filter((t): t is Turn => typeof t?.question === "string" && typeof t?.answer === "string")
      .slice(-MAX_HISTORY)
      .map((t) => ({ question: t.question.slice(0, MAX_QUESTION), answer: t.answer.slice(0, 2000) }));

    // Tageslimit pro Konto
    const db = supabaseAdmin();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await db
      .from("ai_questions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", since);
    if (countError) throw new Error(countError.message);
    const used = count ?? 0;
    if (used >= DAILY_LIMIT) return json({ error: "daily-limit", remaining: 0 }, 429);

    const messages: Anthropic.Beta.BetaMessageParam[] = [
      ...history.flatMap((t): Anthropic.Beta.BetaMessageParam[] => [
        { role: "user", content: t.question },
        { role: "assistant", content: t.answer },
      ]),
      { role: "user", content: question },
    ];

    const client = new Anthropic();
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: systemPrompt(lang),
      messages,
    });

    let answer =
      response.stop_reason === "refusal"
        ? REFUSAL[lang]
        : response.content
            .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
            .map((b) => b.text)
            .join("\n")
            .trim();
    if (!answer) answer = REFUSAL[lang];

    const { error: insertError } = await db.from("ai_questions").insert({ user_id: user.id, question, answer, lang });
    if (insertError) console.error("professor log", insertError.message);

    return json({ answer, remaining: DAILY_LIMIT - used - 1 });
  } catch (e) {
    if (e instanceof ConfigError) return json({ error: "not-configured" }, 503);
    if (e instanceof Anthropic.RateLimitError) return json({ error: "busy" }, 429);
    if (e instanceof Anthropic.APIError) {
      console.error("professor api", e.status, e.message);
      return json({ error: "ai-error" }, 502);
    }
    console.error("professor", e);
    return json({ error: "server-error" }, 500);
  }
}
