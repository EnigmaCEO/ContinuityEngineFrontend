"use client";

import { useState } from "react";
import Link from "next/link";

import { requestAccess } from "@/lib/saas/service";

export default function RequestAccessPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      await requestAccess({
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
        organization: String(formData.get("organization") || ""),
        roleTitle: String(formData.get("roleTitle") || ""),
        useCase: String(formData.get("useCase") || ""),
      });
      setSubmitted(true);
    } catch {
      setError("Request submission failed.");
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
          "radial-gradient(circle at top, rgba(34,197,94,0.14), transparent 28%), #080a0e",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "rgba(10,12,18,0.94)",
          border: "1px solid rgba(212,175,55,0.14)",
          borderRadius: 18,
          padding: 28,
        }}
      >
        {submitted ? (
          <>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#86EFAC" }}>REQUEST SENT</div>
            <h1 style={{ margin: "10px 0 8px", fontSize: 34, color: "#E2E8F0" }}>
              Access request received
            </h1>
            <p style={{ margin: "0 0 18px", color: "rgba(203,213,225,0.76)", lineHeight: 1.6 }}>
              An SCE operator can now review this request from the Admin / Accounts page.
            </p>
            <Link href="/login" style={{ color: "#F5E7A1" }}>
              Return to login
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "rgba(212,175,55,0.72)" }}>
                REQUEST ACCESS
              </div>
              <h1 style={{ margin: "10px 0 8px", fontSize: 34, color: "#E2E8F0" }}>Join the SCE portal</h1>
              <p style={{ margin: 0, color: "rgba(203,213,225,0.74)", lineHeight: 1.6 }}>
                Submit the account details an operator needs to approve and provision your access.
              </p>
            </div>
            <Field label="Name" name="name" required />
            <Field label="Email" name="email" type="email" required />
            <Field label="Organization" name="organization" required />
            <Field label="Role / Title" name="roleTitle" />
            <Field label="Use Case" name="useCase" multiline />
            {error && (
              <div
                style={{
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
                border: "none",
                borderRadius: 12,
                background: submitting ? "rgba(212,175,55,0.6)" : "#D4AF37",
                color: "#111827",
                padding: "12px 14px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  multiline = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  const style: React.CSSProperties = {
    width: "100%",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.2)",
    background: "rgba(15,23,42,0.74)",
    color: "#E2E8F0",
    padding: "12px 14px",
  };

  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ fontSize: 12, color: "#CBD5E1" }}>{label}</span>
      {multiline ? (
        <textarea name={name} rows={4} style={style} />
      ) : (
        <input name={name} type={type} required={required} style={style} />
      )}
    </label>
  );
}
