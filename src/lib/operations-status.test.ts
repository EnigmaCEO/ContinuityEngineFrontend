import assert from "node:assert/strict";
import test from "node:test";

import { parseOperationsStatus } from "./operations-status.ts";


const now = new Date("2026-08-09T15:00:00.000Z");

function envelope(overrides: Record<string, unknown> = {}) {
  return {
    overall: "operational",
    generatedAt: now.toISOString(),
    lastSuccessfulRefreshAt: now.toISOString(),
    stale: false,
    cacheAgeSeconds: 0,
    components: [
      {
        id: "core_api",
        label: "Core API",
        state: "operational",
        checkedAt: now.toISOString(),
        latencyMs: 12,
        message: "Health contract confirmed.",
      },
    ],
    ...overrides,
  };
}

test("current validated evidence may remain operational", () => {
  assert.equal(parseOperationsStatus(envelope(), now)?.overall, "operational");
});

test("unknown evidence never becomes operational", () => {
  assert.equal(parseOperationsStatus(envelope({ overall: "unknown" }), now)?.overall, "unknown");
});

test("a stale all-clear is downgraded", () => {
  const parsed = parseOperationsStatus(envelope({ stale: true }), now);
  assert.equal(parsed?.overall, "degraded");
  assert.equal(parsed?.stale, true);
});

test("an expired snapshot becomes unknown", () => {
  const generatedAt = new Date(now.getTime() - 6 * 60 * 1000).toISOString();
  assert.equal(parseOperationsStatus(envelope({ generatedAt }), now)?.overall, "unknown");
});

test("malformed components reject the complete envelope", () => {
  assert.equal(parseOperationsStatus(envelope({ components: [{ id: "core_api" }] }), now), null);
});

test("duplicate component markers reject the complete envelope", () => {
  const duplicate = envelope().components[0];
  assert.equal(parseOperationsStatus(envelope({ components: [duplicate, duplicate] }), now), null);
});
