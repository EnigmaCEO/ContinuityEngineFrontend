import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import test from "node:test";


function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

async function freePort() {
  const server = createServer();
  const port = await listen(server);
  await close(server);
  return port;
}

function envelope(overall) {
  const now = new Date().toISOString();
  return {
    overall,
    generatedAt: now,
    lastSuccessfulRefreshAt: now,
    stale: false,
    cacheAgeSeconds: 0,
    components: [
      {
        id: "core_api",
        label: "Core API",
        state: overall === "unknown" ? "unknown" : "degraded",
        checkedAt: now,
        latencyMs: 8,
        message: overall === "unknown" ? "Current status could not be verified." : "Service configuration requires attention.",
      },
    ],
  };
}

async function waitForPage(url, child) {
  let lastError;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Next server exited with code ${child.exitCode}.`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return response.text();
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw lastError ?? new Error("Status page did not start.");
}

test("rendered page markers and copy follow live status evidence", { timeout: 45_000 }, async () => {
  let currentOverall = "degraded";
  const api = createServer((request, response) => {
    if (request.url === "/operations/status") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(envelope(currentOverall)));
      return;
    }
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ detail: "Not found" }));
  });
  const apiPort = await listen(api);
  const webPort = await freePort();
  const nextBin = new URL("../node_modules/next/dist/bin/next", import.meta.url).pathname.replace(/^\/(.:\/)/, "$1");
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(webPort)], {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env,
      API_URL: `http://127.0.0.1:${apiPort}`,
      SCE_SITE_ORIGIN: `http://127.0.0.1:${webPort}`,
    },
    stdio: "ignore",
  });

  try {
    const url = `http://127.0.0.1:${webPort}/status`;
    const degradedHtml = await waitForPage(url, child);
    assert.match(degradedHtml, /<main data-overall-status="degraded" data-status-stale="false"/);
    assert.equal((degradedHtml.match(/<main data-overall-status=/g) ?? []).length, 1);
    assert.match(degradedHtml, /SCE is operating with reduced readiness or stale dependency data\./);
    assert.match(degradedHtml, /data-component-status="degraded"/);

    currentOverall = "unknown";
    const unknownResponse = await fetch(url, { cache: "no-store" });
    const unknownHtml = await unknownResponse.text();
    assert.match(unknownHtml, /<main data-overall-status="unknown" data-status-stale="false"/);
    assert.match(unknownHtml, /Current SCE status could not be verified\./);
    assert.doesNotMatch(unknownHtml, /<h1[^>]*>\s*Operational\s*<\/h1>/);
  } finally {
    child.kill();
    await close(api);
  }
});

