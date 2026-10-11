import type { DictKey } from "@/lib/i18n";

export function uploadErrorKey(e: unknown): DictKey {
  const m = e instanceof Error ? e.message : "";
  if (m === "demo-video") return "demoVideo";
  if (m === "demo-image-size") return "demoImageSize";
  return "errorGeneric";
}
