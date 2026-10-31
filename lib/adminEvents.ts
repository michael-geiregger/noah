export const ADMIN_CHANGED = "tpwe-admin-changed";

/** Sagt der Leiste oben Bescheid, dass sich der Admin-Status geändert hat. */
export function notifyAdminChanged() {
  window.dispatchEvent(new Event(ADMIN_CHANGED));
}

/** Gleiches Signal für normale Konten: An-/Abmelden, Ausweis geändert, DELUXE gekauft. */
export const AUTH_CHANGED = ADMIN_CHANGED;
export const notifyAuthChanged = notifyAdminChanged;
