"use client";

import { useEffect, useState } from "react";
import { fetchIncidentsOverview } from "@/lib/case-library/service";
import type { IncidentOverviewItem } from "@/lib/case-library/types";

const FALLBACK: string[] = [
  "Critical incident feed temporarily unavailable",
  "Live case feed reconnecting",
  "Case Library sync pending",
  "Review recent incidents in the Case Library",
];

const TITLE_MAX = 42;

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max).trimEnd() + "…" : s;
}

function formatTickerItem(item: IncidentOverviewItem): string {
  return `${truncate(item.title, TITLE_MAX)} — via ${item.source}`;
}

export default function TickerClient() {
  const [items, setItems] = useState<string[]>(FALLBACK);

  useEffect(() => {
    const controller = new AbortController();
    fetchIncidentsOverview(controller.signal)
      .then((data) => {
        const ticker = data.critical_ticker_items;
        if (ticker && ticker.length > 0) {
          setItems(ticker.map(formatTickerItem));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const doubled = [...items, ...items];

  return (
    <div
      className="ticker-bar"
      style={{
        position: "relative",
        zIndex: 2,
        flexShrink: 0,
        background: "#ffffff",
        borderTop: "1px solid #ef4444",
        borderBottom: "1px solid #ef4444",
        display: "flex",
        alignItems: "center",
        height: 48,
        overflow: "hidden",
      }}
    >
      {/* Label */}
      <div
        className="ticker-label"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "0 20px",
          flexShrink: 0,
          borderRight: "1px solid #e5e7eb",
          height: "100%",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#ef4444",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "0.1em",
            color: "#111827",
            whiteSpace: "nowrap",
          }}
        >
          RECENT CRITICAL INCIDENTS
        </span>
      </div>

      {/* Scrolling track */}
      <div className="ticker-scroll" style={{ flex: 1, overflow: "hidden" }}>
        <div className="ticker-track">
          {doubled.map((item, i) => (
            <span key={i} style={{ color: "#374151", fontSize: 13, fontWeight: 500, padding: "0 4px" }}>
              {item}
              <span style={{ color: "#ef4444", margin: "0 20px", fontWeight: 700 }}>•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Arrow */}
      <div
        className="ticker-arrow"
        style={{
          flexShrink: 0,
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 8px",
          color: "#374151",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
