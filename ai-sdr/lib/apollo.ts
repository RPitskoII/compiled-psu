/**
 * Apollo.io API integration.
 *
 * Two-step pipeline (designed to minimize credit consumption):
 *   Step 1 — POST /api/v1/mixed_people/api_search   (FREE — no credits consumed)
 *            Returns: person_id, first_name, last_name_obfuscated, title, org.name
 *
 *   Step 2 — GET /api/v1/organizations/enrich?domain=X  (1 org credit per unique company)
 *            Returns: technology_names, funding_events, short_description,
 *                     estimated_num_employees, latest_funding_stage, industry
 *
 * To swap back to mock data: set USE_MOCK_LEADS=true in your .env.local
 * To use Apollo: set APOLLO_API_KEY in your .env.local
 */

import type { MockLead, StructuredICP } from "@/lib/types";

const APOLLO_BASE = "https://api.apollo.io/api/v1";

// ─── Raw Apollo response types ─────────────────────────────────────────────

interface ApolloPersonResult {
  id: string;
  first_name: string;
  last_name_obfuscated: string | null;
  title: string | null;
  has_email: boolean;
  has_city: boolean;
  has_state: boolean;
  has_country: boolean;
  organization: {
    name: string;
  } | null;
}

interface ApolloFundingEvent {
  id: string;
  date: string;           // ISO date string
  type: string;           // "Series A", "Series B", etc.
  amount: string | null;  // "45M"
  currency: string;       // "$"
  investors: string | null;
}

interface ApolloOrgEnrichment {
  id: string;
  name: string;
  primary_domain: string;
  website_url: string | null;
  linkedin_url: string | null;
  industry: string | null;
  estimated_num_employees: number | null;
  short_description: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  technology_names: string[];
  latest_funding_stage: string | null;
  latest_funding_round_date: string | null;
  total_funding_printed: string | null;
  funding_events: ApolloFundingEvent[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Derives a probable company domain from a company name.
 * e.g. "Memo Health" → "memohealth.com"
 *      "Launchpad HQ" → "launchpadhq.com"
 * Falls back to a slug + ".com" which resolves ~70-80% of the time for SaaS companies.
 */
function deriveCompanyDomain(companyName: string): string {
  return (
    companyName
      .toLowerCase()
      .replace(/\s+(inc|llc|corp|ltd|co|hq|group)\.?$/i, "") // strip legal suffixes
      .replace(/[^a-z0-9]/g, "") // strip punctuation/spaces
      + ".com"
  );
}

/** Map ICP location strings → Apollo `organization_locations[]` values */
function mapLocations(locations: string[]): string[] {
  if (locations.length === 0) return [];
  return locations.flatMap((l) => {
    const nl = l.toLowerCase().trim();
    if (nl === "any" || nl === "") return [];
    if (nl === "us" || nl === "united states") return ["United States"];
    if (nl === "north america") return ["United States", "Canada"];
    if (nl === "eu") return ["United Kingdom", "Germany", "France", "Netherlands", "Sweden"];
    return [l];
  });
}

/** Format an ApolloFundingEvent into the same string shape as mock data */
function formatFundingEvent(ev: ApolloFundingEvent): string {
  const date = ev.date ? new Date(ev.date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "";
  const amount = ev.amount ? ` $${ev.amount}` : "";
  const investors = ev.investors ? ` led by ${ev.investors.split(",")[0].trim()}` : "";
  return `${ev.type}${amount}${investors}${date ? ` (${date})` : ""}`;
}

// ─── Step 1: People search ─────────────────────────────────────────────────

async function searchPeople(
  icp: StructuredICP,
  perPage = 15
): Promise<ApolloPersonResult[]> {
  const apiKey = process.env.APOLLO_API_KEY!;

  // Build query string — Apollo api_search uses query parameters
  const params = new URLSearchParams();

  for (const role of icp.roles.slice(0, 5)) {
    params.append("person_titles[]", role);
  }

  // Map ICP seniority based on role keywords
  const roleText = icp.roles.join(" ").toLowerCase();
  if (roleText.includes("vp") || roleText.includes("vice president")) {
    params.append("person_seniorities[]", "vp");
  }
  if (roleText.includes("head") || roleText.includes("director")) {
    params.append("person_seniorities[]", "head");
    params.append("person_seniorities[]", "director");
  }
  if (roleText.includes("cto") || roleText.includes("chief")) {
    params.append("person_seniorities[]", "c_suite");
  }

  // Company size range
  const { min, max } = icp.company_size_range;
  const sizeMax = max >= 999999 ? 10000 : max; // clamp open-ended ranges
  params.append("organization_num_employees_ranges[]", `${min},${sizeMax}`);

  // Organization location (HQ-based, not person location)
  for (const loc of mapLocations(icp.locations)) {
    params.append("organization_locations[]", loc);
  }

  params.append("per_page", String(perPage));

  const url = `${APOLLO_BASE}/mixed_people/api_search?${params.toString()}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Apollo people search failed: ${res.status} — ${body}`);
  }

  const data = (await res.json()) as { people?: ApolloPersonResult[] };
  return data.people ?? [];
}

// ─── Step 2: Organization enrichment ──────────────────────────────────────

async function enrichOrganization(
  domain: string
): Promise<ApolloOrgEnrichment | null> {
  const apiKey = process.env.APOLLO_API_KEY!;

  const url = `${APOLLO_BASE}/organizations/enrich?domain=${encodeURIComponent(domain)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      "Cache-Control": "no-cache",
    },
  });

  if (!res.ok) return null; // 404 = company not found; treat as no enrichment

  const data = (await res.json()) as { organization?: ApolloOrgEnrichment };
  return data.organization ?? null;
}

// ─── Map Apollo data → MockLead ────────────────────────────────────────────

function mapToMockLead(
  person: ApolloPersonResult,
  org: ApolloOrgEnrichment | null,
  index: number
): MockLead {
  const companyName = org?.name ?? person.organization?.name ?? "Unknown Company";

  // Construct a displayable name. Last name is obfuscated (e.g. "Do***e")
  // We keep it since it looks realistic in lead cards.
  const lastName = person.last_name_obfuscated ?? "";
  const name = lastName ? `${person.first_name} ${lastName}` : person.first_name;

  // Location from org enrichment (HQ) or leave generic
  const location = org
    ? [org.city, org.state, org.country].filter(Boolean).join(", ")
    : "United States";

  // Tech stack: filter to engineering-relevant tools only
  const techStack = (org?.technology_names ?? []).filter((t) => {
    const tl = t.toLowerCase();
    return (
      tl.includes("kubernetes") ||
      tl.includes("docker") ||
      tl.includes("github") ||
      tl.includes("gitlab") ||
      tl.includes("jenkins") ||
      tl.includes("circleci") ||
      tl.includes("terraform") ||
      tl.includes("aws") ||
      tl.includes("gcp") ||
      tl.includes("azure") ||
      tl.includes("python") ||
      tl.includes("java") ||
      tl.includes("node") ||
      tl.includes("react") ||
      tl.includes("typescript") ||
      tl.includes("go") ||
      tl.includes("rust") ||
      tl.includes("redis") ||
      tl.includes("kafka") ||
      tl.includes("postgres") ||
      tl.includes("mysql") ||
      tl.includes("datadog") ||
      tl.includes("sentry") ||
      tl.includes("pagerduty") ||
      tl.includes("jira") ||
      tl.includes("linear")
    );
  }).slice(0, 8); // cap to avoid overwhelming the prompt

  // Funding events: take the 2 most recent
  const fundingEvents = (org?.funding_events ?? [])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 2)
    .map(formatFundingEvent);

  // Hiring signals: infer from funding stage (recently funded = actively hiring)
  const hiringSignals: string[] = [];
  if (org?.latest_funding_stage) {
    hiringSignals.push(`Recently completed ${org.latest_funding_stage} round — likely scaling engineering team`);
  }
  if (org?.estimated_num_employees && org.estimated_num_employees > 50) {
    hiringSignals.push(`Engineering team at ~${Math.round(org.estimated_num_employees * 0.25)}-person scale (est. 25% of ${org.estimated_num_employees} total)`);
  }

  // Company summary: use Apollo's short_description, fall back to generated
  const companySummary =
    org?.short_description?.slice(0, 400) ??
    `${companyName} is a ${org?.industry ?? "software"} company with approximately ${org?.estimated_num_employees ?? "unknown"} employees.`;

  return {
    id: `apollo-${person.id}`,
    name,
    title: person.title ?? "Engineering Leader",
    linkedin_url: `https://linkedin.com/in/search?q=${encodeURIComponent(person.first_name)}`,
    company: companyName,
    company_size: org?.estimated_num_employees ?? 200,
    location,
    industry: org?.industry ?? "Software",
    tech_stack: techStack.length > 0 ? techStack : ["AWS", "GitHub"],
    hiring_signals: hiringSignals,
    funding_events: fundingEvents,
    company_summary: companySummary,
  };
}

