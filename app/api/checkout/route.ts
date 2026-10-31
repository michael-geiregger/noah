import { ConfigError, DELUXE_CURRENCY, DELUXE_PRICE_CENTS, hasMembership, json, stripe, userFromRequest } from "@/lib/server/deluxe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOCALES = { de: "de", en: "en", ja: "ja" } as const;

/** Startet eine Stripe-Bezahlseite für DELUXE (10,50 € einmalig). */
export async function POST(req: Request) {
  try {
    const user = await userFromRequest(req);
    if (!user) return json({ error: "not-logged-in" }, 401);
    if (await hasMembership(user.id)) return json({ error: "already-member" }, 409);

    const body = (await req.json().catch(() => ({}))) as { lang?: string };
    const locale = LOCALES[body.lang as keyof typeof LOCALES] ?? "de";
    const origin = new URL(req.url).origin;

    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: DELUXE_CURRENCY,
            unit_amount: DELUXE_PRICE_CENTS,
            product_data: {
              name: "TPWE DELUXE",
              description: "Einmalige DELUXE-Mitgliedschaft in Noahs Erfinder-Welt",
            },
          },
        },
      ],
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      metadata: { user_id: user.id, product: "deluxe" },
      locale,
      success_url: `${origin}/deluxe?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/deluxe?cancelled=1`,
    });

    return json({ url: session.url });
  } catch (e) {
    if (e instanceof ConfigError) return json({ error: "not-configured" }, 503);
    console.error("checkout", e);
    return json({ error: "server-error" }, 500);
  }
}
