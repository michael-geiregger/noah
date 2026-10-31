"use client";

import { useCallback, useEffect, useState } from "react";
import { AUTH_CHANGED } from "./adminEvents";
import { getApi, type Membership, type Profile } from "./data";

/** Das angemeldete Konto (Ausweis + DELUXE-Status), hält sich selbst aktuell. */
export function useAccount() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const api = getApi();
    try {
      const [p, isAdmin] = await Promise.all([api.getMyProfile(), api.isAdmin().catch(() => false)]);
      setProfile(p);
      setAdmin(isAdmin);
      setMembership(p ? await api.getMyMembership() : null);
    } catch {
      setProfile(null);
      setMembership(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    window.addEventListener(AUTH_CHANGED, reload);
    return () => window.removeEventListener(AUTH_CHANGED, reload);
  }, [reload]);

  const isDeluxe = !!membership && !profile?.blocked;
  /** Darf die App benutzen: bezahltes DELUXE-Mitglied oder Noah (Admin) */
  const hasAccess = isDeluxe || admin;
  return { profile, membership, isDeluxe, isAdmin: admin, hasAccess, loading, reload };
}
