"use client";

import { createContext, useContext } from "react";

const AuthContext = createContext(false);

/** Provides whether the current viewer is logged in, so nested client
 * components (bookmark, RSVP, comments) can gate actions behind login. */
export function AuthProvider({
  value,
  children,
}: {
  value: boolean;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useIsAuthenticated() {
  return useContext(AuthContext);
}
