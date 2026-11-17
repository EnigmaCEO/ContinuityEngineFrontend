## The Authority Gap

**How crypto losses enter, why containment fails, and what public incident data cannot yet tell us**

*Sagitta Continuity Engine · Authority Report · Q4 2026 · Data as of 17 November 2026*

Most loss reports ask how much was stolen and from where. This one asks a different question: **who held the authority that let the loss happen, and who held the authority that could have stopped it.**

We read 4,139 public crypto incident records, from June 2011 to November 2026, through that lens. The answer is consistent across every period we tested.

### Key findings

- **Authority paths, not code bugs, account for 94.8% of classified losses.** Of $33.55B in losses with a classified cause, $31.79B entered through privileged access, signing, or admin authority: either compromised from outside or used by insiders. Code and logic exploits account for $1.76B (5.2%).
- **The finding holds in every window.** Authority paths carry 92.4% of classified losses in 2020–2022, 94.4% in 2023–2026, and 98.1% in the last twelve months. Excluding the single largest record, the range is 89.5%–93.5%.
- **The entry point has moved.** In 2020–2022, insiders using their own authority (rugpulls) drove 74.9% of classified losses. In 2023–2026, external compromise of privileged keys and roles drove 92.7% (86.3% excluding the largest record).
- **A privileged-access incident costs 3.5 times as much as a code exploit.** The median Access Control incident lost $2.37M. The median code or logic exploit lost $678K.
- **For 80.6% of incidents, the authority that could contain the loss was the authority causing it.** In 3,335 of 4,139 records, the loss came from an insider using privileged authority or from an outsider who had taken it. A pause controlled by that same authority is not a containment control.
- **Code-bug losses come back. Authority losses mostly do not.** Code and logic exploits saw 17.1% of lost value returned. External privileged compromise saw 5.1%. Insider authority abuse saw 0.6%.

---

## 1. How losses entered

The Case Library holds 18,375 records from five public sources. Crypto-native losses come from De.Fi's REKT database: 4,139 incidents, 1,860 with a recorded loss. Each incident carries De.Fi's own category. We group those categories by the path the loss took:

| Path | De.Fi categories | Incidents with loss | Recorded loss | Share of classified loss | Median loss |
|---|---|---:|---:|---:|---:|
| **External privileged compromise**: an outsider obtains keys, admin roles, or signatures | Access Control, Phishing | 353 | $15.72B | 46.9% | $2.14M |
| **Insider authority abuse**: the holder of privileged authority uses it against users | Rugpull, Honeypot, Abandoned | 739 | $16.06B | 47.9% | $112K |
| **Code and logic exploits**: the contract does something its authors did not intend | Flash Loan Attack, Reentrancy, Oracle Issue | 221 | $1.76B | 5.2% | $678K |
| *Unclassified*: De.Fi category "Other" | Other | 546 | $25.21B | *excluded* | $818K |

*Totals exclude Terra Classic ($40B, "Other"). Shares are of the $33.55B with a classified cause.*

**By count, the split is narrower but points the same way.** Authority paths account for 83.2% of incidents with a recorded loss, and code exploits for 16.8%. Code exploits are common. They are rarely where the largest losses occur.

### The finding across time

| Window | Authority paths | of which external compromise | of which insider abuse | Code and logic |
|---|---:|---:|---:|---:|
| 2020–2022 | 92.4% | 17.6% | 74.9% | 7.6% |
| 2023–2026 | 94.4% | 92.7% | 1.7% | 5.6% |
| 2023–2026, excluding largest record | 89.5% | 86.3% | 3.3% | 10.5% |
| Last 12 months | 98.1% | 98.0% | 0.1% | 1.9% |
| Last 12 months, excluding largest record | 91.3% | 91.0% | 0.2% | 8.7% |
| All years | 94.8% | 46.9% | 47.9% | 5.2% |
| All years, excluding largest record | 93.5% | 34.6% | 59.0% | 6.5% |

*Share of classified loss in each window. "Largest record" is the $6.3B Access Control incident dated 29 October 2026.*

The 2021–2022 cycle was dominated by teams that held authority over their own contracts and used it to exit. The 2023–2026 period is dominated by attackers who obtain that authority: compromised signing keys, hijacked admin roles, and phished approvals. Either way, the loss travels through a privileged path rather than a flaw in contract logic.

