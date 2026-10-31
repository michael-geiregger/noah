import { ConfigError, grantFromSession, hasMembership, json, stripe, userFromRequest } from "@/lib/server/deluxe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Nach der Rückkehr von Stripe: Zahlung prüfen und Mitgliedschaft speichern. */
export async function POST(req: Request) {
  try {
    const user = await userFromRequest(req);
    if (!user) return json({ error: "not-logged-in" }, 401);

    const { sessionId } = (await req.json().catch(() => ({}))) as { sessionId?: string };
    if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return json({ error: "bad-request" }, 400);

    const session = await stripe().checkout.sessions.retrieve(sessionId);
    if (session.client_reference_id !== user.id) return json({ error: "forbidden" }, 403);

    await grantFromSession(session);
    return json({ member: await hasMembership(user.id) });
  } catch (e) {
    if (e instanceof ConfigError) return json({ error: "not-configured" }, 503);
    console.error("confirm", e);
    return json({ error: "server-error" }, 500);
  }
}
