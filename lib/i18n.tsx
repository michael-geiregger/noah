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

  // Konto & Erfinder-Ausweis
  navAccount: { de: "Mein Ausweis", en: "My card", ja: "マイカード" },
  navDeluxe: { de: "DELUXE", en: "DELUXE", ja: "デラックス" },
  accTitle: { de: "Erfinder-Ausweis", en: "Inventor ID card", ja: "発明家カード" },
  accLoginTab: { de: "Anmelden", en: "Log in", ja: "ログイン" },
  accRegisterTab: { de: "Neues Konto", en: "New account", ja: "新しく作る" },
  accIntro: {
    de: "Mit einem Konto werden deine Sterne gespeichert, und du bekommst deinen eigenen Erfinder-Ausweis!",
    en: "With an account your stars are saved and you get your own inventor ID card!",
    ja: "アカウントを作ると星がほぞんされて、自分だけの発明家カードがもらえるよ！",
  },
  accName: { de: "Erfinder-Name", en: "Inventor name", ja: "発明家ネーム" },
  accPasswordHint: { de: "mindestens 8 Zeichen", en: "at least 8 characters", ja: "8文字以上" },
  accParents: {
    de: "Meine Eltern wissen Bescheid und sind einverstanden.",
    en: "My parents know and agree.",
    ja: "おうちの人に話して、OKをもらいました。",
  },
  accCreate: { de: "Konto erstellen", en: "Create account", ja: "アカウントを作る" },
  accConfirmEmail: {
    de: "Fast geschafft! Bestätige deine E-Mail-Adresse über den Link, den wir dir geschickt haben.",
    en: "Almost done! Confirm your email address using the link we sent you.",
    ja: "あと少し！メールのリンクをおして、アドレスをかくにんしてね。",
  },
  accAlready: { de: "Diese E-Mail hat schon ein Konto. Melde dich an!", en: "This email already has an account. Log in!", ja: "このメールはもう登録されています。ログインしてね！" },
  accWrong: { de: "E-Mail oder Passwort stimmt nicht.", en: "Email or password is wrong.", ja: "メールかパスワードがちがいます。" },
  accNetwork: {
    de: "Die Verbindung ist unterwegs abgebrochen. Bitte prüfe das Internet und versuche es gleich nochmal.",
    en: "The connection dropped. Please check your internet and try again.",
    ja: "通信がとちゅうで切れました。インターネットをかくにんして、もう一度ためしてね。",
  },
  accServerDown: {
    de: "Der Server ist gerade nicht erreichbar. Bitte später nochmal versuchen. (Für Eltern: In Supabase prüfen, ob das Projekt pausiert ist.)",
    en: "The server can't be reached right now. Please try again later. (For parents: check in Supabase whether the project is paused.)",
    ja: "いまサーバーにつながりません。あとでもう一度ためしてね。（おうちの人へ：Supabaseでプロジェクトが一時停止していないか確認してください）",
  },
  accNotConfirmed: {
    de: "Bitte bestätige zuerst deine E-Mail-Adresse über den Link in der Mail.",
    en: "Please confirm your email address first using the link in the email.",
    ja: "まずメールのリンクをおして、アドレスをかくにんしてね。",
  },
  accLogout: { de: "Abmelden", en: "Log out", ja: "ログアウト" },
  accRank: { de: "Rang", en: "Rank", ja: "ランク" },
  accStars: { de: "Raketen-Sterne", en: "Rocket stars", ja: "ロケットの星" },
  accQuizBest: { de: "Bestes Quiz", en: "Best quiz", ja: "クイズ最高" },
  accBadges: { de: "Abzeichen", en: "Badges", ja: "バッジ" },
  accNoBadges: { de: "Noch keine – spiel los und sammle welche!", en: "None yet – go play and collect some!", ja: "まだないよ。あそんで集めよう！" },
  accChooseAvatar: { de: "Wähle dein Bild", en: "Choose your picture", ja: "アイコンをえらぼう" },
  accMemberSince: { de: "Mitglied seit", en: "Member since", ja: "登録日" },
  accBlocked: { de: "Dieses Konto ist gesperrt.", en: "This account is blocked.", ja: "このアカウントは止められています。" },
  accLoginToSave: { de: "Melde dich an, damit deine Sterne gespeichert werden!", en: "Log in so your stars are saved!", ja: "ログインすると星がほぞんされるよ！" },
  rank0: { de: "Erfinder-Lehrling", en: "Apprentice inventor", ja: "見習い発明家" },
  rank1: { de: "Tüftler", en: "Tinkerer", ja: "くふう名人" },
  rank2: { de: "Erfinder", en: "Inventor", ja: "発明家" },
  rank3: { de: "Meister-Erfinder", en: "Master inventor", ja: "マスター発明家" },
  rank4: { de: "Erfinder-Genie", en: "Inventor genius", ja: "天才発明家" },
  badgeFirstFlight: { de: "Erster Flug", en: "First flight", ja: "はじめての飛行" },
  badgeMoonPilot: { de: "Mond-Pilot", en: "Moon pilot", ja: "月のパイロット" },
  badgeStarCollector: { de: "Sternensammler", en: "Star collector", ja: "星コレクター" },
  badgeQuizPro: { de: "Quiz-Profi", en: "Quiz pro", ja: "クイズのプロ" },
  badgeDeluxe: { de: "DELUXE-Mitglied", en: "DELUXE member", ja: "デラックス会員" },

  // DELUXE
  dlxTitle: { de: "TPWE DELUXE", en: "TPWE DELUXE", ja: "TPWE デラックス" },
  dlxIntro: {
    de: "Werde DELUXE-Mitglied und sei ganz nah dran an Noahs Erfinder-Firma!",
    en: "Become a DELUXE member and get really close to Noah's invention company!",
    ja: "デラックス会員になって、ノアの発明会社をもっと近くで楽しもう！",
  },
  dlxPerkRadio: { de: "TPWE-Funkraum", en: "TPWE radio room", ja: "TPWE無線ルーム" },
  dlxPerkRadioSub: { de: "Video-Treffen zu festen Zeiten", en: "Video meetings at set times", ja: "決まった時間のビデオ会議" },
  dlxPerkPrivate: { de: "Privat-Gespräch mit Noah", en: "Private chat with Noah", ja: "ノアと1対1で話す" },
  dlxPerkPrivateSub: { de: "Ein Video-Call nur mit Noah", en: "A video call just with Noah", ja: "ノアだけとビデオ通話" },
  dlxPerkBadge: { de: "DELUXE-Abzeichen", en: "DELUXE badge", ja: "デラックスバッジ" },
  dlxPerkBadgeSub: { de: "Glänzt auf deinem Erfinder-Ausweis", en: "Shines on your inventor card", ja: "発明家カードでかがやく" },
  dlxPerkMore: { de: "Und noch mehr", en: "And more", ja: "まだまだあるよ" },
  dlxPerkMoreSub: { de: "Neue DELUXE-Extras kommen dazu", en: "New DELUXE extras are coming", ja: "新しい特典がふえていくよ" },
  dlxSoon: { de: "kommt bald", en: "coming soon", ja: "もうすぐ" },
  dlxOnce: { de: "einmalig – kein Abo", en: "one-time – no subscription", ja: "1回だけ・定期購入なし" },
  dlxLoginFirst: { de: "Erst anmelden", en: "Log in first", ja: "まずログイン" },
  dlxBuy: { de: "Jetzt DELUXE holen", en: "Get DELUXE now", ja: "デラックスを手に入れる" },
  dlxConsentStart: {
    de: "Ich möchte, dass DELUXE sofort startet. Mir ist klar, dass ich dadurch mein Widerrufsrecht verliere.",
    en: "I want DELUXE to start right away. I understand that I lose my right of withdrawal by doing so.",
    ja: "すぐにデラックスを始めたいです。そのため、取り消しの権利がなくなることを理解しています。",
  },
  dlxConsentAdult: {
    de: "Ein Erwachsener bezahlt bzw. ist mit dem Kauf einverstanden.",
    en: "An adult is paying or agrees to the purchase.",
    ja: "大人がしはらう、または買うことにOKしています。",
  },
  dlxTerms: { de: "AGB, Widerruf & Datenschutz", en: "Terms, withdrawal & privacy", ja: "規約・取り消し・個人情報" },
  dlxRedirecting: { de: "Weiter zur sicheren Bezahlseite …", en: "Going to the secure payment page …", ja: "安全なしはらいページへ…" },
  dlxChecking: { de: "Zahlung wird geprüft …", en: "Checking payment …", ja: "しはらいをかくにん中…" },
  dlxWelcome: { de: "Willkommen bei DELUXE! 💎", en: "Welcome to DELUXE! 💎", ja: "デラックスへようこそ！💎" },
  dlxIsMember: { de: "Du bist DELUXE-Mitglied", en: "You are a DELUXE member", ja: "あなたはデラックス会員です" },
  dlxSince: { de: "seit", en: "since", ja: "から" },
  dlxCancelled: { de: "Bezahlung abgebrochen – nichts wurde abgebucht.", en: "Payment cancelled – nothing was charged.", ja: "しはらいはキャンセルされました。お金はかかっていません。" },
  dlxNotPaid: {
    de: "Die Zahlung ist noch nicht bestätigt. Lade die Seite in einer Minute neu.",
    en: "The payment is not confirmed yet. Reload the page in a minute.",
    ja: "しはらいはまだかくにんされていません。1分後にもう一度読みこんでね。",
  },
  dlxNotConfigured: {
    de: "Die Bezahlung ist noch nicht eingerichtet. Bitte später noch einmal versuchen.",
    en: "Payment is not set up yet. Please try again later.",
    ja: "しはらいはまだ準備中です。あとでもう一度ためしてね。",
  },
  dlxDemo: { de: "Demo-Modus: Die Zahlung wird nur simuliert.", en: "Demo mode: payment is only simulated.", ja: "デモモード：しはらいはまねだけです。" },

  // Admin: Mitglieder
  tabMembers: { de: "Mitglieder", en: "Members", ja: "メンバー" },
  memTotal: { de: "Konten", en: "Accounts", ja: "アカウント" },
  memDeluxe: { de: "DELUXE", en: "DELUXE", ja: "デラックス" },
  memRevenue: { de: "Einnahmen", en: "Revenue", ja: "売上" },
  memNone: { de: "Noch keine Mitglieder.", en: "No members yet.", ja: "まだメンバーはいないよ。" },
  memPaidStripe: { de: "bezahlt mit Karte", en: "paid by card", ja: "カードでしはらい" },
  memPaidAdmin: { de: "von Noah freigeschaltet", en: "unlocked by Noah", ja: "ノアがOKした" },
  memGrant: { de: "DELUXE freischalten", en: "Unlock DELUXE", ja: "デラックスにする" },
  memRevoke: { de: "DELUXE entfernen", en: "Remove DELUXE", ja: "デラックスをはずす" },
  memBlock: { de: "Sperren", en: "Block", ja: "止める" },
  memUnblock: { de: "Entsperren", en: "Unblock", ja: "止めるのをやめる" },
  memBlocked: { de: "gesperrt", en: "blocked", ja: "停止中" },

  // DELUXE-Extras (allgemein)
  dlxOnlyMembers: { de: "Nur für DELUXE-Mitglieder", en: "DELUXE members only", ja: "デラックス会員だけ" },
  dlxOnlyMembersSub: {
    de: "Hol dir DELUXE, um diesen Bereich zu öffnen.",
    en: "Get DELUXE to unlock this area.",
    ja: "デラックスになると、ここがひらくよ。",
  },
  dlxHub: { de: "Deine DELUXE-Welt", en: "Your DELUXE world", ja: "きみのデラックスワールド" },
  dlxPerkBoard: { de: "Bestenliste & Challenge", en: "Leaderboard & challenge", ja: "ランキング＆チャレンジ" },
  dlxPerkBoardSub: { de: "Wer sammelt die meisten Sterne?", en: "Who collects the most stars?", ja: "いちばん星を集めるのはだれ？" },
  dlxPerkProf: { de: "Professor Zahnrad", en: "Professor Gear", ja: "ハグルマ博士" },
  dlxPerkProfSub: { de: "Dein KI-Erfinder-Lehrer beantwortet Fragen", en: "Your AI inventor teacher answers questions", ja: "AI発明の先生が質問にこたえるよ" },
  dlxPerkTaler: { de: "TPWE-Taler", en: "TPWE coins", ja: "TPWEコイン" },
  dlxPerkTalerSub: { de: "Sammeln und gegen Belohnungen tauschen", en: "Collect and swap for rewards", ja: "集めてごほうびとこうかん" },
  dlxPerkPinboard: { de: "Erfinder-Pinnwand", en: "Inventor pinboard", ja: "発明けいじばん" },
  dlxPerkPinboardSub: { de: "Teile deine Ideen mit anderen Erfindern", en: "Share your ideas with other inventors", ja: "アイデアをみんなとシェア" },
  open: { de: "Öffnen", en: "Open", ja: "ひらく" },

  // Bestenliste
  lbTitle: { de: "Bestenliste", en: "Leaderboard", ja: "ランキング" },
  lbAllTime: { de: "Aller Zeiten", en: "All time", ja: "ぜんぶ" },
  lbThisWeek: { de: "Diese Woche", en: "This week", ja: "今週" },
  lbEmpty: { de: "Noch niemand hier – sei der Erste!", en: "Nobody here yet – be the first!", ja: "まだだれもいないよ。一番になろう！" },
  lbYou: { de: "du", en: "you", ja: "きみ" },
  lbPoints: { de: "Punkte", en: "points", ja: "ポイント" },
  chTitle: { de: "Aktuelle Challenge", en: "Current challenge", ja: "いまのチャレンジ" },
  chNone: { de: "Gerade läuft keine Challenge. Noah denkt sich bald eine aus!", en: "No challenge right now. Noah will think of one soon!", ja: "いまはチャレンジがないよ。ノアがもうすぐ考えるね！" },
  chEnds: { de: "endet am", en: "ends on", ja: "おわり" },
  chPrize: { de: "Preis", en: "Prize", ja: "ごほうび" },
  chPlay: { de: "Jetzt mitspielen", en: "Play now", ja: "さんかする" },
  gameRocket: { de: "Raketen-Start", en: "Rocket launch", ja: "ロケット発射" },
  gameQuiz: { de: "Quiz", en: "Quiz", ja: "クイズ" },

  // Professor Zahnrad
  profIntro: {
    de: "Hallo, ich bin Professor Zahnrad! ⚙️ Frag mich alles über Technik, Physik, Wissenschaft und Erfindungen.",
    en: "Hello, I'm Professor Gear! ⚙️ Ask me anything about technology, physics, science and inventions.",
    ja: "こんにちは、ハグルマ博士だよ！⚙️ テクノロジー・物理・科学・発明のことを何でもきいてね。",
  },
  profPlaceholder: { de: "Warum ist der Himmel blau?", en: "Why is the sky blue?", ja: "空はどうして青いの？" },
  profAsk: { de: "Fragen", en: "Ask", ja: "きく" },
  profThinking: { de: "Professor Zahnrad denkt nach …", en: "Professor Gear is thinking …", ja: "ハグルマ博士が考えているよ…" },
  profRemaining: { de: "Fragen heute noch übrig", en: "questions left today", ja: "きょうのこりの質問" },
  profLimit: { de: "Für heute sind alle Fragen aufgebraucht. Morgen geht's weiter! 🌙", en: "You've used all questions for today. See you tomorrow! 🌙", ja: "きょうの質問はおしまい。またあした！🌙" },
  profBusy: { de: "Der Professor ist gerade sehr beschäftigt. Versuch es gleich nochmal!", en: "The professor is very busy. Try again in a moment!", ja: "博士はいまいそがしいよ。すこししてからもう一度！" },
  profNotConfigured: { de: "Professor Zahnrad ist noch nicht eingerichtet.", en: "Professor Gear is not set up yet.", ja: "ハグルマ博士はまだ準備中です。" },
  profNote: {
    de: "Professor Zahnrad ist eine KI und kann sich irren. Noah und Noahs Eltern können die Fragen sehen.",
    en: "Professor Gear is an AI and can make mistakes. Noah and Noah's parents can see the questions.",
    ja: "ハグルマ博士はAIなので、まちがえることもあるよ。ノアとおうちの人は質問を見ることができます。",
  },
  profExamples: { de: "Ideen zum Fragen", en: "Question ideas", ja: "質問のアイデア" },

  // Taler
  talerTitle: { de: "TPWE-Taler", en: "TPWE coins", ja: "TPWEコイン" },
  talerBalance: { de: "Dein Kontostand", en: "Your balance", ja: "きみのコイン" },
  talerHow: {
    de: "Für jeden Raketen-Stern und jeden Quiz-Punkt bekommst du 1 Taler. Tausche sie hier gegen Belohnungen von Noah!",
    en: "You get 1 coin for every rocket star and every quiz point. Swap them here for rewards from Noah!",
    ja: "ロケットの星1つ、クイズ1ポイントごとに1コインもらえるよ。ノアのごほうびとこうかんしよう！",
  },
  talerRedeem: { de: "Einlösen", en: "Redeem", ja: "こうかん" },
  talerNotEnough: { de: "Noch nicht genug Taler", en: "Not enough coins yet", ja: "コインが足りないよ" },
  talerConfirm: { de: "Wirklich einlösen?", en: "Really redeem?", ja: "ほんとうにこうかんする？" },
  talerDone: { de: "Eingelöst! Noah meldet sich bei dir. 🎁", en: "Redeemed! Noah will get in touch. 🎁", ja: "こうかんしたよ！ノアから連絡するね。🎁" },
  talerMine: { de: "Meine Einlösungen", en: "My redemptions", ja: "こうかんしたもの" },
  talerRewards: { de: "Belohnungen", en: "Rewards", ja: "ごほうび" },
  talerNoRewards: { de: "Noch keine Belohnungen.", en: "No rewards yet.", ja: "まだごほうびはないよ。" },
  talerStatusNeu: { de: "wartet", en: "waiting", ja: "まち" },
  talerStatusErledigt: { de: "erledigt", en: "done", ja: "かんりょう" },
  talerStatusAbgelehnt: { de: "abgelehnt (Taler zurück)", en: "declined (coins returned)", ja: "ことわり（コインはもどったよ）" },

  // Pinnwand
  pinTitle: { de: "Erfinder-Pinnwand", en: "Inventor pinboard", ja: "発明けいじばん" },
  pinPlaceholder: { de: "Meine Idee: …", en: "My idea: …", ja: "わたしのアイデア：…" },
  pinPost: { de: "Anpinnen", en: "Pin it", ja: "はる" },
  pinRules: {
    de: "Sei freundlich und verrate keine persönlichen Daten (Adresse, Schule, Telefon). Noah liest jeden Beitrag, bevor ihn andere sehen.",
    en: "Be kind and don't share personal details (address, school, phone). Noah reads every post before others see it.",
    ja: "やさしくね。住所・学校・電話番号は書かないでね。ノアが読んでから、みんなに表示されます。",
  },
  pinWaiting: { de: "wartet auf Noah", en: "waiting for Noah", ja: "ノアのかくにんまち" },
  pinSent: { de: "Angepinnt! Sobald Noah den Beitrag freigibt, sehen ihn alle.", en: "Pinned! Everyone will see it once Noah approves.", ja: "はったよ！ノアがOKしたら、みんなに見えるよ。" },
  pinTooMany: { de: "Puh, viele Beiträge! Mach eine kleine Pause.", en: "Phew, lots of posts! Take a little break.", ja: "たくさん書いたね！すこし休もう。" },
  pinEmpty: { de: "Noch keine Beiträge. Pinne die erste Idee an!", en: "No posts yet. Pin the first idea!", ja: "まだ何もないよ。さいしょのアイデアをはろう！" },

  // Admin: DELUXE
  tabDeluxe: { de: "DELUXE", en: "DELUXE", ja: "デラックス" },
  admChallenges: { de: "Challenges", en: "Challenges", ja: "チャレンジ" },
  admNewChallenge: { de: "Neue Challenge", en: "New challenge", ja: "新しいチャレンジ" },
  admStart: { de: "Start", en: "Start", ja: "はじまり" },
  admEnd: { de: "Ende", en: "End", ja: "おわり" },
  admGame: { de: "Spiel", en: "Game", ja: "ゲーム" },
  admTalerShop: { de: "Taler-Shop", en: "Coin shop", ja: "コインショップ" },
  admNewReward: { de: "Neue Belohnung", en: "New reward", ja: "新しいごほうび" },
  admCost: { de: "Preis in Talern", en: "Price in coins", ja: "コインのねだん" },
  admActive: { de: "aktiv", en: "active", ja: "有効" },
  admRedemptions: { de: "Einlösungen", en: "Redemptions", ja: "こうかん" },
  admNoRedemptions: { de: "Noch keine Einlösungen.", en: "No redemptions yet.", ja: "まだこうかんはないよ。" },
  admBoard: { de: "Pinnwand", en: "Pinboard", ja: "けいじばん" },
  admProfessor: { de: "Professor-Fragen", en: "Professor questions", ja: "博士への質問" },
  admNoQuestions: { de: "Noch keine Fragen.", en: "No questions yet.", ja: "まだ質問はないよ。" },
  admDecline: { de: "Ablehnen", en: "Decline", ja: "ことわる" },
  admDone: { de: "Erledigt", en: "Done", ja: "かんりょう" },

  // DELUXE-Banner auf der Startseite
  dlxBannerSub: {
    de: "Funkraum, Professor Zahnrad, Bestenliste, TPWE-Taler & mehr – einmalig 10,50 €",
    en: "Radio room, Professor Gear, leaderboard, TPWE coins & more – one-time 10.50 €",
    ja: "無線ルーム・ハグルマ博士・ランキング・TPWEコインなど – 1回10.50ユーロ",
  },
  // Funkraum
  frTitle: { de: "TPWE-Funkraum", en: "TPWE radio room", ja: "TPWE無線ルーム" },
  frWhen: { de: "Jeden Samstag 13:00–13:30 Uhr", en: "Every Saturday 1:00–1:30 pm (Vienna time)", ja: "毎週土曜日 13:00〜13:30（ウィーン時間）" },
  frOpenNow: { de: "Jetzt offen! 🟢", en: "Open now! 🟢", ja: "いまオープン！🟢" },
  frNext: { de: "Nächste Runde", en: "Next session", ja: "つぎの回" },
  frIn: { de: "in", en: "in", ja: "あと" },
  frDays: { de: "Tg.", en: "d", ja: "日" },
  frHours: { de: "Std.", en: "h", ja: "時間" },
  frMinutes: { de: "Min.", en: "min", ja: "分" },
  frRulesTitle: { de: "Funkraum-Regeln", en: "Radio room rules", ja: "無線ルームのルール" },
  frRuleKind: { de: "Ich bin freundlich und respektvoll.", en: "I am kind and respectful.", ja: "やさしく、ていねいにします。" },
  frRulePrivate: {
    de: "Ich verrate keine persönlichen Daten (Adresse, Schule, Telefonnummer).",
    en: "I don't share personal details (address, school, phone number).",
    ja: "住所・学校・電話番号は言いません。",
  },
  frRuleAdult: { de: "Ein Erwachsener weiß, dass ich im Funkraum bin.", en: "An adult knows I'm in the radio room.", ja: "おうちの人は、わたしが無線ルームにいることを知っています。" },
  frRuleNoah: {
    de: "Noah leitet den Funkraum und kann jeden stummschalten oder entfernen. Um 13:30 endet die Runde automatisch.",
    en: "Noah runs the radio room and can mute or remove anyone. The session ends automatically at 1:30 pm.",
    ja: "ノアがルームのリーダーで、だれでもミュートや退出させられます。13:30に自動でおわります。",
  },
  frJoin: { de: "Funkraum betreten", en: "Enter radio room", ja: "ルームに入る" },
  frJoining: { de: "Verbinde …", en: "Connecting …", ja: "せつぞく中…" },
  frLeave: { de: "Verlassen", en: "Leave", ja: "出る" },
  frClosed: { de: "Der Funkraum ist gerade geschlossen.", en: "The radio room is closed right now.", ja: "いまはしまっています。" },
  frNotConfigured: { de: "Der Funkraum ist noch nicht eingerichtet.", en: "The radio room is not set up yet.", ja: "無線ルームはまだ準備中です。" },
  frDemo: { de: "Video-Calls gehen erst im Online-Modus.", en: "Video calls only work in online mode.", ja: "ビデオ通話はオンラインモードだけです。" },
  frCamera: { de: "Dein Browser fragt gleich nach Kamera und Mikrofon – bitte erlauben.", en: "Your browser will ask for camera and microphone – please allow.", ja: "カメラとマイクの許可をきかれたら、OKしてね。" },

  // Privat-Gespräch
  pcTitle: { de: "Privat-Gespräch mit Noah", en: "Private chat with Noah", ja: "ノアと1対1で話す" },
  pcIntro: {
    de: "Du möchtest allein mit Noah sprechen? Schick eine Anfrage – Noah bestätigt sie und schlägt dir eine Uhrzeit vor.",
    en: "Want to talk to Noah one-on-one? Send a request – Noah will confirm it and suggest a time.",
    ja: "ノアと1対1で話したい？リクエストを送ってね。ノアが時間をきめて連絡するよ。",
  },
  pcWish: { de: "Wann passt es dir? (z. B. Sonntag Nachmittag)", en: "When suits you? (e.g. Sunday afternoon)", ja: "いつがいい？（れい：日曜の午後）" },
  pcMessage: { de: "Worüber möchtest du sprechen? (freiwillig)", en: "What would you like to talk about? (optional)", ja: "何について話したい？（なくてもOK）" },
  pcAdult: {
    de: "Beim Gespräch ist ein Erwachsener dabei (Pflicht).",
    en: "An adult will be present during the call (required).",
    ja: "通話のとき、大人がいっしょにいます（ひっす）。",
  },
  pcSend: { de: "Anfrage senden", en: "Send request", ja: "リクエストを送る" },
  pcSent: { de: "Anfrage gesendet! Noah meldet sich hier mit einer Uhrzeit.", en: "Request sent! Noah will reply here with a time.", ja: "送ったよ！ノアがここで時間を知らせるね。" },
  pcTooMany: { de: "Du hast schon 2 offene Anfragen. Warte bitte auf Noahs Antwort.", en: "You already have 2 open requests. Please wait for Noah's reply.", ja: "まだ2つのリクエストがまっています。ノアの返事をまってね。" },
  pcMine: { de: "Meine Anfragen", en: "My requests", ja: "わたしのリクエスト" },
  pcStatusNeu: { de: "wartet auf Noah", en: "waiting for Noah", ja: "ノアのへんじまち" },
  pcStatusBestaetigt: { de: "bestätigt", en: "confirmed", ja: "けってい" },
  pcStatusAbgelehnt: { de: "leider nicht möglich", en: "not possible, sorry", ja: "ざんねん、むずかしいです" },
  pcStatusErledigt: { de: "erledigt", en: "done", ja: "おわり" },
  pcAt: { de: "Termin", en: "Appointment", ja: "日時" },
  pcJoin: { de: "Gespräch starten", en: "Start call", ja: "通話をはじめる" },
  pcOpensAt: { de: "Der Raum öffnet 10 Minuten vorher.", en: "The room opens 10 minutes before.", ja: "10分前にひらきます。" },
  pcAdultCheck: { de: "Ein Erwachsener ist jetzt bei mir.", en: "An adult is with me now.", ja: "いま大人がいっしょにいます。" },

  // Admin: Funkraum
  tabFunk: { de: "Funkraum", en: "Radio room", ja: "無線ルーム" },
  admJoinOwner: { de: "Als Noah beitreten (Chef)", en: "Join as Noah (host)", ja: "ノア（リーダー）として入る" },
  admOwnerEarly: { de: "Du kannst 15 Minuten vorher hinein, um alles vorzubereiten.", en: "You can enter 15 minutes early to get ready.", ja: "15分前から入って準備できます。" },
  admRequests: { de: "Anfragen für Privat-Gespräche", en: "Private chat requests", ja: "1対1のリクエスト" },
  admNoRequests: { de: "Keine Anfragen.", en: "No requests.", ja: "リクエストはないよ。" },
  admConfirm: { de: "Bestätigen", en: "Confirm", ja: "けってい" },
  admPickTime: { de: "Uhrzeit festlegen", en: "Set time", ja: "時間をきめる" },
  admWish: { de: "Wunsch", en: "Wish", ja: "きぼう" },

  // Rechtliches
  legalTitle: { de: "Rechtliches", en: "Legal", ja: "法的情報" },
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
