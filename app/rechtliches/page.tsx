// ⚠️ Michi: Die Platzhalter [IN ECKIGEN KLAMMERN] bitte mit echten Angaben ersetzen,
// am besten mit einem Generator (z. B. für Österreich: WKO, für Deutschland: e-recht24)
// oder mit rechtlicher Beratung prüfen lassen. Das hier ist nur das Gerüst.
export const metadata = { title: "Rechtliches – TPWE" };

export default function LegalPage() {
  return (
    <div className="card form" style={{ maxWidth: 760, margin: "0 auto" }}>
      <h1>📄 Rechtliches</h1>

      <section id="impressum">
        <h2>Impressum</h2>
        <p>
          TPWE – Noahs Erfinder-Welt
          <br />
          Verantwortlich: [NAME DES ERZIEHUNGSBERECHTIGTEN]
          <br />
          [STRASSE, PLZ ORT, LAND]
          <br />
          E-Mail: [E-MAIL]
        </p>
      </section>

      <section id="agb">
        <h2>AGB für TPWE DELUXE</h2>
        <p>
          TPWE DELUXE ist eine einmalige Mitgliedschaft zum Preis von 10,50 € (inkl. [USt-Hinweis]). Sie gilt für ein
          Konto und schaltet die DELUXE-Bereiche der App frei. Die Bezahlung erfolgt über Stripe. [WEITERE BEDINGUNGEN]
        </p>
        <p>
          Bei Verstößen gegen die Regeln (z. B. unfreundliches Verhalten im Funkraum) kann ein Konto gesperrt werden.
        </p>
      </section>

      <section id="widerruf">
        <h2>Widerrufsbelehrung</h2>
        <p>
          [WIDERRUFSBELEHRUNG FÜR DIGITALE INHALTE / DIENSTLEISTUNGEN]. Wer vor dem Kauf ausdrücklich zustimmt, dass
          DELUXE sofort startet, verliert damit das Widerrufsrecht.
        </p>
      </section>

      <section id="datenschutz">
        <h2>Datenschutz</h2>
        <p>
          Gespeichert werden: E-Mail-Adresse, Erfinder-Name, Avatar, Spielstände, Kommentare, Bestellungen und
          DELUXE-Zahlungen. Dienstleister: Vercel (Hosting), Supabase (Datenbank, EU/Frankfurt), Stripe (Zahlung).
          Kartendaten sieht die App nie – sie gehen direkt an Stripe. [VOLLSTÄNDIGE DATENSCHUTZERKLÄRUNG]
        </p>
      </section>
    </div>
  );
}
