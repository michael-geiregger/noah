export const ADMIN_CHANGED = "tpwe-admin-changed";

/** Sagt der Leiste oben Bescheid, dass sich der Admin-Status geändert hat. */
export function notifyAdminChanged() {
  window.dispatchEvent(new Event(ADMIN_CHANGED));
}
