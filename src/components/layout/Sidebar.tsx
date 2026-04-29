"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Crosshair,
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
  type LucideIcon,
} from "lucide-react";

const navItems: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/dashboard",                     icon: LayoutDashboard, label: "Command Overview" },
  { href: "/dashboard/situational",         icon: Crosshair,       label: "Situational Awareness" },
  { href: "/dashboard/doctrine",            icon: BookOpen,        label: "Doctrine Engine" },
  { href: "/dashboard/threat-matrix",       icon: Network,         label: "Threat Matrix" },
  { href: "/dashboard/incidents",           icon: AlertTriangle,   label: "Incidents" },
  { href: "/dashboard/case-library",        icon: FolderOpen,      label: "Case Library" },
  { href: "/dashboard/adapters",            icon: Cpu,             label: "Execution Adapters" },
  { href: "/dashboard/bridge-monitor",      icon: Activity,        label: "Bridge Monitor" },
  { href: "/dashboard/oracle-monitor",      icon: Eye,             label: "Oracle Monitor" },
  { href: "/dashboard/audit",               icon: ShieldCheck,     label: "Verification & Audit" },
  { href: "/dashboard/red-team",            icon: Zap,             label: "Red Team" },
  { href: "/dashboard/blue-team",           icon: Shield,          label: "Blue Team" },
  { href: "/dashboard/black-ops",           icon: EyeOff,          label: "Black Ops" },
  { href: "/dashboard/settings",            icon: Settings,        label: "System Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

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
        {navItems.map(({ href, icon: Icon, label }) => {
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
          2025-05-26 14:37:42 UTC
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
          AO
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ fontSize: 11, color: "#E2E8F0", fontWeight: 600, whiteSpace: "nowrap" }}
          >
            Aurelius Ops
          </div>
          <div style={{ fontSize: 9, color: "rgba(140,140,170,0.65)" }}>
            Administrator
          </div>
        </div>
        <ChevronDown size={11} style={{ color: "rgba(140,140,170,0.45)", flexShrink: 0 }} />
      </div>
    </nav>
  );
}
