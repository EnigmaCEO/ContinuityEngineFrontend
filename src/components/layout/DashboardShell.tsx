"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { RightPanel } from "@/components/layout/RightPanel";
import { SessionProvider } from "@/components/layout/SessionContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { fetchMe } from "@/lib/saas/service";
import type { SaasMeResponse } from "@/lib/saas/types";

function AccessDenied() {
  return (
    <div style={{ padding: "36px 28px", color: "#E2E8F0" }}>
      <div
        style={{
          maxWidth: 620,
          border: "1px solid rgba(239,68,68,0.22)",
          background: "rgba(20,8,8,0.78)",
          borderRadius: 14,
          padding: 24,
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: "0.16em", color: "#FCA5A5" }}>ACCESS DENIED</div>
        <h1 style={{ margin: "10px 0 8px", fontSize: 28 }}>Restricted Route</h1>
        <p style={{ margin: 0, color: "rgba(226,232,240,0.78)", lineHeight: 1.6 }}>
          This page is reserved for operator-level roles in the current SaaS foundation build.
        </p>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<SaasMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMe()
      .then((result) => {
        if (cancelled) return;
        setMe(result);
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setError("unauthorized");
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (loading || !me) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#080a0e",
          color: "#D4AF37",
          letterSpacing: "0.14em",
          fontSize: 12,
        }}
      >
        {error ? "Redirecting to login" : "Loading session context"}
      </div>
    );
  }

  const isOperator = me.permissions.canViewGlobalModules;
  const isAdminRoute = pathname.startsWith("/dashboard/admin");
  const isSceOperationsRoute = [
    "/dashboard/red-team",
    "/dashboard/blue-team",
    "/dashboard/black-ops",
    "/dashboard/settings",
  ].some((route) => pathname.startsWith(route));

  let content = children;
  if (isAdminRoute && !me.permissions.canManageAccounts) {
    content = <AccessDenied />;
  } else if (isSceOperationsRoute && !isOperator) {
    content = <AccessDenied />;
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar me={me} />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#080a0e",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "rgba(8,10,14,0.92)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(212,175,55,0.1)",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.16em", color: "rgba(212,175,55,0.62)" }}>
              SESSION MODE
            </div>
            <div style={{ fontSize: 13, color: "#E2E8F0", fontWeight: 600 }}>
              Dev Placeholder Session
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span
              style={{
                border: "1px solid rgba(59,130,246,0.3)",
                background: "rgba(59,130,246,0.12)",
                color: "#BFDBFE",
                borderRadius: 999,
                padding: "6px 10px",
                fontSize: 11,
              }}
            >
              {me.user.name} · {me.currentRole ?? "unassigned"}
            </span>
            <span
              style={{
                border: "1px solid rgba(212,175,55,0.26)",
                background: "rgba(212,175,55,0.1)",
                color: "#F5E7A1",
                borderRadius: 999,
                padding: "6px 10px",
                fontSize: 11,
              }}
            >
              {me.activeAccount?.name ?? "No active account"}
            </span>
          </div>
        </div>
        <SessionProvider me={me}>{content}</SessionProvider>
      </div>
      <RightPanel me={me} />
    </div>
  );
}
