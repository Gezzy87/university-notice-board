import { headers } from "next/headers";
import { auth } from "./auth";

/**
 * Current session (or null) for use in Server Components and route handlers.
 * Fault-tolerant: a transient database/network hiccup degrades to "no session"
 * for this render rather than throwing a 500. The cookie cache means most reads
 * never touch the database, so blips are rare and non-fatal.
 */
export async function getSession() {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch (err) {
    console.error("[session] getSession failed:", err);
    return null;
  }
}

/** Convenience: the current user (or null). Includes role + department. */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}
