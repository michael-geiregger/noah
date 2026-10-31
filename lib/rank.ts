import type { DictKey } from "./i18n";
import type { Membership, Profile } from "./data";

// Rang nach gesammelten Raketen-Sternen
const RANKS: { min: number; key: DictKey; icon: string }[] = [
  { min: 150, key: "rank4", icon: "🧠" },
  { min: 75, key: "rank3", icon: "🏅" },
  { min: 30, key: "rank2", icon: "💡" },
  { min: 10, key: "rank1", icon: "🔧" },
  { min: 0, key: "rank0", icon: "🔩" },
];

export function rankFor(stars: number) {
  return RANKS.find((r) => stars >= r.min)!;
}

export type Badge = { key: DictKey; icon: string };

export function badgesFor(p: Profile, m: Membership | null): Badge[] {
  const list: Badge[] = [];
  if (m) list.push({ key: "badgeDeluxe", icon: "💎" });
  if (p.rocket_stars >= 1) list.push({ key: "badgeFirstFlight", icon: "🚀" });
  if (p.rocket_stars >= 15) list.push({ key: "badgeMoonPilot", icon: "🌕" });
  if (p.rocket_stars >= 50) list.push({ key: "badgeStarCollector", icon: "🌟" });
  if (p.quiz_best >= 8) list.push({ key: "badgeQuizPro", icon: "🧠" });
  return list;
}

export const AVATARS = ["🧑‍🔬", "👩‍🔬", "👨‍🔬", "🧑‍🚀", "🤖", "🦊", "🐱", "🐶", "🐼", "🦖", "🐙", "🦄", "⚡", "🚀", "🔭", "🧲"];
