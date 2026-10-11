import { createLocalApi } from "./local";
import { createSupabaseApi } from "./supabase";
import type { DataApi } from "./types";

export * from "./types";

let api: DataApi | null = null;

export function getApi(): DataApi {
  if (api) return api;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  api = url && key ? createSupabaseApi(url, key) : createLocalApi();
  return api;
}
