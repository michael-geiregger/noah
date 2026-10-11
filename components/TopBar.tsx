"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ADMIN_CHANGED } from "@/lib/adminEvents";
import { getApi } from "@/lib/data";
import { LANGS, LANG_LABEL, useI18n, type DictKey } from "@/lib/i18n";

const LINKS: { href: string; icon: string; label: DictKey }[] = [
  { href: "/", icon: "🏠", label: "navHome" },
  { href: "/spielen", icon: "🎮", label: "navPlay" },
  { href: "/shop", icon: "🛒", label: "navShop" },
  { href: "/videos", icon: "🎬", label: "navVideos" },
];

const ADMIN_LINK = { href: "/admin", icon: "🔧", label: "navAdmin" as DictKey };

export function TopBar() {
  const { t, lang, setLang } = useI18n();
  const path = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [isAdmin, setIsAdmin] = useState(false);

  // Der Admin-Knopf erscheint nur, wenn Noah angemeldet ist.
  useEffect(() => {
    const check = () => getApi().isAdmin().then(setIsAdmin).catch(() => setIsAdmin(false));
    check();
    window.addEventListener(ADMIN_CHANGED, check);
    return () => window.removeEventListener(ADMIN_CHANGED, check);
  }, []);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("tpwe-theme", next);
    } catch {}
  };

  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand" aria-label="TPWE">
          <span className="brand-logo">⚙️</span>
          TPWE
        </Link>
        <nav className="nav">
          {(isAdmin ? [...LINKS, ADMIN_LINK] : LINKS).map((l) => (
            <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""}>
              <span aria-hidden>{l.icon}</span>
              <span className="label">{t(l.label)}</span>
            </Link>
          ))}
        </nav>
        <div className="toolbar">
          <div className="seg" role="group" aria-label="Sprache / Language / 言語">
            {LANGS.map((l) => (
              <button key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>
                {LANG_LABEL[l]}
              </button>
            ))}
          </div>
          <div className="seg">
            <button onClick={toggleTheme} aria-label={theme === "dark" ? t("themeLight") : t("themeDark")}>
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
