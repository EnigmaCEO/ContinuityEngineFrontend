"use client";

import Link from "next/link";

import { useSession } from "@/components/layout/SessionContext";

export function RadarServiceOpsCard() {
  const session = useSession();
  const isOperator = session?.permissions.canViewGlobalModules ?? false;

  if (!isOperator) return null;

  return (
    <section
      style={{
        background: "linear-gradient(180deg, rgba(15,18,28,0.96), rgba(8,10,14,0.96))",
        border: "1px solid rgba(212,175,55,0.12)",
        borderRadius: 10,
        padding: 16,
        display: "grid",
        gap: 10,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#D4AF37",
            marginBottom: 4,
          }}
        >
          RADAR LIVE SERVICE OPS
        </div>
        <div style={{ fontSize: 11, color: "rgba(203,213,225,0.72)", lineHeight: 1.6 }}>
          Manage Radar clients, watchlists, delivery destinations, and live alert delivery from the dedicated service
          operations page.
        </div>
      </div>

      <div>
        <Link
          href="/dashboard/radar-service"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            border: "1px solid rgba(212,175,55,0.28)",
            background: "rgba(212,175,55,0.08)",
            color: "#D4AF37",
            padding: "8px 12px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textDecoration: "none",
          }}
        >
          Open Radar Service Ops
        </Link>
      </div>
    </section>
  );
}
