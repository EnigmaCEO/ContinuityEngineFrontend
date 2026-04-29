import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(212,175,55,0.18), transparent 32%), linear-gradient(180deg, #0b0d12 0%, #080a0e 100%)",
        color: "#E2E8F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 860,
          width: "100%",
          border: "1px solid rgba(212,175,55,0.16)",
          background: "rgba(10,12,18,0.9)",
          borderRadius: 20,
          padding: "40px 36px",
          display: "grid",
          gap: 24,
        }}
      >
        <div>
          <div style={{ fontSize: 12, letterSpacing: "0.24em", color: "rgba(212,175,55,0.72)" }}>
            SAGITTA CONTINUITY ENGINE
          </div>
          <h1 style={{ margin: "14px 0 10px", fontSize: 52, lineHeight: 1.05 }}>
            Account-aware continuity intelligence for protocol operators and clients.
          </h1>
          <p style={{ margin: 0, maxWidth: 620, color: "rgba(203,213,225,0.78)", lineHeight: 1.7 }}>
            SCE v1 now exposes a public entry shell, access-request intake, and role-gated portal
            access without expanding into a full marketing site yet.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="/request-access"
            style={{
              padding: "12px 18px",
              borderRadius: 999,
              background: "#D4AF37",
              color: "#111827",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Request Access
          </Link>
          <Link
            href="/login"
            style={{
              padding: "12px 18px",
              borderRadius: 999,
              border: "1px solid rgba(212,175,55,0.26)",
              color: "#F5E7A1",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}