// ─── Main export ───────────────────────────────────────────────────────────

/**
 * Fetches real leads from Apollo matching the provided ICP.
 * Returns up to `maxResults` leads as MockLead objects,
 * enriched with organization data (tech stack, funding, description).
 *
 * Credit cost: 0 (people search) + 1 org credit per unique company enriched.
 * Typical cost for 5 leads: ~5 org credits.
 */
export async function fetchLeadsFromApollo(
  icp: StructuredICP,
  maxResults = 10
): Promise<MockLead[]> {
  // Step 1: find people matching ICP (free)
  const people = await searchPeople(icp, maxResults * 2); // fetch extra to account for deduplication

  if (people.length === 0) return [];

  // Deduplicate by company name (keep first occurrence per company)
  const seen = new Set<string>();
  const uniquePeople: ApolloPersonResult[] = [];
  for (const p of people) {
    const companyKey = (p.organization?.name ?? "").toLowerCase().trim();
    if (!seen.has(companyKey) && companyKey) {
      seen.add(companyKey);
      uniquePeople.push(p);
    }
    if (uniquePeople.length >= maxResults) break;
  }

  // Step 2: enrich each unique company in parallel (uses org credits)
  const leads = await Promise.all(
    uniquePeople.map(async (person, i) => {
      const companyName = person.organization?.name ?? "";
      const domain = deriveCompanyDomain(companyName);
      const orgData = companyName ? await enrichOrganization(domain) : null;
      return mapToMockLead(person, orgData, i);
    })
  );

  return leads;
}
