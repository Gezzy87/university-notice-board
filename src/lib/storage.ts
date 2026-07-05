import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "images";

/**
 * Server-side Supabase admin client (service_role key). NEVER import this into
 * client components — the key must not reach the browser. Null when storage
 * isn't configured, so callers can degrade gracefully.
 */
export const supabaseAdmin =
  url && key
    ? createClient(url, key, { auth: { persistSession: false } })
    : null;

export function storageConfigured(): boolean {
  return supabaseAdmin !== null;
}
