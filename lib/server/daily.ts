// Nur auf dem Server: Video-Räume bei Daily.co anlegen und Zutrittsschlüssel ausstellen.
import "server-only";
import { ConfigError } from "./deluxe";

const API = "https://api.daily.co/v1";

async function daily<T>(path: string, init?: { method?: string; body?: unknown }): Promise<{ status: number; data: T }> {
  const key = process.env.DAILY_API_KEY;
  if (!key) throw new ConfigError("DAILY_API_KEY fehlt");
  const res = await fetch(`${API}${path}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, data };
}

type Room = { name: string; url: string };

/** Raum holen oder (privat, mit Öffnungszeiten) anlegen. */
export async function ensureRoom(name: string, nbf: Date, exp: Date, maxParticipants: number): Promise<Room> {
  const existing = await daily<Room>(`/rooms/${encodeURIComponent(name)}`);
  if (existing.status === 200 && existing.data.url) return existing.data;

  const created = await daily<Room & { error?: string; info?: string }>("/rooms", {
    method: "POST",
    body: {
      name,
      privacy: "private", // nur mit persönlichem Schlüssel
      properties: {
        nbf: Math.floor(nbf.getTime() / 1000),
        exp: Math.floor(exp.getTime() / 1000),
        eject_at_room_exp: true, // am Ende fliegen alle raus
        max_participants: maxParticipants,
        enable_chat: false, // kein Text-Chat mit Fremden
        enable_screenshare: false,
        enable_prejoin_ui: true, // Kamera/Mikro vorher testen
        enable_knocking: false,
        enable_people_ui: true,
      },
    },
  });
  if (created.status === 200 && created.data.url) return created.data;
  // Gleichzeitig angelegt? Dann nochmal holen.
  const again = await daily<Room>(`/rooms/${encodeURIComponent(name)}`);
  if (again.status === 200 && again.data.url) return again.data;
  throw new Error(`daily room ${created.status}: ${created.data.error ?? ""} ${created.data.info ?? ""}`);
}

/** Persönlicher Schlüssel: gilt nur für diesen Raum, nur in diesem Zeitfenster. */
export async function meetingToken(opts: {
  room: string;
  userId: string;
  userName: string;
  owner: boolean;
  nbf: Date;
  exp: Date;
  lang: string;
}) {
  const res = await daily<{ token?: string; error?: string }>("/meeting-tokens", {
    method: "POST",
    body: {
      properties: {
        room_name: opts.room,
        user_id: opts.userId.slice(0, 36),
        user_name: opts.userName.slice(0, 30),
        is_owner: opts.owner, // Noah darf stummschalten und Leute entfernen
        nbf: Math.floor(opts.nbf.getTime() / 1000),
        exp: Math.floor(opts.exp.getTime() / 1000),
        eject_at_token_exp: true,
        enable_prejoin_ui: true,
        ...(opts.lang === "de" || opts.lang === "en" ? { lang: opts.lang } : {}),
        ...(opts.owner ? {} : { permissions: { canAdmin: false } }),
      },
    },
  });
  if (res.status !== 200 || !res.data.token) throw new Error(`daily token ${res.status}: ${res.data.error ?? ""}`);
  return res.data.token;
}
