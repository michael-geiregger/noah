// Inhalte für Quiz und Rätsel. Neue Fragen einfach unten anhängen!
import type { Tri } from "./i18n";

export type QuizQuestion = { q: Tri; answers: Tri[]; correct: number; fact: Tri };

export const QUIZ: QuizQuestion[] = [
  {
    q: { de: "Was zieht alle Dinge zur Erde hinunter?", en: "What pulls everything down to the Earth?", ja: "ものを地面に引っぱる力はなに？" },
    answers: [
      { de: "Die Schwerkraft", en: "Gravity", ja: "重力（じゅうりょく）" },
      { de: "Der Wind", en: "The wind", ja: "風" },
      { de: "Das Licht", en: "Light", ja: "光" },
    ],
    correct: 0,
    fact: {
      de: "Isaac Newton soll über die Schwerkraft nachgedacht haben, als ein Apfel vom Baum fiel. 🍎",
      en: "Isaac Newton is said to have thought about gravity when an apple fell from a tree. 🍎",
      ja: "ニュートンはリンゴが木から落ちるのを見て、重力について考えたと言われているよ。🍎",
    },
  },
  {
    q: { de: "Welches Material leitet Strom?", en: "Which material conducts electricity?", ja: "電気を通すのはどれ？" },
    answers: [
      { de: "Holz", en: "Wood", ja: "木" },
      { de: "Kupfer", en: "Copper", ja: "銅（どう）" },
      { de: "Gummi", en: "Rubber", ja: "ゴム" },
    ],
    correct: 1,
    fact: {
      de: "In fast jedem Kabel steckt Kupfer. Außen ist Gummi oder Plastik, damit du keinen Schlag bekommst.",
      en: "Almost every cable has copper inside. The outside is rubber or plastic so you don't get a shock.",
      ja: "ほとんどのコードの中には銅が入っているよ。外がわはゴムやプラスチックで安全なんだ。",
    },
  },
  {
    q: { de: "Was haben die Brüder Wright erfunden?", en: "What did the Wright brothers invent?", ja: "ライト兄弟が発明したのはなに？" },
    answers: [
      { de: "Das Telefon", en: "The telephone", ja: "電話" },
      { de: "Das Auto", en: "The car", ja: "自動車" },
      { de: "Das Motorflugzeug", en: "The powered airplane", ja: "エンジンつき飛行機" },
    ],
    correct: 2,
    fact: {
      de: "Ihr erster Flug im Jahr 1903 dauerte nur 12 Sekunden!",
      en: "Their first flight in 1903 lasted only 12 seconds!",
      ja: "1903年のさいしょの飛行は、たった12びょうだったよ！",
    },
  },
  {
    q: { de: "Woran bleibt ein Magnet kleben?", en: "What does a magnet stick to?", ja: "磁石（じしゃく）がくっつくのはどれ？" },
    answers: [
      { de: "Glas", en: "Glass", ja: "ガラス" },
      { de: "Eisen", en: "Iron", ja: "鉄（てつ）" },
      { de: "Plastik", en: "Plastic", ja: "プラスチック" },
    ],
    correct: 1,
    fact: {
      de: "Die Erde selbst ist ein riesiger Magnet – deshalb zeigt ein Kompass nach Norden. 🧭",
      en: "The Earth itself is a giant magnet – that's why a compass points north. 🧭",
      ja: "地球そのものが大きな磁石なんだ。だから方位じしんは北をさすよ。🧭",
    },
  },
  {
    q: { de: "Welcher ist der größte Planet in unserem Sonnensystem?", en: "Which is the biggest planet in our solar system?", ja: "太陽系でいちばん大きいわくせいは？" },
    answers: [
      { de: "Jupiter", en: "Jupiter", ja: "木星" },
      { de: "Mars", en: "Mars", ja: "火星" },
      { de: "Erde", en: "Earth", ja: "地球" },
    ],
    correct: 0,
    fact: {
      de: "In den Jupiter würde die Erde mehr als 1000-mal hineinpassen! 🪐",
      en: "More than 1000 Earths would fit inside Jupiter! 🪐",
      ja: "木星の中には地球が1000こ以上入るよ！🪐",
    },
  },
  {
    q: { de: "Bei wie viel Grad wird Wasser zu Eis?", en: "At what temperature does water turn to ice?", ja: "水がこおるのは何度？" },
    answers: [
      { de: "100 °C", en: "100 °C", ja: "100℃" },
      { de: "10 °C", en: "10 °C", ja: "10℃" },
      { de: "0 °C", en: "0 °C", ja: "0℃" },
    ],
    correct: 2,
    fact: {
      de: "Bei 100 °C kocht Wasser und wird zu Dampf. ♨️",
      en: "At 100 °C water boils and turns into steam. ♨️",
      ja: "100℃になると水はふっとうして、水じょう気になるよ。♨️",
    },
  },
  {
    q: { de: "Was ist am allerschnellsten?", en: "What is the fastest of all?", ja: "いちばん速いのはどれ？" },
    answers: [
      { de: "Ein Rennauto", en: "A race car", ja: "レーシングカー" },
      { de: "Licht", en: "Light", ja: "光" },
      { de: "Schall", en: "Sound", ja: "音" },
    ],
    correct: 1,
    fact: {
      de: "Licht schafft in einer Sekunde 7,5-mal den Weg um die Erde! ⚡",
      en: "Light can travel around the Earth 7.5 times in one second! ⚡",
      ja: "光は1びょうで地球を7しゅう半もまわれるよ！⚡",
    },
  },
  {
    q: { de: "Wer hat die Glühbirne berühmt gemacht?", en: "Who made the light bulb famous?", ja: "電球（でんきゅう）を広めた発明家はだれ？" },
    answers: [
      { de: "Albert Einstein", en: "Albert Einstein", ja: "アインシュタイン" },
      { de: "Thomas Edison", en: "Thomas Edison", ja: "エジソン" },
      { de: "Isaac Newton", en: "Isaac Newton", ja: "ニュートン" },
    ],
    correct: 1,
    fact: {
      de: "Edison probierte tausende Materialien aus, bis seine Glühbirne lange leuchtete. Dranbleiben lohnt sich! 💡",
      en: "Edison tried thousands of materials until his bulb glowed for a long time. Keep going! 💡",
      ja: "エジソンは何千もの材料をためして、長く光る電球を作ったよ。あきらめないことが大事！💡",
    },
  },
  {
    q: { de: "Was brauchen Pflanzen zum Wachsen?", en: "What do plants need to grow?", ja: "植物が育つのにひつようなのは？" },
    answers: [
      { de: "Licht, Wasser und Luft", en: "Light, water and air", ja: "光と水と空気" },
      { de: "Nur Dunkelheit", en: "Only darkness", ja: "くらやみだけ" },
      { de: "Nur Steine", en: "Only stones", ja: "石だけ" },
    ],
    correct: 0,
    fact: {
      de: "Pflanzen machen aus Sonnenlicht ihr eigenes Essen – und dabei Sauerstoff für uns! 🌱",
      en: "Plants make their own food from sunlight – and oxygen for us! 🌱",
      ja: "植物は太陽の光で自分の食べものを作って、わたしたちのための酸素も出すよ！🌱",
    },
  },
  {
    q: { de: "Was macht ein Hebel leichter?", en: "What does a lever make easier?", ja: "てこを使うと、なにがらくになる？" },
    answers: [
      { de: "Schwere Dinge anheben", en: "Lifting heavy things", ja: "おもいものを持ち上げること" },
      { de: "Schneller rechnen", en: "Doing maths faster", ja: "計算をはやくすること" },
      { de: "Besser sehen", en: "Seeing better", ja: "よく見ること" },
    ],
    correct: 0,
    fact: {
      de: "Archimedes sagte: „Gib mir einen festen Punkt, und ich hebe die Welt aus den Angeln!“",
      en: "Archimedes said: “Give me a place to stand, and I will move the Earth!”",
      ja: "アルキメデスは「立つ場所をくれれば、地球だって動かしてみせる」と言ったよ！",
    },
  },
];

