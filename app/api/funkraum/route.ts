import { isOpen, nextSession, OWNER_EARLY_MINUTES, privateWindow, sessionKey } from "@/lib/funkraum";
import { ensureRoom, meetingToken } from "@/lib/server/daily";
import { accessFor, ConfigError, json, supabaseAdmin, userFromRequest } from "@/lib/server/deluxe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Gibt einen persönlichen Zutrittsschlüssel für den Funkraum oder ein Privat-Gespräch.
 * Schutzregeln: nur DELUXE/Admin, nur zu den festen Zeiten bzw. zum bestätigten Termin,
 * Noah ist "Owner" (kann stummschalten/entfernen), am Ende werden alle automatisch getrennt.
 */
export async function POST(req: Request) {
  try {
    if (!process.env.DAILY_API_KEY) throw new ConfigError("DAILY_API_KEY fehlt");
    const user = await userFromRequest(req);
    if (!user) return json({ error: "not-logged-in" }, 401);
    const access = await accessFor(user);
    if (!access.allowed) return json({ error: "not-member" }, 403);

    const body = (await req.json().catch(() => ({}))) as { kind?: string; requestId?: string; lang?: string };
    const lang = typeof body.lang === "string" ? body.lang : "de";
    const now = new Date();

    if (body.kind === "group") {
      const session = nextSession(now);
      if (!isOpen(session, now, access.admin)) return json({ error: "closed", opensAt: session.start.toISOString() }, 403);
      const opens = new Date(session.start.getTime() - OWNER_EARLY_MINUTES * 60_000);
      const room = await ensureRoom(`funkraum-${sessionKey(session)}`, opens, session.end, 20);
      const token = await meetingToken({
        room: room.name,
        userId: user.id,
        userName: access.displayName,
        owner: access.admin,
        nbf: access.admin ? opens : session.start,
        exp: session.end,
        lang,
      });
      return json({ url: room.url, token, endsAt: session.end.toISOString() });
    }

    if (body.kind === "private") {
      if (!body.requestId || !/^[0-9a-f-]{36}$/.test(body.requestId)) return json({ error: "bad-request" }, 400);
      const { data: request, error } = await supabaseAdmin()
        .from("call_requests")
        .select("id, user_id, status, scheduled_at")
        .eq("id", body.requestId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!request || (request.user_id !== user.id && !access.admin)) return json({ error: "forbidden" }, 403);
      if (request.status !== "bestaetigt" || !request.scheduled_at) return json({ error: "not-confirmed" }, 403);
      const win = privateWindow(request.scheduled_at);
      if (now < win.start || now >= win.end) return json({ error: "closed", opensAt: win.start.toISOString() }, 403);

      // Nur Noah und die anfragende Person (ein Erwachsener sitzt daneben)
      const room = await ensureRoom(`privat-${request.id}`, win.start, win.end, 3);
      const token = await meetingToken({
        room: room.name,
        userId: user.id,
        userName: access.displayName,
        owner: access.admin,
        nbf: win.start,
        exp: win.end,
        lang,
      });
      return json({ url: room.url, token, endsAt: win.end.toISOString() });
    }

    return json({ error: "bad-request" }, 400);
  } catch (e) {
    if (e instanceof ConfigError) return json({ error: "not-configured" }, 503);
    console.error("funkraum", e);
    return json({ error: "server-error" }, 500);
  }
}
