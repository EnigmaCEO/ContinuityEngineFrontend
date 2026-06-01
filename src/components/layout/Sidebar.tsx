"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Network,
  AlertTriangle,
  FolderOpen,
  Cpu,
  Activity,
  Eye,
  ShieldCheck,
  Zap,
  Shield,
  EyeOff,
  Settings,
  ChevronDown,
  Building2,
  LogOut,
  ClipboardList,
  Bug,
  type LucideIcon,
} from "lucide-react";

import { logout } from "@/lib/saas/service";
import type { SaasMeResponse } from "@/lib/saas/types";

type NavItem = { href: string; icon: LucideIcon; label: string; accountManagerOnly?: boolean };
type NavSection = { heading: string; items: NavItem[]; adminOnly?: boolean };

const navSections: NavSection[] = [
  {
    heading: "GLOBAL INTELLIGENCE",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Command Overview" },
      { href: "/dashboard/case-library", icon: FolderOpen, label: "Case Library" },
      { href: "/dashboard/doctrine", icon: BookOpen, label: "Doctrine Engine" },
      { href: "/dashboard/threat-matrix", icon: Network, label: "Threat Matrix" },
      { href: "/dashboard/cve-intelligence", icon: Bug, label: "CVE Intelligence" },
      { href: "/dashboard/incidents", icon: AlertTriangle, label: "Incidents" },
    ],
  },
  {
    heading: "ACCOUNT OPERATIONS",
    items: [
      { href: "/dashboard/project-map", icon: Building2, label: "Project Map" },
      { href: "/dashboard/defense-review", icon: ClipboardList, label: "Defense Reviews" },
      { href: "/dashboard/adapters", icon: Cpu, label: "Execution Adapters" },
      { href: "/dashboard/bridge-monitor", icon: Activity, label: "Bridge Monitor" },
      { href: "/dashboard/oracle-monitor", icon: Eye, label: "Oracle Monitor" },
      { href: "/dashboard/audit", icon: ShieldCheck, label: "Verification & Audit" },
      { href: "/dashboard/reports", icon: LayoutDashboard, label: "Reports" },
      { href: "/dashboard/admin/accounts", icon: Building2, label: "Admin / Accounts", accountManagerOnly: true },
    ],
  },
  {
    heading: "SCE OPERATIONS",
    adminOnly: true,
    items: [
      { href: "/dashboard/red-team", icon: Zap, label: "Red Team" },
      { href: "/dashboard/blue-team", icon: Shield, label: "Blue Team" },
      { href: "/dashboard/black-ops", icon: EyeOff, label: "Black Ops" },
      { href: "/dashboard/settings", icon: Settings, label: "System Settings" },
    ],
  },
];

export function Sidebar({ me }: { me: SaasMeResponse }) {
  const pathname = usePathname();
  const visibleSections = navSections.filter((section) =>
    section.adminOnly ? me.permissions.canViewGlobalModules : true,
  );
  const canUseAdminAccounts = me.isPreviewingRole
    ? me.permissions.canManageAccounts
    : me.permissions.canManageAccount || me.permissions.canManageAccounts;
  const initials = me.user.name
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  return (
    <nav
      style={{
        width: 176,
        minWidth: 176,
        background: "#0b0d12",
        borderRight: "1px solid rgba(212,175,55,0.18)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        }}
      >
        {/* Logo */}
      <div
        style={{
          padding: "15px 14px",
          borderBottom: "1px solid rgba(212,175,55,0.12)",
          alignItems: "center",
          gap: 10,
          margin: "auto",
        }}
      >
        <Link href="/">
          <Image src="/logo.png" alt="Sagitta Continuity Engine" width={100} height={100} priority />
        </Link>
        <div style={{
          flexDirection: "column",
          alignItems: "center",
          display: "flex",
          lineHeight: 1.15,
          paddingTop: "10px"
        }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#D4AF37",
              lineHeight: 1.2,
            }}
          >
            SAGITTA
          </div>
          <div
            style={{
              fontSize: 8,
              letterSpacing: "0.18em",
              color: "rgba(212,175,55,0.55)",
              lineHeight: 1,
              marginTop: 1,
            }}
          >
            CONTINUITY ENGINE
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {visibleSections.map((section) => (
          <div key={section.heading} style={{ paddingTop: 8 }}>
            <div
              style={{
                padding: "0 14px 6px",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.16em",
                color: "rgba(212,175,55,0.54)",
              }}
            >
              {section.heading}
            </div>
            {section.items.filter((item) => !item.accountManagerOnly || canUseAdminAccounts).map(({ href, icon: Icon, label }) => {
              const isActive =
                pathname === href ||
                (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 14px",
                    textDecoration: "none",
                    background: isActive
                      ? "rgba(90,65,180,0.22)"
                      : "transparent",
                    borderLeft: isActive
                      ? "2px solid #D4AF37"
                      : "2px solid transparent",
                    marginBottom: 1,
                    transition: "background 0.15s",
                  }}
                >
                  <Icon
                    size={13}
                    style={{
                      color: isActive ? "#D4AF37" : "rgba(140,140,170,0.65)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11.5,
                      color: isActive
                        ? "#D4AF37"
                        : "rgba(170,170,200,0.65)",
                      fontWeight: isActive ? 600 : 400,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* System time */}
      <div
        style={{
          borderTop: "1px solid rgba(212,175,55,0.12)",
          padding: "10px 14px",
          flexShrink: 0,
          background: "rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            fontSize: 8.5,
            letterSpacing: "0.14em",
            color: "rgba(212,175,55,0.5)",
            marginBottom: 3,
          }}
        >
          SYSTEM TIME
        </div>
        <div
          style={{
            fontSize: 10,
            color: "rgba(212,175,55,0.75)",
            fontFamily: "monospace",
          }}
        >
          {new Date().toISOString().replace("T", " ").slice(0, 19)} UTC
        </div>
        {/* Waveform decoration */}
        <svg viewBox="0 0 148 14" style={{ width: "100%", height: 10, marginTop: 6 }}>
          <path
            d="M0,7 L10,7 L14,3 L18,11 L22,3 L26,11 L30,7 L38,7 L42,5 L46,9 L50,5 L54,9 L58,7 L68,7 L72,4 L76,10 L80,4 L84,10 L88,7 L96,7 L100,5 L104,9 L108,5 L112,9 L116,7 L124,7 L128,4 L132,10 L136,6 L140,8 L148,7"
            fill="none"
            stroke="rgba(212,175,55,0.35)"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* User */}
      <div
        style={{
          borderTop: "1px solid rgba(212,175,55,0.12)",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 9,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(212,175,55,0.15)",
            border: "1px solid rgba(212,175,55,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            fontWeight: 700,
            color: "#D4AF37",
            flexShrink: 0,
          }}
        >
          {initials || "SC"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ fontSize: 11, color: "#E2E8F0", fontWeight: 600, whiteSpace: "nowrap" }}
          >
            {me.user.name}
          </div>
          <div style={{ fontSize: 9, color: "rgba(140,140,170,0.65)" }}>
            {me.activeAccount?.name ?? me.currentRole ?? "No account"}
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "transparent",
            border: "none",
            color: "rgba(140,140,170,0.75)",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <LogOut size={11} />
          <ChevronDown size={11} style={{ flexShrink: 0 }} />
        </button>
      </div>
    </nav>
  );
}
