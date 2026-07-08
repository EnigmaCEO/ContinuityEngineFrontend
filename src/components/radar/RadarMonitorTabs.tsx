"use client";

import { useState } from "react";
import type { ReactNode } from "react";

export interface RadarMonitorTab {
  label: string;
  badge?: number | null;
  content: ReactNode;
}

export function RadarMonitorTabs({ tabs, defaultTab = 0 }: { tabs: RadarMonitorTab[]; defaultTab?: number }) {
  const [active, setActive] = useState(defaultTab);

  return (
    <div style={{ display: "grid", gap: 0 }}>
      <div
        style={{
          display: "flex",
          gap: 0,
          overflowX: "auto",
          borderBottom: "1px solid rgba(148,163,184,0.12)",
        }}
      >
        {tabs.map((tab, index) => {
          const isActive = index === active;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActive(index)}
              style={{
                flexShrink: 0,
                fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                padding: "9px 14px",
                border: "none",
                borderBottom: isActive ? "2px solid #D4AF37" : "2px solid transparent",
                background: "transparent",
                color: isActive ? "#F5E7A1" : "rgba(148,163,184,0.6)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                letterSpacing: "0.04em",
                transition: "color 0.12s",
              }}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 ? (
                <span
                  style={{
                    marginLeft: 5,
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: 9,
                    background: isActive ? "rgba(212,175,55,0.2)" : "rgba(148,163,184,0.14)",
                    color: isActive ? "#D4AF37" : "rgba(148,163,184,0.7)",
                  }}
                >
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tabs.map((tab, index) => (
        <div
          key={tab.label}
          style={{ display: index === active ? "grid" : "none", gap: 16, paddingTop: 16 }}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
