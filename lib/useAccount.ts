"use client";

import { useCallback, useEffect, useState } from "react";
import { AUTH_CHANGED } from "./adminEvents";
import { getApi, type Membership, type Profile } from "./data";

/** Das angemeldete Konto (Ausweis + DELUXE-Status), hält sich selbst aktuell. */
export function useAccount() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const api = getApi();
    try {
      const p = await api.getMyProfile();
      setProfile(p);
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

  return { profile, membership, isDeluxe: !!membership && !profile?.blocked, loading, reload };
}