**What this means for defense:** an audit examines code. More than nine dollars in ten lost with a known cause went through a path no code audit is designed to examine.

---

## 2. Where containment authority sat

The question a protocol faces in an incident is not only "what went wrong" but "**who can act, and can they act in time?**" The usual containment tool is a pause: freezing a contract, a bridge route, or a set of withdrawals.

Public incident records do not state whether a usable pause existed. De.Fi does not record it, and neither does any other source in the Case Library. That is a gap in public data, and it is one this series intends to close. But the categories still tell us something important about where the authority to pause sat.

**Insider authority abuse: 2,981 records (72.0% of all incidents).** Honeypots (1,893), rugpulls (1,069), and abandoned projects (19). The party holding privileged authority over the contracts is the party that caused the loss. Any pause, freeze, or upgrade power held by that party is in the wrong hands by definition.

**External privileged compromise: 354 records (8.6%).** The attacker obtained the authority path itself: an admin key, a signer, an approval. Unless the authority to pause is held separately from the authority that was compromised, it is compromised along with it.

**Together: 3,335 of 4,139 incidents (80.6%)**, in which the authority that would trigger containment was either the cause of the loss or captured by it. In those cases the question is not whether a pause existed. It is whether anyone *other than* the compromised authority could use it.

**Code and logic exploits: 221 records.** Here containment authority is not compromised. It may simply not exist. SCE's doctrine engine maps all 221 to a pause-type containment control: an emergency pause, a route pause, or a price-deviation circuit breaker. Across the corpus, 676 incidents map to a pause-type control, carrying $59.07B in recorded losses. Whether those controls existed at the time of each incident is not public. The worked case below shows one where it did not.

> *These figures are inferences from category definitions, not observations of individual contracts. "Insider authority abuse" means De.Fi recorded the incident as a rugpull, honeypot, or abandonment. It does not mean Sagitta has examined that project's contracts.*

---

## 3. How recovery went

The question this series ultimately wants to answer is **how long recovery takes**: the time from the moment an incident is declared to the moment normal operations are restored. SCE measures that as a sequence of continuity modes: Warning, Incident, Recovery, Normal.

**Public incident records do not contain the timestamps needed to measure it.** They record when an incident happened, not when containment began, when recovery started, or when normal operation was restored. We are not going to estimate durations the data does not support. Future editions will report them for incidents where the timeline can be established from public, dated evidence.

What public records do contain is **whether funds came back**:

| Path | Lost | Returned | Share returned | Incidents with any return |
|---|---:|---:|---:|---:|
| Code and logic exploits | $1.76B | $301.1M | **17.1%** | 22 of 221 (10.0%) |
| ‑ Reentrancy | $225M | $90.3M | 40.1% | |
| ‑ Flash Loan Attack | $1.01B | $208.2M | 20.7% | |
| ‑ Oracle Issue | $528M | $2.5M | 0.5% | |
| External privileged compromise | $15.72B | $797.4M | **5.1%** | 30 of 353 (8.5%) |
| Insider authority abuse | $16.06B | $96.5M | **0.6%** | 6 of 739 (0.8%) |

When a loss comes from a code bug, the protocol usually still controls its own authority. It can negotiate, freeze downstream assets, coordinate with exchanges, and offer bounties. When a loss comes from a compromised or abused authority path, the tools a protocol would use to recover are often the tools that were lost. **Value lost through a code exploit came back at three times the rate of external privileged compromise, and almost thirty times the rate of insider abuse.**

---

## 4. Worked case: CVE-2023-39363 and the Curve pools

This is a code exploit, the 5% category. We chose it because it shows that even when the root cause is a bug, the outcome is decided by authority.