export type Riddle = { q: Tri; a: Tri; icon: string };

export const RIDDLES: Riddle[] = [
  {
    icon: "🪮",
    q: { de: "Ich habe viele Zähne, aber ich beiße nie. Was bin ich?", en: "I have lots of teeth but I never bite. What am I?", ja: "歯がたくさんあるのに、かまないものなーんだ？" },
    a: { de: "Ein Kamm", en: "A comb", ja: "くし" },
  },
  {
    icon: "🕳️",
    q: { de: "Je mehr du wegnimmst, desto größer werde ich. Was bin ich?", en: "The more you take away, the bigger I get. What am I?", ja: "とればとるほど大きくなるものなーんだ？" },
    a: { de: "Ein Loch", en: "A hole", ja: "あな" },
  },
  {
    icon: "🕰️",
    q: { de: "Ich habe ein Gesicht und zwei Zeiger, aber keine Arme und keine Beine. Was bin ich?", en: "I have a face and two hands, but no arms and no legs. What am I?", ja: "はりがあるのに、ぬいものをしない。なーんだ？" },
    a: { de: "Eine Uhr", en: "A clock", ja: "とけい" },
  },
  {
    icon: "🧺",
    q: { de: "Was wird nasser, je mehr es trocknet?", en: "What gets wetter the more it dries?", ja: "ふけばふくほど、ぬれるものなーんだ？" },
    a: { de: "Ein Handtuch", en: "A towel", ja: "タオル" },
  },
  {
    icon: "🌬️",
    q: { de: "Ich bin leichter als eine Feder, aber niemand kann mich lange festhalten. Was bin ich?", en: "I'm lighter than a feather, but nobody can hold me for long. What am I?", ja: "羽よりかるいのに、だれも長くはとめていられないものなーんだ？" },
    a: { de: "Der Atem", en: "Your breath", ja: "いき（息）" },
  },
  {
    icon: "🚆",
    q: { de: "Ein Elektro-Zug fährt nach Norden. In welche Richtung weht sein Rauch?", en: "An electric train goes north. Which way does its smoke blow?", ja: "電車が北へ走っています。けむりはどっちへながれる？" },
    a: { de: "Gar nicht – ein Elektro-Zug macht keinen Rauch!", en: "Nowhere – electric trains make no smoke!", ja: "どっちでもない！電車はけむりを出さないよ。" },
  },
  {
    icon: "🌑",
    q: { de: "Ich folge dir überall hin, aber im Dunkeln verschwinde ich. Was bin ich?", en: "I follow you everywhere, but I disappear in the dark. What am I?", ja: "どこへでもついてくるのに、くらいときえるものなーんだ？" },
    a: { de: "Dein Schatten", en: "Your shadow", ja: "かげ" },
  },
];
