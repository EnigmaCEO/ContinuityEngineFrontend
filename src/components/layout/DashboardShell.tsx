"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { RightPanel } from "@/components/layout/RightPanel";
import { SessionProvider } from "@/components/layout/SessionContext";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  isViewAsAdmin,
  isViewAsRole,
  viewAsRoles,
  VIEW_AS_STORAGE_KEY,
  withEffectiveRole,
} from "@/lib/saas/role-preview";
import { fetchMe } from "@/lib/saas/service";
import type { MembershipRole, SaasMeResponse } from "@/lib/saas/types";

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
          This page is reserved for account manager or operator-level roles.
        </p>
      </div>
    </div>
  );
}

function ModuleUnavailable({ onReturn }: { onReturn: () => void }) {
  return (
    <div style={{ padding: "36px 28px", color: "#E2E8F0" }}>
      <div
        style={{
          maxWidth: 620,
          border: "1px solid rgba(212,175,55,0.22)",
          background: "rgba(22,18,8,0.78)",
          borderRadius: 14,
          padding: 24,
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: "0.16em", color: "#F5E7A1" }}>VIEW AS PREVIEW</div>
        <h1 style={{ margin: "10px 0 8px", fontSize: 28 }}>Module Not Available</h1>
        <p style={{ margin: 0, color: "rgba(226,232,240,0.78)", lineHeight: 1.6 }}>
          This module is not available for the selected preview role.
        </p>
        <button
          type="button"
          onClick={onReturn}
          style={{
            marginTop: 18,
            border: "1px solid rgba(212,175,55,0.34)",
            background: "rgba(212,175,55,0.12)",
            color: "#F5E7A1",
            borderRadius: 6,
            padding: "8px 11px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          Return to real session
        </button>
      </div>
    </div>
  );
}

function readStoredPreviewRole(): MembershipRole | null {
  if (typeof window === "undefined") return null;
  const stored = window.sessionStorage.getItem(VIEW_AS_STORAGE_KEY);
  return isViewAsRole(stored) ? stored : null;
}

function storePreviewRole(role: MembershipRole | null): void {
  if (typeof window === "undefined") return;
  if (!role) {
    window.sessionStorage.removeItem(VIEW_AS_STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(VIEW_AS_STORAGE_KEY, role);
}

function roleLabel(role: MembershipRole | null | undefined): string {
  return role ? role.replaceAll("_", " ") : "unassigned";
}

function DashboardSessionLoadingShell({ redirecting }: { redirecting: boolean }) {
  const placeholder = (width: string) => ({
    width,
    height: 8,
    borderRadius: 999,
    background: "rgba(148,163,184,0.13)",
  });

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#080a0e" }}>
      <aside
        style={{
          width: 176,
          minWidth: 176,
          borderRight: "1px solid rgba(212,175,55,0.18)",
          background: "#0b0d12",
          padding: "24px 14px",
        }}
      >
        <div style={{ color: "#D4AF37", fontSize: 15, fontWeight: 700, letterSpacing: "0.1em" }}>
          SAGITTA
        </div>
        <div style={{ color: "rgba(212,175,55,0.55)", fontSize: 8, letterSpacing: "0.18em", marginTop: 3 }}>
          CONTINUITY ENGINE
        </div>
        <div style={{ display: "grid", gap: 18, marginTop: 38 }}>
          {["72%", "88%", "64%", "82%", "70%", "90%"].map((width, index) => (
            <div key={`${width}-${index}`} style={placeholder(width)} />
          ))}
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            minHeight: 62,
            borderBottom: "1px solid rgba(212,175,55,0.1)",
            padding: "12px 20px",
            background: "rgba(8,10,14,0.92)",
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: "0.16em", color: "rgba(212,175,55,0.62)" }}>
            SESSION MODE
          </div>
          <div style={{ marginTop: 5, fontSize: 13, color: "#E2E8F0", fontWeight: 600 }}>
            {redirecting ? "Redirecting to login" : "Resolving secure session"}
          </div>
        </header>
        <div style={{ padding: 20, overflow: "hidden" }}>
          <div style={{ color: "#D4AF37", fontSize: 11, letterSpacing: "0.14em" }}>COMMAND OVERVIEW</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 18 }}>
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                style={{
                  minHeight: item < 3 ? 112 : 180,
                  border: "1px solid rgba(212,175,55,0.12)",
                  borderRadius: 8,
                  background: "rgba(10,12,18,0.86)",
                  padding: 14,
                }}
              >
                <div style={placeholder("42%")} />
                <div style={{ ...placeholder("76%"), marginTop: 18, height: 13 }} />
                <div style={{ ...placeholder("58%"), marginTop: 10 }} />
              </div>
            ))}
          </div>
        </div>
      </main>

      <aside
        style={{
          width: 316,
          minWidth: 316,
          borderLeft: "1px solid rgba(212,175,55,0.18)",
          background: "#0b0d12",
          padding: "18px 16px",
        }}
      >
        <div style={{ color: "#D4AF37", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em" }}>SCE PORTAL</div>
        <div style={{ display: "grid", gap: 20, marginTop: 32 }}>
          {["86%", "70%", "92%", "64%", "78%"].map((width, index) => (
            <div key={`${width}-${index}`} style={placeholder(width)} />
          ))}
        </div>
      </aside>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<SaasMeResponse | null>(null);
  const [previewRole, setPreviewRoleState] = useState<MembershipRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pathname !== "/dashboard") return;
    let cancelled = false;
    void import("@/lib/case-library/service").then(({ fetchDashboardOverview, fetchIncidentsOverview }) => {
      if (cancelled) return;
      void Promise.allSettled([
        fetchDashboardOverview("7d"),
        fetchIncidentsOverview(),
      ]);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    fetchMe()
      .then((result) => {
        if (cancelled) return;
        const storedPreviewRole = readStoredPreviewRole();
        if (isViewAsAdmin(result.currentRole ?? null)) {
          setPreviewRoleState(storedPreviewRole);
        } else if (storedPreviewRole) {
          storePreviewRole(null);
          setPreviewRoleState(null);
        }
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
    return <DashboardSessionLoadingShell redirecting={Boolean(error)} />;
  }

  const realRole = me.currentRole ?? null;
  const canUseViewAs = isViewAsAdmin(realRole);
  const effectiveMe = withEffectiveRole(me, canUseViewAs ? previewRole : null);
  const activePreviewRole = effectiveMe.previewRole;
  const isOperator = effectiveMe.permissions.canViewGlobalModules;
  const isAdminRoute = pathname.startsWith("/dashboard/admin");
  const isSceOperationsRoute = [
    "/dashboard/radar-service",
    "/dashboard/red-team",
    "/dashboard/blue-team",
    "/dashboard/black-ops",
    "/dashboard/settings",
  ].some((route) => pathname.startsWith(route));

  function handlePreviewRoleChange(role: MembershipRole | null) {
    if (!canUseViewAs) {
      setPreviewRoleState(null);
      storePreviewRole(null);
      return;
    }
    setPreviewRoleState(role);
    storePreviewRole(role);
  }

  let content = children;
  const canUseAdminAccounts = effectiveMe.isPreviewingRole
    ? effectiveMe.permissions.canManageAccounts
    : effectiveMe.permissions.canManageAccounts || effectiveMe.permissions.canManageAccount;
  if (isAdminRoute && !canUseAdminAccounts) {
    content = activePreviewRole ? <ModuleUnavailable onReturn={() => handlePreviewRoleChange(null)} /> : <AccessDenied />;
  } else if (isSceOperationsRoute && !isOperator) {
    content = activePreviewRole ? <ModuleUnavailable onReturn={() => handlePreviewRoleChange(null)} /> : <AccessDenied />;
  }

  return (
    <div id="dashboard-shell-root" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <div className="dashboard-chrome">
        <Sidebar me={effectiveMe} />
      </div>
      <div
        id="dashboard-main-content"
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
          className="dashboard-chrome"
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
              {me.user.name} · real: {roleLabel(realRole)}
            </span>
            {canUseViewAs ? (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  border: "1px solid rgba(148,163,184,0.22)",
                  background: "rgba(148,163,184,0.08)",
                  color: "#CBD5E1",
                  borderRadius: 999,
                  padding: "4px 9px",
                  fontSize: 11,
                }}
              >
                View As
                <select
                  value={activePreviewRole ?? ""}
                  onChange={(event) =>
                    handlePreviewRoleChange(event.target.value ? (event.target.value as MembershipRole) : null)
                  }
                  style={{
                    border: "1px solid rgba(148,163,184,0.24)",
                    background: "#0b0d12",
                    color: "#E2E8F0",
                    borderRadius: 999,
                    padding: "3px 7px",
                    fontSize: 11,
                  }}
                >
                  <option value="">Real Session</option>
                  {viewAsRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
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
              {effectiveMe.activeAccount?.name ?? "No active account"}
            </span>
          </div>
        </div>
        {activePreviewRole ? (
          <div
            className="dashboard-chrome"
            style={{
              borderBottom: "1px solid rgba(245,158,11,0.26)",
              background: "rgba(245,158,11,0.12)",
              color: "#FDE68A",
              padding: "9px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span>VIEW AS: {activePreviewRole} &mdash; frontend preview only</span>
            <button
              type="button"
              onClick={() => handlePreviewRoleChange(null)}
              style={{
                border: "1px solid rgba(253,230,138,0.45)",
                background: "rgba(8,10,14,0.42)",
                color: "#FDE68A",
                borderRadius: 6,
                padding: "5px 9px",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              Exit View As
            </button>
          </div>
        ) : null}
        <SessionProvider me={effectiveMe} setPreviewRole={handlePreviewRoleChange}>
          {content}
        </SessionProvider>
      </div>
      <div className="dashboard-chrome">
        <RightPanel me={effectiveMe} />
      </div>
    </div>
  );
}