**The bug.** Vyper compiler versions 0.2.15, 0.2.16, and 0.3.0 could allocate named reentrancy locks incorrectly, so functions meant to share one lock did not ([CVE-2023-39363](https://nvd.nist.gov/vuln/detail/CVE-2023-39363); [GHSA-5824-cm3x-3c38](https://github.com/vyperlang/vyper/security/advisories/GHSA-5824-cm3x-3c38)). Version 0.3.1 contains the fix.

**The incident.** On 30 July 2023, Curve pools compiled with affected versions and paired with native ETH were exploited through cross-function reentrancy. LlamaRisk's postmortem identifies four: pETH/ETH, msETH/ETH, alETH/ETH, and CRV/ETH. The Case Library records the incident from De.Fi REKT as **$50.5M lost and $6.8M returned** (13.5%). Other public tallies of the same event differ.

**The authority gap.** LlamaRisk reports that Curve's emergency DAO could stop CRV gauge emissions to the affected pools, **but lacked the authority to pause the pools or handle user funds.** The vulnerable contracts stayed callable. Containment had to happen *around* the contracts, through advisories, routing, incentives, and replacement pools, rather than *inside* them.

SCE's doctrine engine maps this incident to an emergency pause policy, among other controls. In the affected pools, that control did not exist. The exploit was a code bug. What decided how much was lost, and how long the exposure lasted, was the shape of the authority around the code.

Sagitta's [Defense mini-review of CVE-2023-39363](https://www.sagitta.systems/defense/reviews/cve-2023-39363) follows the same vulnerability through a fictional protocol: from compiler exposure, through reachability and economics, to authority, migration, and verified restoration.

---

## 5. Scope and limits

This report follows the [SCE methodology](https://sce.sagitta.systems/research): public data only, observed evidence kept separate from inference, and published with responsible framing.

- **Public data only.** Every figure comes from public incident records ingested into the SCE Case Library. No private data, keys, custody, or non-public access was used.
- **Losses are as recorded by De.Fi REKT**, in US dollars, and were not independently verified by Sagitta. Records can be revised at the source.
- **Categories are De.Fi's.** The grouping into authority paths and code exploits is Sagitta's and is shown in full in Section 1.
- **The unclassified category is excluded from shares.** De.Fi's "Other" ($25.21B across 546 incidents, excluding Terra Classic) includes centralized-platform failures and incidents without a stated cause. Including it would not change which path dominates the classified data, but it would make the shares less meaningful.
- **Outliers.** Terra Classic ($40B, "Other") is excluded from all totals. The largest classified record ($6.3B, 29 October 2026) is shown both ways wherever it matters.
- **Coverage is uneven over time.** Records before 2020 are sparse. 926 records carry no incident date, and 2,279 carry no loss figure (mostly honeypots).
- **Containment and doctrine mappings are SCE's.** Pause-type controls and continuity implications are produced by SCE's rule-based doctrine engine. They describe what containment the incident class calls for, not what any specific protocol had.
- **This is not:** a smart contract audit, an exploit claim, invasive testing, or a certification that any protocol is safe or defended. No protocol was assessed beyond its public incident record.

---

## Methodology

**Corpus.** SCE Case Library, 17 November 2026: 18,375 records from OSV (6,715), De.Fi REKT (4,139), GitHub Advisories (4,063), NVD CVE (3,327), and CISA KEV (131). The loss analysis uses the De.Fi REKT records, which span 13 June 2011 to 14 November 2026.

**Loss.** `funds_lost_usd` and `funds_returned` as recorded by De.Fi. An incident counts toward totals and medians only when it records a loss greater than zero.

**Windows.** Windows use De.Fi's incident date. Undated records count in all-years figures only.

**Grouping.** As shown in Section 1. The mapping is fixed for the quarterly series so editions are comparable.

**Reproducibility.** The queries behind every figure are in `research-note-001-queries.py` and run read-only against the Case Library.

*Sagitta Continuity Engine Authority Reports are published quarterly.*

## Sources

- De.Fi REKT database, via the SCE Case Library: https://de.fi/rekt-database
- National Vulnerability Database: [CVE-2023-39363](https://nvd.nist.gov/vuln/detail/CVE-2023-39363)
- Vyper security advisory: [GHSA-5824-cm3x-3c38](https://github.com/vyperlang/vyper/security/advisories/GHSA-5824-cm3x-3c38)
- LlamaRisk: [*Curve Pool Reentrancy Exploit Postmortem*](https://www.llamarisk.com/research/curve-pool-reentrancy-exploit-postmortem)
- Sagitta Defense: [mini-review of CVE-2023-39363](https://www.sagitta.systems/defense/reviews/cve-2023-39363)
