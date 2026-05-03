"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const PURPLE = "#8B5CF6";
const TEXT = "#E2E8F0";
const TEXT_MUTED = "rgba(203,213,225,0.72)";

const NAV_LINKS = [
  { label: "Overview",            href: "#overview",           id: "overview" },
  { label: "Continuity Mandate",  href: "#continuity-mandate", id: "continuity-mandate" },
  { label: "How SCE Works",       href: "#how-sce-works",      id: "how-sce-works" },
  { label: "Defense Review",      href: "#first-service-door", id: "first-service-door" },
];

const SECTION_IDS = NAV_LINKS.map((l) => l.id);

export default function NavBar() {
  const [activeId, setActiveId] = useState("overview");

  useEffect(() => {
    const onScroll = () => {
      // Walk sections top-to-bottom; the last one whose top is at or above
      // the midpoint of the viewport (accounting for nav) wins.
      const mid = window.scrollY + window.innerHeight * 0.35;
      let current = SECTION_IDS[0];
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= mid) current = id;
      }
      setActiveId(current);
    };

    onScroll(); // set initial state before first scroll
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="nav-bar" style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: "rgba(8,10,14,0.96)",
      backdropFilter: "blur(16px)",
      padding: "0 40px",
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center",
      height: 96,
    }}>
      {/* Wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="nav-logo-img"
          src="/logo.png"
          alt="Sagitta Continuity Engine"
          style={{ height: 150, width: "auto", display: "block" }}
        />
        <div className="nav-wordmark-text" style={{ lineHeight: 1, top: -20, position: "relative" }}>
          <div className="nav-wordmark-name" style={{ fontSize: 36, fontWeight: 500, letterSpacing: "0.07em", color: TEXT }}>
            SAGITTA
          </div>
          <div className="nav-wordmark-sub" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.22em", color: PURPLE, marginTop: 5 }}>
            CONTINUITY ENGINE
          </div>
        </div>
      </div>

      {/* Nav links */}
      <div className="nav-links" style={{ display: "flex", alignItems: "center", marginTop: -20 }}>
        {NAV_LINKS.map((l) => {
          const isActive = activeId === l.id;
          return (
            <a key={l.label} href={l.href} style={{
              padding: "6px 14px",
              color: isActive ? TEXT : TEXT_MUTED,
              textDecoration: "none",
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              borderBottom: isActive ? `2px solid ${PURPLE}` : "2px solid transparent",
              whiteSpace: "nowrap",
              transition: "color 0.15s, border-color 0.15s",
            }}>
              {l.label}
            </a>
          );
        })}
      </div>

      {/* Portal Login */}
      <div className="nav-portal-wrapper" style={{ display: "flex", justifyContent: "flex-end", marginTop: -20 }}>
        <Link href="/login" style={{
          padding: "8px 18px",
          borderRadius: 8,
          border: "1px solid rgba(139,92,246,0.7)",
          background: "rgba(139,92,246,0.1)",
          color: PURPLE,
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 8,
          top: -20,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Portal Login
        </Link>
      </div>
    </nav>
  );
}
