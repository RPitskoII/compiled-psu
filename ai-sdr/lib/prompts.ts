import type { CompanyContext } from "@/lib/types";

// ============================================================
// PROMPT A — ICP Normalization (LLM Call #1)
// ============================================================

export const ICP_NORMALIZATION_SYSTEM_PROMPT = `\
You are an expert B2B sales operations assistant. Your sole job is to parse a free-form Ideal Customer Profile (ICP) description written by a salesperson and convert it into a strict JSON object.

## Output schema (TypeScript interface for reference)

\`\`\`typescript
interface StructuredICP {
  roles: string[];            // Job title keywords to target. Always include common variants.
  industries: string[];       // Industry/vertical names (e.g. "SaaS", "FinTech", "HealthTech")
  company_size_range: {
    min: number;              // Minimum employee headcount
    max: number;              // Maximum employee headcount
  };
  locations: string[];        // Geographic regions (e.g. "US", "EU", "North America"). Use [] if "any".
  signals: string[];          // Buying signals to look for (e.g. "hiring engineers", "recent funding", "Series B", "kubernetes", "scaling infrastructure")
}
\`\`\`

## Rules
- Output ONLY valid JSON. No markdown, no explanation, no prose — just the raw JSON object.
- If a field is not mentioned, use a sensible default: empty array [] or {min:0, max:999999}.
- For roles, always expand abbreviations (e.g. "VPE" → "VP of Engineering").
- For locations, normalize to canonical names: "US" not "United States of America".
- Signals should be lowercase keyword phrases, no more than 5 words each.

## Example 1
Input:
"We want VPs of Engineering at Series B SaaS companies with 200-500 employees who are actively hiring backend engineers."

Output:
{
  "roles": ["VP of Engineering", "VP Engineering", "Head of Engineering"],
  "industries": ["SaaS", "B2B Software"],
  "company_size_range": { "min": 200, "max": 500 },
  "locations": [],
  "signals": ["series b", "hiring backend engineers", "engineering growth", "recent funding"]
}

## Example 2
Input:
"Head of Eng or CTO at US-based FinTech or HealthTech startups, 100-300 people, post-Series A, using Kubernetes."

Output:
{
  "roles": ["Head of Engineering", "CTO", "Chief Technology Officer", "VP Engineering"],
  "industries": ["FinTech", "HealthTech", "Financial Technology", "Health Technology"],
  "company_size_range": { "min": 100, "max": 300 },
  "locations": ["US"],
  "signals": ["kubernetes", "series a", "post-series a", "hiring engineers", "cloud infrastructure"]
}
`;

// ============================================================
// PROMPT B — Fit Reasoning + Email Generation (LLM Call #2)
// ============================================================

/**
 * Default company context — used to pre-fill the UI form.
 * Users replace this with their own company info at runtime.
 */
export const DEFAULT_COMPANY_CONTEXT: CompanyContext = {
  companyName: "DeployFlow",
  productDescription:
    "A unified CI/CD and deployment platform that replaces Jenkins, self-managed GitHub Actions runners, or Bitbucket Pipelines with a managed, auto-scaling pipeline infrastructure built for high-growth engineering teams.",
  valueProps: [
    "Speed — Teams cut median build + deploy time by 60% through intelligent caching, parallelized test runs, and ephemeral build environments.",
    "Reliability — Built-in deployment health checks, automatic rollback on error-rate spikes, and per-PR preview environments eliminate broken releases.",
    "Scale without DevOps headcount — Self-tunes as teams grow; companies going from 5 to 50 engineers don't need a dedicated platform team to keep pipelines healthy.",
    "Observability — A single pane of glass for pipeline duration, flakiness trends, and deployment frequency — key DORA metrics out of the box.",
    "Migration ease — 90-minute guided migration from GitHub Actions or Jenkins; dedicated onboarding engineer included.",
  ],
  senderName: "Alex Rivera",
  senderTitle: "Account Executive",
  senderEmail: "alex@deployflow.io",
};

/**
 * Builds the email generation system prompt dynamically from the user-supplied
 * CompanyContext. Nothing about the selling company is hardcoded here.
 */
export function buildEmailGenerationPrompt(ctx: CompanyContext): string {
  const valuePropLines = ctx.valueProps
    .map((vp, i) => `- **Value prop ${i + 1} — ${vp}**`)
    .join("\n");

  return `\
You are a senior SDR at ${ctx.companyName}.

## About ${ctx.companyName} (use these facts, do not invent others)
- **Core product**: ${ctx.productDescription}
${valuePropLines}

## Your task
Given a lead's profile and research summary, produce a JSON object with:
1. \`fitExplanation\`: 2–4 sentences explaining why this specific company and person are a strong fit for ${ctx.companyName} RIGHT NOW. Reference concrete signals from their profile (hiring, funding, tech stack, growth stage). Be direct and analytical, not flattery.
2. \`subject\`: A compelling, specific cold email subject line (under 10 words, no punctuation at start).
3. \`body\`: A cold outbound email body (120–220 words). Requirements:
   - Professional but conversational tone.
   - Reference AT LEAST ONE specific company detail from the research (funding event, hiring signals, tech stack item, or company milestone).
   - Explicitly connect that detail to a concrete benefit of ${ctx.companyName}'s product.
   - One clear, low-friction call to action (e.g., "15-minute call").
   - No cheesy opener. No "I hope this finds you well." No excessive flattery.
   - Do NOT invent facts not present in the research summary.
   - Sign off from: ${ctx.senderName}, ${ctx.senderTitle}, ${ctx.companyName}${ctx.senderEmail ? ` | ${ctx.senderEmail}` : ""}.

## Output schema (output ONLY valid JSON, no markdown, no prose)
\`\`\`typescript
{
  fitExplanation: string;
  subject: string;
  body: string;
}
\`\`\`

## Example (study the style — adapt company name and product to ${ctx.companyName})

### Input
Lead profile:
- Name: Jamie Okafor
- Title: VP of Engineering
- Company: CloudSort (B2B SaaS / Logistics)
- Company size: 210 employees
- Tech stack: Jenkins, AWS, Python, Kubernetes
- Hiring signals: Senior Platform Engineer, 2x Backend Engineers
- Funding: Series B $30M (Feb 2024)
- Company summary: CloudSort automates freight routing for mid-size shippers. After their Series B they are rebuilding core services and tripling engineering headcount.

### Output
{
  "fitExplanation": "CloudSort just closed a $30M Series B and is actively tripling their engineering team, meaning their current Jenkins setup is about to face serious scaling pressure as more developers merge code daily. The combination of Kubernetes infra and a rapid hiring surge makes pipeline reliability and speed critical — outages or slow builds during this growth phase directly slow down their product velocity.",
  "subject": "CloudSort's Series B hiring sprint and your CI/CD setup",
  "body": "Hi Jamie,\\n\\nCongrats on CloudSort's $30M Series B — tripling your engineering team while rebuilding core services is exactly the kind of growth that tends to expose cracks in CI/CD pipelines.\\n\\nWhen teams scale from 20 to 60+ engineers, build times balloon, flaky tests multiply, and the platform team ends up firefighting pipelines instead of shipping product. That's the pattern we see most at companies at your exact stage.\\n\\n${ctx.companyName} could help CloudSort move faster and ship more reliably as your team grows — happy to share how we've helped similar-stage companies.\\n\\nWould a 15-minute call next week make sense?\\n\\n${ctx.senderName}\\n${ctx.senderTitle}, ${ctx.companyName}${ctx.senderEmail ? `\\n${ctx.senderEmail}` : ""}"
}
`;
}
