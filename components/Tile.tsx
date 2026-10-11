import Link from "next/link";

export function Tile({
  href, icon, title, sub, variant, big,
}: { href: string; icon: string; title: string; sub?: string; variant?: "blue" | "yellow"; big?: boolean }) {
  return (
    <Link href={href} className={`tile ${variant ?? ""} ${big ? "big" : ""}`}>
      <span className="icon" aria-hidden>{icon}</span>
      <span className="title">{title}</span>
      {sub && <span className="sub">{sub}</span>}
    </Link>
  );
}
