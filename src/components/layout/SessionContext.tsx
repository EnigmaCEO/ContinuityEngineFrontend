"use client";

import { createContext, useContext } from "react";

import type { MembershipRole, SaasMeResponse } from "@/lib/saas/types";

export type SessionContextValue = SaasMeResponse & {
  realRole: MembershipRole | null;
  effectiveRole: MembershipRole | null;
  previewRole: MembershipRole | null;
  isPreviewingRole: boolean;
  setPreviewRole: (role: MembershipRole | null) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  me,
  setPreviewRole,
  children,
}: {
  me: SaasMeResponse;
  setPreviewRole: (role: MembershipRole | null) => void;
  children: React.ReactNode;
}) {
  return (
    <SessionContext.Provider
      value={{
        ...me,
        realRole: me.realRole ?? me.currentRole ?? null,
        effectiveRole: me.effectiveRole ?? me.currentRole ?? null,
        previewRole: me.previewRole ?? null,
        isPreviewingRole: me.isPreviewingRole ?? false,
        setPreviewRole,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
