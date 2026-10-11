"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const LANGS = ["de", "en", "ja"] as const;
export type Lang = (typeof LANGS)[number];
export type Tri = Record<Lang, string>;

export const LANG_LABEL: Record<Lang, string> = { de: "DE", en: "EN", ja: "日本語" };

const dict = {
  appName: { de: "TPWE", en: "TPWE", ja: "TPWE" },
  appLong: {
    de: "Technik · Physik · Wissenschaft · Erfindungen",
    en: "Technology · Physics · Science · Inventions",
    ja: "テクノロジー・物理・科学・発明",
  },
  welcome: {
    de: "Willkommen in Noahs Erfinder-Welt!",
    en: "Welcome to Noah's world of inventions!",
    ja: "ノアの発明ワールドへようこそ！",
  },
  welcomeSub: {
    de: "Was möchtest du heute machen?",
    en: "What would you like to do today?",
    ja: "きょうはなにをする？",
  },
  navHome: { de: "Start", en: "Home", ja: "ホーム" },
  navPlay: { de: "Spielen", en: "Play", ja: "あそぶ" },
  navShop: { de: "Shop", en: "Shop", ja: "ショップ" },
  navVideos: { de: "Videos", en: "Videos", ja: "どうが" },
  navAdmin: { de: "Admin", en: "Admin", ja: "かんり" },
  tilePlay: { de: "Spiele, Quiz & Simulationen", en: "Games, quiz & simulations", ja: "ゲーム・クイズ・シミュレーション" },
  tileShop: { de: "Erfindungen ansehen & bestellen", en: "See & order inventions", ja: "発明を見る・注文する" },
  tileVideos: { de: "Videos zu spannenden Themen", en: "Videos about cool topics", ja: "おもしろいテーマの動画" },
  tileQuiz: { de: "Quiz", en: "Quiz", ja: "クイズ" },
  tileQuizSub: { de: "Teste dein Wissen", en: "Test your knowledge", ja: "ちしきをためそう" },
  tileRiddles: { de: "Rätsel", en: "Riddles", ja: "なぞなぞ" },
  tileRiddlesSub: { de: "Knack die Nuss", en: "Crack the riddle", ja: "といてみよう" },
  themeLight: { de: "Hell", en: "Light", ja: "ライト" },
  themeDark: { de: "Dunkel", en: "Dark", ja: "ダーク" },
  back: { de: "Zurück", en: "Back", ja: "もどる" },
  loading: { de: "Lädt …", en: "Loading …", ja: "よみこみ中…" },
  errorGeneric: { de: "Ups, da ging etwas schief.", en: "Oops, something went wrong.", ja: "あれ、うまくいきませんでした。" },

  // Spielen
  playTitle: { de: "Spielen", en: "Play", ja: "あそぶ" },
  playIntro: {
    de: "Probiere Experimente aus, löse Rätsel und werde zum Profi-Erfinder!",
    en: "Try experiments, solve riddles and become a pro inventor!",
    ja: "じっけんをして、なぞをといて、発明のプロになろう！",
  },
  simSection: { de: "Mini-Simulationen", en: "Mini simulations", ja: "ミニシミュレーション" },
  brainSection: { de: "Quiz & Rätsel", en: "Quiz & riddles", ja: "クイズ＆なぞなぞ" },
  simGravity: { de: "Planeten-Sprung", en: "Planet jump", ja: "わくせいジャンプ" },
  simGravitySub: { de: "Wie hoch springst du auf dem Mond?", en: "How high can you jump on the Moon?", ja: "月ではどれくらい高くとべる？" },
  simLever: { de: "Wippe", en: "Seesaw", ja: "シーソー" },
  simLeverSub: { de: "Bring die Wippe ins Gleichgewicht", en: "Balance the seesaw", ja: "シーソーをつりあわせよう" },
  simCircuit: { de: "Stromkreis", en: "Circuit", ja: "電気回路" },
  simCircuitSub: { de: "Was leitet Strom?", en: "What conducts electricity?", ja: "電気を通すのはどれ？" },
  simRocket: { de: "Raketen-Start", en: "Rocket launch", ja: "ロケット発射" },
  simRocketSub: { de: "Lande auf der Mond-Basis!", en: "Land on the Moon base!", ja: "月の基地に着陸しよう！" },
  rocketHelp: {
    de: "Stell Treibstoff und Winkel ein und drück auf START. Triff die Landeplattform!",
    en: "Set fuel and angle, then press START. Hit the landing pad!",
    ja: "燃料と角度を決めて、スタートをおそう。着陸台にとどけ！",
  },
  rocketFuel: { de: "Treibstoff", en: "Fuel", ja: "燃料" },
  rocketAngle: { de: "Winkel", en: "Angle", ja: "角度" },
  rocketStart: { de: "START", en: "LAUNCH", ja: "スタート" },
  rocketNewTarget: { de: "Neues Ziel", en: "New target", ja: "新しい目標" },
  rocketPerfect: { de: "Perfekte Landung! 🎉", en: "Perfect landing! 🎉", ja: "かんぺきな着陸！🎉" },
  rocketGood: { de: "Gelandet! Gut gemacht!", en: "Landed! Well done!", ja: "着陸成功！よくできました！" },
  rocketClose: { de: "Knapp daneben!", en: "So close!", ja: "おしい！" },
  rocketMiss: { de: "Daneben – versuch's nochmal!", en: "Missed – try again!", ja: "はずれ！もういちど！" },
  rocketTooShort: { de: "Zu kurz – mehr Treibstoff?", en: "Too short – more fuel?", ja: "足りない！燃料をふやす？" },
  rocketTooFar: { de: "Zu weit – weniger Treibstoff?", en: "Too far – less fuel?", ja: "とびすぎ！燃料をへらす？" },
  rocketStars: { de: "Sterne gesammelt", en: "Stars collected", ja: "あつめた星" },
  rocketExplain: {
    de: "Mehr Treibstoff = mehr Schub. Die Schwerkraft zieht die Rakete in einem Bogen zurück. Bei 45° fliegt sie am weitesten!",
    en: "More fuel = more thrust. Gravity pulls the rocket back down in a curve. At 45° it flies the farthest!",
    ja: "燃料が多いほど力が強くなる。重力でロケットはカーブをえがいて落ちてくるよ。45°がいちばん遠くまでとぶ！",
  },
  soundOn: { de: "Ton an", en: "Sound on", ja: "音オン" },
  soundOff: { de: "Ton aus", en: "Sound off", ja: "音オフ" },

  // Quiz
  quizQuestion: { de: "Frage", en: "Question", ja: "もんだい" },
  quizOf: { de: "von", en: "of", ja: "/" },
  quizRight: { de: "Richtig! 🎉", en: "Correct! 🎉", ja: "せいかい！🎉" },
  quizWrong: { de: "Leider falsch.", en: "Not quite.", ja: "ざんねん！" },
  quizNext: { de: "Weiter", en: "Next", ja: "つぎへ" },
  quizDone: { de: "Geschafft!", en: "Done!", ja: "おわり！" },
  quizScore: { de: "Punkte", en: "points", ja: "てん" },
  quizAgain: { de: "Nochmal spielen", en: "Play again", ja: "もういちど" },
  didYouKnow: { de: "Wusstest du?", en: "Did you know?", ja: "知ってた？" },

  // Rätsel
  riddleShow: { de: "Lösung zeigen", en: "Show answer", ja: "こたえを見る" },
  riddleHide: { de: "Lösung verstecken", en: "Hide answer", ja: "こたえをかくす" },

  // Simulationen
  gravityPick: { de: "Wähle einen Ort:", en: "Pick a place:", ja: "ばしょをえらんでね：" },
  gravityJump: { de: "Springen!", en: "Jump!", ja: "ジャンプ！" },
  gravityHeight: { de: "Sprunghöhe", en: "Jump height", ja: "ジャンプの高さ" },
  gravityPull: { de: "Anziehungskraft", en: "Gravity", ja: "重力" },
  gravityExplain: {
    de: "Je schwächer die Schwerkraft, desto höher springst du. Auf dem Mond ist sie 6-mal schwächer als auf der Erde!",
    en: "The weaker the gravity, the higher you jump. On the Moon it is 6 times weaker than on Earth!",
    ja: "重力が弱いほど、高くとべるよ。月の重力は地球の6分の1！",
  },
  earth: { de: "Erde", en: "Earth", ja: "地球" },
  moon: { de: "Mond", en: "Moon", ja: "月" },
  mars: { de: "Mars", en: "Mars", ja: "火星" },
  jupiter: { de: "Jupiter", en: "Jupiter", ja: "木星" },
  leverHelp: {
    de: "Tippe auf die Wippe, um ein Gewicht abzulegen. Weiter außen drückt ein Gewicht stärker!",
    en: "Tap the seesaw to place a weight. Weights further out push harder!",
    ja: "シーソーをタップしておもりをのせよう。はしにあるほど強くおすよ！",
  },
  leverBalanced: { de: "Gleichgewicht! ⚖️", en: "Balanced! ⚖️", ja: "つりあった！⚖️" },
  leverLeft: { de: "Links ist schwerer", en: "Left side is heavier", ja: "左がおもい" },
  leverRight: { de: "Rechts ist schwerer", en: "Right side is heavier", ja: "右がおもい" },
  leverClear: { de: "Alles runter", en: "Clear", ja: "ぜんぶおろす" },
  leverWeight: { de: "Gewicht", en: "Weight", ja: "おもり" },
  circuitHelp: {
    de: "Lege einen Gegenstand in die Lücke und schalte ein. Leuchtet die Lampe?",
    en: "Put an object into the gap and switch on. Does the lamp light up?",
    ja: "すきまにものを入れてスイッチをオン。電球はつくかな？",
  },
  circuitSwitch: { de: "Schalter", en: "Switch", ja: "スイッチ" },
  circuitOn: { de: "AN", en: "ON", ja: "オン" },
  circuitOff: { de: "AUS", en: "OFF", ja: "オフ" },
  circuitConducts: { de: "leitet Strom ⚡", en: "conducts electricity ⚡", ja: "電気を通す⚡" },
  circuitInsulates: { de: "leitet keinen Strom", en: "does not conduct", ja: "電気を通さない" },
  circuitNothing: { de: "Lücke ist leer", en: "Gap is empty", ja: "すきまはからっぽ" },

  // Shop
  shopTitle: { de: "Noahs Erfindungen", en: "Noah's inventions", ja: "ノアの発明品" },
  shopIntro: {
    de: "Hier findest du alle Erfindungen von TPWE. Bestelle und bewerte sie!",
    en: "Here are all TPWE inventions. Order and rate them!",
    ja: "TPWEの発明品がぜんぶあるよ。注文して、ひょうかしてね！",
  },
  shopEmpty: {
    de: "Noch keine Erfindungen – Noah tüftelt gerade! 🔧",
    en: "No inventions yet – Noah is tinkering! 🔧",
    ja: "まだ発明品はないよ。ノアがいま作っているところ！🔧",
  },
  details: { de: "Ansehen", en: "View", ja: "見る" },
  ratings: { de: "Bewertungen", en: "ratings", ja: "件" },
  noRatings: { de: "Noch nicht bewertet", en: "Not rated yet", ja: "まだひょうかなし" },
  rateIt: { de: "Wie findest du diese Erfindung?", en: "How do you like this invention?", ja: "この発明はどう？" },
  rateThanks: { de: "Danke für deine Bewertung! ⭐", en: "Thanks for your rating! ⭐", ja: "ひょうかありがとう！⭐" },
  orderTitle: { de: "Bestellen", en: "Order", ja: "注文する" },
  orderQty: { de: "Anzahl", en: "Quantity", ja: "こすう" },
  orderName: { de: "Dein Name", en: "Your name", ja: "なまえ" },
  orderContact: {
    de: "Wie erreicht Noah dich? (z. B. Telefon der Eltern)",
    en: "How can Noah reach you? (e.g. parent's phone)",
    ja: "れんらくさき（おうちの人の電話など）",
  },
  orderMsg: { de: "Nachricht (freiwillig)", en: "Message (optional)", ja: "メッセージ（なくてもOK）" },
  orderSend: { de: "Bestellung abschicken", en: "Send order", ja: "注文を送る" },
  orderThanks: {
    de: "Danke! Deine Bestellung ist bei Noah angekommen. 📦",
    en: "Thank you! Your order has reached Noah. 📦",
    ja: "ありがとう！注文がノアにとどいたよ。📦",
  },
  orderNote: {
    de: "Bezahlt wird nicht hier in der App – Noah meldet sich bei dir.",
    en: "No payment in the app – Noah will get in touch.",
    ja: "アプリでのしはらいはないよ。ノアから連絡するね。",
  },
  notFound: { de: "Nicht gefunden.", en: "Not found.", ja: "見つかりません。" },

  // Kommentare
  comments: { de: "Kommentare", en: "Comments", ja: "コメント" },
  noComments: { de: "Noch keine Kommentare.", en: "No comments yet.", ja: "まだコメントはないよ。" },
  commentName: { de: "Name", en: "Name", ja: "なまえ" },
  commentText: { de: "Dein Kommentar", en: "Your comment", ja: "コメント" },
  commentSend: { de: "Kommentar senden", en: "Send comment", ja: "コメントを送る" },
  commentThanks: {
    de: "Danke! Dein Kommentar erscheint, sobald Noah ihn freigegeben hat.",
    en: "Thanks! Your comment will appear once Noah approves it.",
    ja: "ありがとう！ノアがOKしたら表示されるよ。",
  },

  // Videos
  videosTitle: { de: "Videos", en: "Videos", ja: "どうが" },
  videosIntro: {
    de: "Noah erklärt Technik, Physik, Wissenschaft und Erfindungen.",
    en: "Noah explains technology, physics, science and inventions.",
    ja: "ノアがテクノロジー・物理・科学・発明をせつめいするよ。",
  },
  videosEmpty: { de: "Noch keine Videos – bald geht's los! 🎬", en: "No videos yet – coming soon! 🎬", ja: "まだ動画はないよ。もうすぐ！🎬" },
  allTopics: { de: "Alle Themen", en: "All topics", ja: "すべて" },

  // Admin
  adminTitle: { de: "Noahs Admin-Zentrale", en: "Noah's admin centre", ja: "ノアのかんりセンター" },
  adminLogin: { de: "Anmelden", en: "Log in", ja: "ログイン" },
  adminLogout: { de: "Abmelden", en: "Log out", ja: "ログアウト" },
  adminEmail: { de: "E-Mail", en: "Email", ja: "メール" },
  adminPassword: { de: "Passwort", en: "Password", ja: "パスワード" },
  adminWrong: { de: "Das hat nicht geklappt. Passwort richtig?", en: "That didn't work. Correct password?", ja: "ログインできません。パスワードは正しい？" },
  adminDemoHint: {
    de: "Demo-Modus: Daten bleiben nur in diesem Browser.",
    en: "Demo mode: data stays in this browser only.",
    ja: "デモモード：データはこのブラウザだけ。",
  },
  adminSecure: {
    de: "🔒 Geschützter Bereich – nur für Noah.",
    en: "🔒 Protected area – Noah only.",
    ja: "🔒 ノア専用のエリアです。",
  },
  adminTooMany: {
    de: "Zu viele Versuche. Bitte warte eine Minute.",
    en: "Too many attempts. Please wait a minute.",
    ja: "しっぱいが多すぎます。1分まってね。",
  },
  adminAutoLogout: {
    de: "Du wurdest nach 30 Minuten ohne Aktivität automatisch abgemeldet.",
    en: "You were logged out automatically after 30 minutes of inactivity.",
    ja: "30分つかわなかったので、自動でログアウトしました。",
  },
  tabProducts: { de: "Erfindungen", en: "Inventions", ja: "発明品" },
  tabVideos: { de: "Videos", en: "Videos", ja: "どうが" },
  tabOrders: { de: "Bestellungen", en: "Orders", ja: "注文" },
  tabComments: { de: "Kommentare", en: "Comments", ja: "コメント" },
  newProduct: { de: "Neue Erfindung", en: "New invention", ja: "新しい発明" },
  newVideo: { de: "Neues Video", en: "New video", ja: "新しい動画" },
  edit: { de: "Bearbeiten", en: "Edit", ja: "へんしゅう" },
  del: { de: "Löschen", en: "Delete", ja: "けす" },
  confirmDelete: { de: "Wirklich löschen?", en: "Really delete?", ja: "ほんとうにけす？" },
  save: { de: "Speichern", en: "Save", ja: "ほぞん" },
  cancel: { de: "Abbrechen", en: "Cancel", ja: "やめる" },
  saved: { de: "Gespeichert! ✅", en: "Saved! ✅", ja: "ほぞんしたよ！✅" },
  fName: { de: "Name der Erfindung", en: "Invention name", ja: "発明の名前" },
  fDesc: { de: "Beschreibung", en: "Description", ja: "せつめい" },
  fPrice: { de: "Preis (€)", en: "Price (€)", ja: "ねだん（€）" },
  fEmoji: { de: "Emoji (wenn kein Bild)", en: "Emoji (if no picture)", ja: "絵文字（画像がないとき）" },
  fImage: { de: "Bild", en: "Picture", ja: "画像" },
  fPublished: { de: "Für alle sichtbar", en: "Visible to everyone", ja: "みんなに見せる" },
  fTranslations: { de: "Übersetzungen (freiwillig)", en: "Translations (optional)", ja: "ほんやく（なくてもOK）" },
  fTitle: { de: "Titel", en: "Title", ja: "タイトル" },
  fTopic: { de: "Thema (z. B. Physik)", en: "Topic (e.g. physics)", ja: "テーマ（れい：物理）" },
  fVideoFile: { de: "Videodatei hochladen", en: "Upload video file", ja: "動画ファイルをアップロード" },
  fYoutube: { de: "… oder YouTube-Link", en: "… or YouTube link", ja: "…またはYouTubeリンク" },
  uploading: { de: "Lädt hoch …", en: "Uploading …", ja: "アップロード中…" },
  demoVideo: {
    de: "Videos hochladen geht erst im Online-Modus. Nutze solange einen YouTube-Link.",
    en: "Video upload needs online mode. Use a YouTube link for now.",
    ja: "動画のアップロードはオンラインモードだけ。いまはYouTubeリンクを使ってね。",
  },
  demoImageSize: {
    de: "Im Demo-Modus darf ein Bild höchstens 1 MB groß sein.",
    en: "In demo mode a picture can be at most 1 MB.",
    ja: "デモモードでは画像は1MBまで。",
  },
  hidden: { de: "versteckt", en: "hidden", ja: "ひこうかい" },
  noOrders: { de: "Noch keine Bestellungen.", en: "No orders yet.", ja: "まだ注文はないよ。" },
  statusNeu: { de: "Neu", en: "New", ja: "新しい" },
  statusInArbeit: { de: "In Arbeit", en: "In progress", ja: "作業中" },
  statusErledigt: { de: "Erledigt", en: "Done", ja: "かんりょう" },
  approve: { de: "Freigeben", en: "Approve", ja: "OKにする" },
  unapprove: { de: "Verstecken", en: "Hide", ja: "かくす" },
  waiting: { de: "wartet auf Freigabe", en: "awaiting approval", ja: "しょうにんまち" },
  noCommentsAdmin: { de: "Keine Kommentare.", en: "No comments.", ja: "コメントはないよ。" },
  modeDemo: { de: "Demo-Modus", en: "Demo mode", ja: "デモモード" },
  modeOnline: { de: "Online", en: "Online", ja: "オンライン" },
} satisfies Record<string, Tri>;

export type DictKey = keyof typeof dict;

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
  /** Wählt das passende Sprachfeld (name / name_en / name_ja), fällt auf Deutsch zurück. */
  pick: <T extends object>(obj: T, field: string) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("de");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tpwe-lang") as Lang | null;
      if (saved && LANGS.includes(saved)) setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("tpwe-lang", l);
    } catch {}
  };

  const t = (key: DictKey) => dict[key][lang];

  const pick = <T extends object>(obj: T, field: string) => {
    const rec = obj as Record<string, unknown>;
    const localized = lang === "de" ? null : rec[`${field}_${lang}`];
    return String((localized as string) || rec[field] || "");
  };

  return <I18nContext.Provider value={{ lang, setLang, t, pick }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n outside I18nProvider");
  return ctx;
}

export const tri = (v: Tri, lang: Lang) => v[lang];
