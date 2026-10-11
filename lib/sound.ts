"use client";

// Kleine Sound-Werkzeugkiste: alle Töne werden live erzeugt (keine Audiodateien nötig).
import type { Lang } from "./i18n";

let ctx: AudioContext | null = null;

/** Muss beim ersten Mal aus einem Klick heraus aufgerufen werden (Handy/iPad-Regel). */
export function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function beep(freq: number, duration = 0.15, volume = 0.2, type: OscillatorType = "sine", delay = 0) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

/** Kleine Melodie aus Frequenzen, z. B. für einen Erfolg. */
export function jingle(notes: number[], step = 0.13) {
  notes.forEach((f, i) => beep(f, 0.22, 0.18, "triangle", i * step));
}

/** Raketen-Rauschen: tiefes Brummen + Rauschen. Gibt eine Stopp-Funktion zurück. */
export function rocketSound(): () => void {
  const ac = audio();
  if (!ac) return () => {};
  const t = ac.currentTime;

  const buffer = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noise = ac.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(300, t);
  filter.frequency.linearRampToValueAtTime(900, t + 0.8);

  const rumble = ac.createOscillator();
  rumble.type = "sawtooth";
  rumble.frequency.value = 48;
  const rumbleGain = ac.createGain();
  rumbleGain.gain.value = 0.12;

  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(0.55, t + 0.35);

  noise.connect(filter).connect(master);
  rumble.connect(rumbleGain).connect(filter);
  master.connect(ac.destination);
  noise.start(t);
  rumble.start(t);

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    const now = ac.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    noise.stop(now + 0.7);
    rumble.stop(now + 0.7);
  };
}

const SPEECH_LANG: Record<Lang, string> = { de: "de-DE", en: "en-US", ja: "ja-JP" };

/** Spricht einen Text in der gewählten Sprache (wenn das Gerät eine Stimme hat). */
export function speak(text: string, lang: Lang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = SPEECH_LANG[lang];
  const voice = speechSynthesis.getVoices().find((v) => v.lang.replace("_", "-").startsWith(SPEECH_LANG[lang].slice(0, 2)));
  if (voice) u.voice = voice;
  u.rate = 1;
  u.pitch = 1.1;
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) speechSynthesis.cancel();
}
