#!/usr/bin/env node
/**
 * Global Intelligence vocabulary lint.
 *
 * Enforces docs/global-intelligence/VOCABULARY.md.  Each rule carries its own
 * scope, because the same word is legitimate in different places:
 *
 *   - "incident" is correct on the status page (service uptime), in resource names
 *     ("Incident Readiness"), and as a threat family ("DeFi Protocol Incident").
 *     It is wrong only when it labels the advisory corpus.
 *   - "Coverage" is correct on Radar and Project Map, which have their own coverage
 *     metrics.  It is ambiguous only on Global Intelligence, where five different
 *     metrics were all called that.
 *
 * The rules therefore target the specific collisions, not every use of a word.
 *
 * Run: npm run verify:vocab
 */
import { readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { glob } from "node:fs/promises";

const WEB_ROOT = join(import.meta.dirname, "..");

// Surfaces the Global Intelligence vocabulary governs.
const GI_SCOPE = [
  "src/app/dashboard/page.tsx",
  "src/app/dashboard/advisories/**/*.{ts,tsx}",
  "src/app/dashboard/case-library/**/*.{ts,tsx}",
  "src/app/dashboard/doctrine/**/*.{ts,tsx}",
  "src/app/dashboard/threat-matrix/**/*.{ts,tsx}",
  "src/app/dashboard/cve-intelligence/**/*.{ts,tsx}",
  "src/components/case-library/**/*.{ts,tsx}",
  "src/lib/case-library/**/*.{ts,tsx}",
  "src/lib/cve-intelligence/**/*.{ts,tsx}",
  "src/lib/dashboard/**/*.{ts,tsx}",
];

// Anywhere in the app — these are unambiguous regardless of surface.
const APP_SCOPE = ["src/**/*.{ts,tsx}"];

const ALLOWED = [
  "DeFi Protocol Incident",
  "incident_report",
  "incident_source",
  "defi_incident",
  "incidentReport",
];

const RULES = [
  {
    id: "corpus-route",
    scope: APP_SCOPE,
    pattern: /\/dashboard\/incidents\b/,
    message: 'Route is /dashboard/advisories (VOCABULARY.md §1).',
  },
  {
    id: "corpus-api-symbol",
    scope: APP_SCOPE,
    pattern:
      /\b(total_incidents|critical_incidents|high_incidents|medium_incidents|low_incidents|recent_incidents|incidents_awaiting_replay|replay_validated_incidents|incidents_with_response_coverage|IncidentsOverviewResponse|IncidentOverviewItem|fetchIncidentsOverview)\b/,
    message:
      "Advisory API symbols use the advisory vocabulary — total_advisories, " +
      "recent_advisories, AdvisoriesOverviewResponse (VOCABULARY.md §1).",
  },
  {
    id: "corpus-label",
    scope: APP_SCOPE,
    // A user-visible label naming the corpus.
    pattern:
      /(["'>]\s*(INCIDENTS?|Incidents?)\s*["'<])|(\b(Incident|INCIDENT)\s+(Queue|Center|Timeline|Record|Detail|ID|Intelligence)\b)|(\bOPEN INCIDENTS\b)|(\bTOTAL INCIDENTS\b)/,
    message:
      'Corpus records are "advisories". "Incident" is reserved for the continuity ' +
      "operating state (VOCABULARY.md §1).",
  },
  {
    id: "black-ops",
    scope: APP_SCOPE,
    pattern: /Black[\s_-]*Ops/i,
    message: 'Published doctrine says "Black Team", not "Black Ops" (VOCABULARY.md §5).',
  },
  {
    id: "fake-lane-owner",
    scope: APP_SCOPE,
    pattern: /\b(owner|Owner|OWNER)\s*[:=]\s*["'](Security Team|Doctrine Team)["']/,
    message:
      "Not a doctrine lane. Owners must be White/Red/Blue/Black Team, or " +
      '"Unassigned" (VOCABULARY.md §5).',
  },
  {
    id: "bare-coverage-label",
    scope: GI_SCOPE,
    pattern: /["'>]\s*(Coverage|COVERAGE)\s*["'<]/,
    message:
      'Bare "Coverage" resolves to five different metrics on this surface. Use a ' +
      "qualified name: doctrine binding / validation coverage / response readiness / " +
      "source coverage (VOCABULARY.md §4).",
  },
];

function stripAllowed(line) {
  let out = line;
  for (const term of ALLOWED) out = out.split(term).join("");
  return out;
}

async function expand(patterns) {
  const out = new Set();
  for (const p of patterns) {
    for await (const f of glob(p, { cwd: WEB_ROOT })) out.add(f);
  }
  return out;
}

const violations = [];
const checked = new Set();

for (const rule of RULES) {
  const files = await expand(rule.scope);
  for (const file of files) {
    checked.add(file);
    const abs = join(WEB_ROOT, file);
    const lines = readFileSync(abs, "utf8").split(/\r?\n/);
    lines.forEach((raw, i) => {
      if (rule.pattern.test(stripAllowed(raw))) {
        violations.push({
          file: relative(WEB_ROOT, abs).split(sep).join("/"),
          line: i + 1,
          rule: rule.id,
          message: rule.message,
          text: raw.trim().slice(0, 110),
        });
      }
    });
  }
}

if (violations.length === 0) {
  console.log(`vocabulary: OK (${checked.size} files checked)`);
  process.exit(0);
}

violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
console.error(`vocabulary: ${violations.length} violation(s)\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  [${v.rule}]`);
  console.error(`    ${v.text}`);
  console.error(`    → ${v.message}\n`);
}
console.error("See docs/global-intelligence/VOCABULARY.md");
process.exit(1);
