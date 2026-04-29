"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { login } from "@/lib/saas/service";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email);
      const nextPath = new URLSearchParams(window.location.search).get("next") || "/dashboard";
      router.push(nextPath);
    } catch {
      setError("Login failed. This v1 flow only works for seeded or approved users.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background:
          "radial-gradient(circle at top, rgba(59,130,246,0.14), transparent 28%), #080a0e",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 460,
          background: "rgba(10,12,18,0.94)",
          border: "1px solid rgba(212,175,55,0.14)",
          borderRadius: 18,
          padding: 28,
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "rgba(212,175,55,0.72)" }}>
          LOGIN
        </div>
        <h1 style={{ margin: "10px 0 8px", fontSize: 34, color: "#E2E8F0" }}>SCE Portal Access</h1>
        <p style={{ margin: "0 0 20px", color: "rgba(203,213,225,0.74)", lineHeight: 1.6 }}>
          Dev placeholder login only. Enter the email of a bootstrap or approved user. This is not
          production authentication.
        </p>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#CBD5E1" }}>Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            placeholder="admin@example.com"
            style={{
              borderRadius: 12,
              border: "1px solid rgba(148,163,184,0.2)",
              background: "rgba(15,23,42,0.74)",
              color: "#E2E8F0",
              padding: "12px 14px",
            }}
          />
        </label>
        {error && (
          <div
            style={{
              marginTop: 14,
              borderRadius: 10,
              background: "rgba(127,29,29,0.45)",
              border: "1px solid rgba(248,113,113,0.35)",
              color: "#FECACA",
              padding: "10px 12px",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
        <button
          disabled={submitting}
          type="submit"
          style={{
            marginTop: 18,
            width: "100%",
            border: "none",
            borderRadius: 12,
            background: submitting ? "rgba(212,175,55,0.6)" : "#D4AF37",
            color: "#111827",
            padding: "12px 14px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {submitting ? "Signing In..." : "Login"}
        </button>
        <div style={{ marginTop: 14, fontSize: 13, color: "rgba(148,163,184,0.78)" }}>
          Need access?{" "}
          <Link href="/request-access" style={{ color: "#F5E7A1" }}>
            Submit a request
          </Link>
        </div>
      </form>
    </main>
  );
}
