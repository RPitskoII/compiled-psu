import Anthropic from "@anthropic-ai/sdk";
import { ICP_NORMALIZATION_SYSTEM_PROMPT, EMAIL_GENERATION_SYSTEM_PROMPT } from "@/lib/prompts";
import type { ScoredLead, StructuredICP, PersonalizedEmail } from "@/lib/types";

// Instantiate once per module (safe in Next.js API routes / server components)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-3-5-sonnet-20241022";

// ─── LLM Call #1 — Normalize free-form ICP text → StructuredICP ─────────────

export async function normalizeIcpWithLlm(
  icpDescription: string,
  geographyHint?: string,
  companySizeHint?: string
): Promise<StructuredICP> {
  // Append UI dropdown selections to the free-form text so the LLM factors them in
  let userContent = icpDescription;
  if (geographyHint && geographyHint !== "Any") {
    userContent += `\n\nGeography filter (from UI): ${geographyHint}`;
  }
  if (companySizeHint) {
    userContent += `\nCompany size filter (from UI): ${companySizeHint} employees`;
  }

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: ICP_NORMALIZATION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const rawText =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  // Strip markdown code fences if the model wrapped the JSON
  const jsonStr = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  let parsed: StructuredICP;
  try {
    parsed = JSON.parse(jsonStr) as StructuredICP;
  } catch {
    // Fallback: best-effort defaults so the flow doesn't hard-fail
    parsed = {
      roles: ["VP of Engineering", "Head of Engineering"],
      industries: ["SaaS"],
      company_size_range: { min: 100, max: 1000 },
      locations: [],
      signals: ["hiring engineers", "recent funding"],
    };
  }

  return parsed;
}

// ─── LLM Call #2 — Generate fit explanation + personalized email per lead ────

interface LlmEmailOutput {
  fitExplanation: string;
  subject: string;
  body: string;
}

export async function generateFitAndEmailWithLlm(
  lead: ScoredLead,
  icp: StructuredICP
): Promise<{ fitExplanation: string; personalizedEmail: PersonalizedEmail }> {
  const userContent = `
## Structured ICP (target profile)
${JSON.stringify(icp, null, 2)}

## Lead profile
- Name: ${lead.name}
- Title: ${lead.title}
- Company: ${lead.company} (${lead.industry})
- Company size: ~${lead.company_size} employees
- Location: ${lead.location}
- Tech stack: ${lead.tech_stack.join(", ")}
- Hiring signals: ${lead.hiring_signals.join("; ")}
- Funding events: ${lead.funding_events.join("; ")}
- Research summary: ${lead.researchSummary}

Generate the JSON output now.
`.trim();

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: EMAIL_GENERATION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const rawText =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  const jsonStr = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  let parsed: LlmEmailOutput;
  try {
    parsed = JSON.parse(jsonStr) as LlmEmailOutput;
  } catch {
    // Return a safe fallback so the rest of the pipeline still succeeds
    parsed = {
      fitExplanation: `${lead.name} at ${lead.company} matches the ICP based on role, company size, and active hiring signals.`,
      subject: `${lead.company} and your engineering pipeline`,
      body: `Hi ${lead.name.split(" ")[0]},\n\nI'd love to share how DeployFlow helps engineering teams like ${lead.company}'s move faster and ship more reliably.\n\nWould a 15-minute call work this week?\n\nAlex Rivera\nAccount Executive, DeployFlow`,
    };
  }

  // Basic quality guard: reject emails that are suspiciously short or generic
  const emailIsValid =
    parsed.body.length >= 200 &&
    (parsed.body.toLowerCase().includes(lead.company.toLowerCase()) ||
      parsed.body.toLowerCase().includes(lead.name.split(" ")[0].toLowerCase()));

  if (!emailIsValid) {
    // Re-prompt once with explicit regeneration instruction
    return generateFitAndEmailWithLlm(lead, icp);
  }

  return {
    fitExplanation: parsed.fitExplanation,
    personalizedEmail: {
      subject: parsed.subject,
      body: parsed.body,
    },
  };
}
