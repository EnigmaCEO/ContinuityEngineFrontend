import path from "path";
import React from "react";
import { type NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { DefenseReviewDocument, type DefenseReviewReportData } from "@/lib/defense-review/pdf/document";
import type { DefenseReview } from "@/lib/defense-review/types";
import type {
  AdminSurfaceFinding,
  Project,
  ProjectAsset,
  ProjectControl,
  ProjectRelevance,
} from "@/lib/project-map/types";

const API_BASE = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function serverFetch<T>(endpoint: string, token: string | null): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-SCE-Session": token } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`[${res.status}] ${text || endpoint}`);
  }
  return res.json() as Promise<T>;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = req.headers.get("x-sce-session");

  let review: DefenseReview;
  try {
    review = await serverFetch<DefenseReview>(`/defense-reviews/${id}`, token);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Review not found" },
      { status: 404 },
    );
  }

  const pid = review.projectId;

  const [projectResult, assetsResult, findingsResult, controlsResult, relevanceResult] =
    await Promise.allSettled([
      serverFetch<Project>(`/projects/${pid}`, token),
      serverFetch<{ items: ProjectAsset[] }>(`/projects/${pid}/assets?limit=100`, token),
      serverFetch<{ items: AdminSurfaceFinding[] }>(
        `/projects/${pid}/admin-surface-findings?limit=100`,
        token,
      ),
      serverFetch<{ items: ProjectControl[] }>(`/projects/${pid}/controls?limit=100`, token),
      serverFetch<ProjectRelevance>(`/projects/${pid}/relevance`, token),
    ]);

  const logoPath = path.join(process.cwd(), "public", "logo.png");

  const data: DefenseReviewReportData = {
    review,
    project: projectResult.status === "fulfilled" ? projectResult.value : null,
    assets:
      assetsResult.status === "fulfilled" ? assetsResult.value.items : [],
    findings:
      findingsResult.status === "fulfilled"
        ? findingsResult.value.items.filter((f) => f.status === "open")
        : [],
    controls:
      controlsResult.status === "fulfilled" ? controlsResult.value.items : [],
    relevance:
      relevanceResult.status === "fulfilled" ? relevanceResult.value : null,
    logoPath,
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(React.createElement(DefenseReviewDocument, { data }) as any);
    const bytes = new Uint8Array(buffer);

    const safeName = review.projectName.replace(/[^a-zA-Z0-9-_]/g, "-");
    const filename = `SCE-Defense-Review-${safeName}-${id}.pdf`;

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch (err) {
    console.error("[pdf/route] renderToBuffer failed:", err);
    return NextResponse.json(
      { error: "PDF generation failed. Check server logs." },
      { status: 500 },
    );
  }
}
