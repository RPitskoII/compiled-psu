import { SAMPLE_LEADS } from "@/data/sampleLeads";
import type { MockLead, ScoredLead, StructuredICP } from "@/lib/types";

// Re-export so route.ts can call scoreLeads on Apollo leads too
export type { ScoredLead };

// ─── Scoring helpers ─────────────────────────────────────────────────────────

const TITLE_KEYWORDS = [
  "vp of engineering",
  "vp engineering",
  "head of engineering",
  "head of eng",
  "director of engineering",
  "chief technology officer",
  "cto",
  "engineering manager",
  "staff engineer",
  "principal engineer",
];

function normalizeStr(s: string): string {
  return s.toLowerCase().trim();
}

function titleScore(lead: MockLead, icp: StructuredICP): number {
  const title = normalizeStr(lead.title);
  for (const role of icp.roles) {
    if (title.includes(normalizeStr(role))) return 30;
  }
  // Partial match against common ICP title keywords
  for (const kw of TITLE_KEYWORDS) {
    if (title.includes(kw)) return 15;
  }
  return 0;
}

function industryScore(lead: MockLead, icp: StructuredICP): number {
  const industry = normalizeStr(lead.industry);
  for (const ind of icp.industries) {
    if (industry.includes(normalizeStr(ind))) return 20;
  }
  // Fallback: any "SaaS" mention
  if (industry.includes("saas") || industry.includes("software")) return 10;
  return 0;
}

function sizeScore(lead: MockLead, icp: StructuredICP): number {
  const { min, max } = icp.company_size_range;
  if (lead.company_size >= min && lead.company_size <= max) return 20;
  // Partial credit within 20% of range
  if (lead.company_size >= min * 0.8 && lead.company_size <= max * 1.2) return 10;
  return 0;
}

function locationScore(lead: MockLead, icp: StructuredICP): number {
  if (icp.locations.length === 0) return 10; // "Any" → everyone gets credit
  const loc = normalizeStr(lead.location);
  for (const l of icp.locations) {
    const nl = normalizeStr(l);
    if (nl === "any") return 10;
    if (loc.includes(nl)) return 10;
    // "US" / "United States" / "North America" matching
    if ((nl === "us" || nl === "united states" || nl === "north america") &&
      (loc.includes("us") || loc.includes(", ca") || loc.includes(", ny") ||
        loc.includes(", tx") || loc.includes(", wa") || loc.includes(", il"))) {
      return 10;
    }
    if (nl === "eu" && (loc.includes("uk") || loc.includes("europe") ||
      loc.includes("germany") || loc.includes("france") || loc.includes("netherlands"))) {
      return 10;
    }
  }
  return 0;
}

function signalScore(lead: MockLead, icp: StructuredICP): number {
  let score = 0;
  const allSignalText = [
    ...lead.hiring_signals.map(normalizeStr),
    ...lead.funding_events.map(normalizeStr),
    ...lead.tech_stack.map(normalizeStr),
    normalizeStr(lead.company_summary),
  ].join(" ");

  for (const signal of icp.signals) {
    const ns = normalizeStr(signal);
    if (allSignalText.includes(ns)) {
      score += 5;
    }
  }

  // Bonus: actively hiring engineers
  if (lead.hiring_signals.length >= 2) score += 5;
  // Bonus: recent funding
  if (lead.funding_events.length >= 1) score += 5;

  return Math.min(score, 20); // cap at 20 pts
}

// ─── Research summary builder ─────────────────────────────────────────────────

export function buildResearchSummary(lead: MockLead): string {
  const hiringList = lead.hiring_signals.join(", ");
  const techList = lead.tech_stack.join(", ");
  const fundingList = lead.funding_events.join("; ");

  return (
    `Company: ${lead.company} (${lead.industry}), ~${lead.company_size} employees, ` +
    `located in ${lead.location}. ` +
    `${lead.company_summary} ` +
    `Tech stack: ${techList}. ` +
    `Currently hiring: ${hiringList}. ` +
    `Funding history: ${fundingList}.`
  );
}

// ─── Core scoring engine (works on any MockLead array) ───────────────────────

/**
 * Scores and ranks a given set of leads against the ICP.
 * Used by both the mock path and the Apollo path.
 */
export function scoreLeads(
  leads: MockLead[],
  icp: StructuredICP,
  maxResults = 5
): ScoredLead[] {
  const scored: ScoredLead[] = leads.map((lead) => {
    const score =
      titleScore(lead, icp) +
      industryScore(lead, icp) +
      sizeScore(lead, icp) +
      locationScore(lead, icp) +
      signalScore(lead, icp);

    // Apollo leads already passed Apollo's own filtering, so give them a baseline
    // boost to avoid filtering them out when signal data is sparse.
    const isApolloLead = lead.id.startsWith("apollo-");
    const baselineBoost = isApolloLead ? 30 : 0;

    const fitScore = Math.min(100, Math.max(0, score + baselineBoost));

    return {
      ...lead,
      fitScore,
      researchSummary: buildResearchSummary(lead),
    };
  });

  return scored
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, maxResults)
    .filter((l) => l.fitScore > 0);
}

// ─── Mock-data selector (kept for fallback / local dev) ──────────────────────

/**
 * Filters and ranks the built-in mock leads against a structured ICP.
 * Returns the top 3–5 leads with a numeric fitScore (0–100)
 * and a pre-built researchSummary string.
 *
 * To use real Apollo data, call fetchLeadsFromApollo() in lib/apollo.ts
 * and pass the result to scoreLeads() instead.
 */
export function getLeadsFromIcp(
  icp: StructuredICP,
  maxResults = 5
): ScoredLead[] {
  return scoreLeads(SAMPLE_LEADS, icp, maxResults);
}
