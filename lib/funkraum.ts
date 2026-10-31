// Funkraum-Zeitplan (läuft im Browser und auf dem Server)

export const RADIO_TZ = "Europe/Vienna";
/** Wochentag: 0 = Sonntag … 6 = Samstag. Hier neue Zeiten ergänzen. */
export const RADIO_SCHEDULE = [{ weekday: 6, hour: 13, minute: 0, minutes: 30 }];
/** Noah darf so viele Minuten vor Beginn schon hinein (zum Vorbereiten). */
export const OWNER_EARLY_MINUTES = 15;
/** Privat-Gespräch: Raum offen von 10 Min. vorher bis 30 Min. nach dem Termin. */
export const PRIVATE_BEFORE_MINUTES = 10;
export const PRIVATE_AFTER_MINUTES = 30;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parts(date: Date, tz = RADIO_TZ) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
    })
      .formatToParts(date)
      .map((x) => [x.type, x.value]),
  );
  return {
    y: Number(p.year),
    m: Number(p.month),
    d: Number(p.day),
    h: Number(p.hour),
    min: Number(p.minute),
    s: Number(p.second),
    weekday: WEEKDAYS.indexOf(p.weekday),
  };
}

/** Uhrzeit in der Zeitzone → echter Zeitpunkt (berücksichtigt Sommer-/Winterzeit). */
export function zonedToUtc(y: number, m: number, d: number, h: number, min: number, tz = RADIO_TZ) {
  const asUtc = Date.UTC(y, m - 1, d, h, min);
  const offsetAt = (t: number) => {
    const p = parts(new Date(t), tz);
    return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - t;
  };
  let t = asUtc - offsetAt(asUtc);
  t = asUtc - offsetAt(t);
  return new Date(t);
}

export type Session = { start: Date; end: Date };

/** Die laufende oder nächste Funkraum-Runde. */
export function nextSession(now = new Date()): Session {
  const today = parts(now);
  for (let i = 0; i <= 7; i++) {
    const day = new Date(Date.UTC(today.y, today.m - 1, today.d + i));
    const weekday = day.getUTCDay();
    for (const s of RADIO_SCHEDULE) {
      if (s.weekday !== weekday) continue;
      const start = zonedToUtc(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), s.hour, s.minute);
      const end = new Date(start.getTime() + s.minutes * 60_000);
      if (end > now) return { start, end };
    }
  }
  throw new Error("no session");
}

/** Darf man jetzt in den Funkraum? (Noah schon ein paar Minuten früher) */
export function isOpen(s: Session, now = new Date(), owner = false) {
  const opens = s.start.getTime() - (owner ? OWNER_EARLY_MINUTES * 60_000 : 0);
  return now.getTime() >= opens && now < s.end;
}

export function privateWindow(scheduledAt: string | Date) {
  const t = new Date(scheduledAt).getTime();
  return { start: new Date(t - PRIVATE_BEFORE_MINUTES * 60_000), end: new Date(t + PRIVATE_AFTER_MINUTES * 60_000) };
}

/** z. B. "2026-11-07" in Wiener Zeit – für eindeutige Raumnamen */
export function sessionKey(s: Session) {
  const p = parts(s.start);
  return `${p.y}${String(p.m).padStart(2, "0")}${String(p.d).padStart(2, "0")}`;
}
