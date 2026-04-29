"use client";

import { createContext, useContext } from "react";

import type { SaasMeResponse } from "@/lib/saas/types";

const SessionContext = createContext<SaasMeResponse | null>(null);

export function SessionProvider({
  me,
  children,
}: {
  me: SaasMeResponse;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={me}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
