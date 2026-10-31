// Nur auf dem Server! Hier liegen die geheimen Schlüssel (Stripe, Supabase service role).
import "server-only";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const DELUXE_PRICE_CENTS = 1050;
export const DELUXE_CURRENCY = "eur";

export class ConfigError extends Error {}

export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new ConfigError("STRIPE_SECRET_KEY fehlt");
  return new Stripe(key);
}

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new ConfigError("SUPABASE_SERVICE_ROLE_KEY fehlt");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Wer schickt diese Anfrage? (prüft den Anmelde-Ausweis bei Supabase) */
export async function userFromRequest(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

export async function hasMembership(userId: string) {
  const { data, error } = await supabaseAdmin().from("memberships").select("user_id").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

/**
 * Speichert die Mitgliedschaft – aber nur, wenn Stripe die Zahlung über
 * den richtigen Betrag als bezahlt meldet.
 */
export async function grantFromSession(session: Stripe.Checkout.Session): Promise<boolean> {
  const userId = session.client_reference_id;
  const paid =
    session.payment_status === "paid" &&
    session.amount_total === DELUXE_PRICE_CENTS &&
    session.currency === DELUXE_CURRENCY;
  if (!userId || !paid) return false;

  const { error } = await supabaseAdmin()
    .from("memberships")
    .upsert(
      {
        user_id: userId,
        source: "stripe",
        amount_cents: session.amount_total,
        stripe_session_id: session.id,
        paid_at: new Date((session.created ?? Date.now() / 1000) * 1000).toISOString(),
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);
  return true;
}

/** Zugang: DELUXE-Mitglied (nicht gesperrt) oder Admin? Liefert auch Name und Bild. */
export async function accessFor(user: { id: string; email: string | null }) {
  const db = supabaseAdmin();
  const [{ data: membership }, { data: profile }, { data: admins }] = await Promise.all([
    db.from("memberships").select("user_id").eq("user_id", user.id).maybeSingle(),
    db.from("profiles").select("blocked, display_name, avatar").eq("id", user.id).maybeSingle(),
    db.from("admins").select("email"),
  ]);
  // exakter Vergleich (ohne Platzhalter wie % oder _)
  const email = user.email?.toLowerCase();
  const admin = !!email && (admins ?? []).some((a: { email: string }) => a.email.toLowerCase() === email);
  const member = !!membership && !profile?.blocked;
  return { allowed: admin || member, admin, displayName: (profile?.display_name as string | undefined) ?? "Erfinder" };
}

export async function canUseDeluxe(user: { id: string; email: string | null }) {
  return (await accessFor(user)).allowed;
}

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
