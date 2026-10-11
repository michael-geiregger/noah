import type { Product } from "@/lib/data";

export function ProductMedia({ p, className = "product-media" }: { p: Product; className?: string }) {
  return (
    <div className={className}>
      {p.image_url ? <img src={p.image_url} alt={p.name} /> : <span aria-hidden>{p.emoji || "💡"}</span>}
    </div>
  );
}
