import type Stripe from "stripe";
import { ConfigError, grantFromSession, json, stripe } from "@/lib/server/deluxe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe meldet hier jede erfolgreiche Zahlung – auch wenn jemand nach dem
 * Bezahlen das Fenster schließt, bevor er zur App zurückkommt.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return json({ error: "not-configured" }, 503);

  let event: Stripe.Event;
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") ?? "";
    event = stripe().webhooks.constructEvent(body, signature, secret);
  } catch (e) {
    if (e instanceof ConfigError) return json({ error: "not-configured" }, 503);
    return json({ error: "bad-signature" }, 400);
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await grantFromSession(event.data.object as Stripe.Checkout.Session);
    }
    return json({ received: true });
  } catch (e) {
    console.error("webhook", e);
    return json({ error: "server-error" }, 500);
  }
}
