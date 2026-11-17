import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const TITLE = "The Authority Gap";
const SUBTITLE =
  "How crypto losses enter, why containment fails, and what public incident data cannot yet tell us";
const DESCRIPTION =
  "SCE Authority Report, Q4 2026: across 4,139 public crypto incidents, 94.8% of classified losses entered through privileged access, signing, or admin authority rather than code bugs.";

export const metadata: Metadata = {
  title: `Research Note 001: ${TITLE} | Sagitta Continuity Engine`,
  description: DESCRIPTION,
  alternates: { canonical: "https://sce.sagitta.systems/research/note-001" },
  openGraph: {
    title: `Research Note 001: ${TITLE}`,
    description: DESCRIPTION,
    url: "https://sce.sagitta.systems/research/note-001",
    type: "article",
    publishedTime: "2026-11-17",
  },
};

const BG = "#080a0e";
const TEXT = "#E2E8F0";
const TEXT_MUTED = "rgba(203,213,225,0.78)";
const TEXT_FAINT = "rgba(148,163,184,0.62)";
const PURPLE = "#8B5CF6";
const PURPLE_FAINT = "rgba(139,92,246,0.18)";
const GOLD = "#D4AF37";
const BORDER = "rgba(212,175,55,0.14)";

/**
 * The note body is the markdown in content/research/note-001.md, read at build
 * time. Its first heading and subtitle are rendered in the hero instead.
 */
function loadBody(): string {
  const file = path.join(process.cwd(), "content", "research", "note-001.md");
  const source = readFileSync(file, "utf-8");
  const lines = source.split(/\r?\n/);
  const firstRule = lines.findIndex((line, index) => index > 0 && line.startsWith("*Sagitta Continuity Engine"));
  return lines.slice(firstRule >= 0 ? firstRule + 1 : 0).join("\n");
}

const components: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h2: ({ children }) => (
    <h2 style={{ margin: "56px 0 16px", fontSize: "clamp(22px, 2.6vw, 28px)", fontWeight: 800, color: TEXT, lineHeight: 1.3 }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ margin: "32px 0 12px", fontSize: 18, fontWeight: 750, color: TEXT }}>{children}</h3>
  ),
  p: ({ children }) => (
    <p style={{ margin: "0 0 16px", fontSize: 16, lineHeight: 1.75, color: TEXT_MUTED }}>{children}</p>
  ),
  strong: ({ children }) => <strong style={{ color: TEXT, fontWeight: 700 }}>{children}</strong>,
  a: ({ href, children }) => {
    const external = Boolean(href && /^https?:/.test(href));
    return (
      <a
        href={href}
        style={{ color: PURPLE, textDecoration: "underline", textUnderlineOffset: 3 }}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
  ul: ({ children }) => (
    <ul style={{ margin: "0 0 20px", paddingLeft: 22, color: TEXT_MUTED, fontSize: 16, lineHeight: 1.75 }}>{children}</ul>
  ),
  li: ({ children }) => <li style={{ marginBottom: 8 }}>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote
      style={{
        margin: "20px 0",
        padding: "12px 18px",
        borderLeft: `3px solid ${GOLD}`,
        background: "rgba(212,175,55,0.05)",
        fontStyle: "italic",
      }}
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr style={{ border: 0, borderTop: `1px solid ${BORDER}`, margin: "48px 0" }} />,
  table: ({ children }) => (
    <div style={{ overflowX: "auto", margin: "8px 0 24px", border: `1px solid ${BORDER}`, borderRadius: 8 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 560 }}>{children}</table>
    </div>
  ),
  th: ({ children, style }) => (
    <th
      style={{
        ...style,
        padding: "10px 12px",
        borderBottom: `1px solid ${BORDER}`,
        color: TEXT,
        fontWeight: 700,
        textAlign: style?.textAlign ?? "left",
        background: "rgba(139,92,246,0.06)",
      }}
    >
      {children}
    </th>
  ),
  td: ({ children, style }) => (
    <td
      style={{
        ...style,
        padding: "10px 12px",
        borderBottom: `1px solid rgba(212,175,55,0.08)`,
        color: TEXT_MUTED,
        verticalAlign: "top",
        textAlign: style?.textAlign ?? "left",
      }}
    >
      {children}
    </td>
  ),
  em: ({ children }) => <em style={{ color: TEXT_FAINT }}>{children}</em>,
};

export default function ResearchNote001() {
  const body = loadBody();

  return (
    <div style={{ background: BG, color: TEXT, minHeight: "100vh", fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
      <header
        style={{
          padding: "72px max(24px, 5vw) 48px",
          borderBottom: `1px solid ${BORDER}`,
          background: "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(8,10,14,0) 48%)",
        }}
      >
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <Link href="/research" style={{ fontSize: 12, color: TEXT_FAINT, textDecoration: "none" }}>
            ← Research
          </Link>
          <div
            style={{
              margin: "24px 0 12px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: GOLD,
            }}
          >
            Research Note 001 · Authority Report · Q4 2026
          </div>
          <h1 style={{ margin: "0 0 14px", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 850, lineHeight: 1.1 }}>
            {TITLE}
          </h1>
          <p style={{ margin: "0 0 18px", fontSize: 18, lineHeight: 1.55, color: TEXT_MUTED }}>{SUBTITLE}</p>
          <p style={{ margin: 0, fontSize: 13, color: TEXT_FAINT }}>
            Sagitta Continuity Engine · Published <time dateTime="2026-11-17">17 November 2026</time> · Data as of
            17 November 2026
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 780, margin: "0 auto", padding: "8px max(24px, 4vw) 96px" }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {body}
        </ReactMarkdown>

        <div
          style={{
            marginTop: 56,
            padding: 24,
            borderRadius: 8,
            border: `1px solid ${PURPLE_FAINT}`,
            background: "rgba(139,92,246,0.05)",
          }}
        >
          <p style={{ margin: "0 0 12px", fontSize: 15, color: TEXT, fontWeight: 700 }}>
            Where does your protocol&apos;s authority sit?
          </p>
          <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.65, color: TEXT_MUTED }}>
            A Sagitta Defense Review maps owner, admin, proxy, and pause authority across your public surface, using
            public data only.
          </p>
          <a
            href="https://defense.sagitta.systems"
            style={{ color: PURPLE, fontWeight: 700, fontSize: 14, textDecoration: "none" }}
          >
            Request a Defense Review →
          </a>
        </div>
      </main>
    </div>
  );
}
