import { NextRequest, NextResponse } from "next/server";
import { normalizeIcpWithLlm, generateFitAndEmailWithLlm, formatResearchSummaryWithLlm, researchCompanyWithLlm } from "@/lib/llm";
import { getLeadsFromIcp, scoreLeads } from "@/lib/leadSelector";
import { fetchLeadsFromApollo } from "@/lib/apollo";
import { DEFAULT_COMPANY_CONTEXT } from "@/lib/prompts";
import type { GenerateRequest, GenerateResponse, LeadWithEmail } from "@/lib/types";

export const runtime = "nodejs"; // Ensure Node.js runtime (not Edge) for Anthropic SDK

export async function POST(req: NextRequest) {
  // ── Parse & validate input ─────────────────────────────────────────────────
  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { icpDescription, geography, companySize, companyContext: rawCtx } = body;

  // Fall back to hardcoded defaults if the client didn't send a context
  // (e.g. direct API calls or older clients)
  const companyContext = rawCtx ?? DEFAULT_COMPANY_CONTEXT;

  if (!icpDescription || icpDescription.trim().length < 10) {
    return NextResponse.json(
      { error: "Please provide a more detailed ICP description (at least 10 characters)." },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Server configuration error: ANTHROPIC_API_KEY is not set." },
      { status: 500 }
    );
  }

  const usingApollo = !!process.env.APOLLO_API_KEY;

  try {
    // ── Step 1: Normalize ICP with LLM ────────────────────────────────────────
    const structuredIcp = await normalizeIcpWithLlm(
      icpDescription,
      geography,
      companySize
    );

    // ── Step 2: Fetch + score leads ───────────────────────────────────────────
    let scoredLeads;

    if (usingApollo) {
      // Real leads from Apollo — fall back to mock data on ANY Apollo error
      // so the demo never hard-fails due to API key tier or network issues.
      try {
        const apolloLeads = await fetchLeadsFromApollo(structuredIcp, 10);
        if (apolloLeads.length === 0) {
          console.warn("[/api/generate] Apollo returned 0 leads — using mock data.");
          scoredLeads = getLeadsFromIcp(structuredIcp, 5);
        } else {
          scoredLeads = scoreLeads(apolloLeads, structuredIcp, 5);
        }
      } catch (apolloErr) {
        console.error("[/api/generate] Apollo error (falling back to mock):", apolloErr);
        scoredLeads = getLeadsFromIcp(structuredIcp, 5);
      }
    } else {
      // Local mock leads
      scoredLeads = getLeadsFromIcp(structuredIcp, 5);
    }

    if (scoredLeads.length === 0) {
      return NextResponse.json(
        { error: "No matching leads found for the provided ICP. Try broadening your criteria." },
        { status: 404 }
      );
    }

    // ── Steps 3 & 4: Research company with LLM, format research signals, then generate fit + email per lead.
    const enrichedLeads: LeadWithEmail[] = await Promise.all(
      scoredLeads.map(async (lead) => {
        const researchBrief = await researchCompanyWithLlm(lead);
        const formattedResearchSummary = await formatResearchSummaryWithLlm(lead.researchSummary);
        const { fitExplanation, personalizedEmail } =
          await generateFitAndEmailWithLlm(lead, structuredIcp, companyContext, researchBrief);

        return {
          id: lead.id,
          name: lead.name,
          title: lead.title,
          company: lead.company,
          companySummary: lead.company_summary,
          fitScore: lead.fitScore,
          fitExplanation,
          researchSummary: lead.researchSummary,
          formattedResearchSummary,
          personalizedEmail,
          source: usingApollo ? ("apollo" as const) : ("mock" as const),
        } satisfies LeadWithEmail & { source: "apollo" | "mock" };
      })
    );

    // ── Step 5: Return response ────────────────────────────────────────────────
    const response: GenerateResponse & { source: string } = {
      leads: enrichedLeads,
      source: usingApollo ? "apollo" : "mock",
    };
    return NextResponse.json(response, { status: 200 });
  } catch (err: unknown) {
    console.error("[/api/generate] Error:", err);
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";

    // Apollo-specific error hints
    const isApolloError =
      usingApollo && message.toLowerCase().includes("apollo");
    return NextResponse.json(
      {
        error: isApolloError
          ? "Apollo API error — check your APOLLO_API_KEY and plan permissions."
          : "Failed to generate leads and emails.",
        detail: message,
      },
      { status: 500 }
    );
  }
}
