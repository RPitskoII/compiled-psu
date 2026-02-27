// ─── ICP ────────────────────────────────────────────────────────────────────

export interface StructuredICP {
  roles: string[];           // e.g. ["VP of Engineering", "Head of Engineering", "CTO"]
  industries: string[];      // e.g. ["SaaS", "B2B Software", "Cloud Infrastructure"]
  company_size_range: {
    min: number;
    max: number;
  };
  locations: string[];       // e.g. ["US", "United States"]
  signals: string[];         // e.g. ["hiring engineers", "recent funding", "kubernetes"]
}

// ─── Lead (mock data shape — modeled after PDL / Apollo) ────────────────────

export interface MockLead {
  id: string;
  name: string;
  title: string;
  linkedin_url: string;
  company: string;
  company_size: number;          // headcount
  location: string;
  industry: string;
  tech_stack: string[];          // known technologies
  hiring_signals: string[];      // recent job postings or roles
  funding_events: string[];      // e.g. ["Series B $45M (2024-03)"]
  company_summary: string;       // 2-3 sentence blurb about what the company does
}

// ─── Scored / enriched lead (used internally before LLM call) ───────────────

export interface ScoredLead extends MockLead {
  fitScore: number;              // 0–100
  researchSummary: string;       // built from fields, passed to LLM
}

// ─── LLM outputs ────────────────────────────────────────────────────────────

export interface PersonalizedEmail {
  subject: string;
  body: string;
}

export interface LeadWithEmail {
  id: string;
  name: string;
  title: string;
  company: string;
  companySummary: string;
  fitScore: number;
  fitExplanation: string;
  researchSummary: string;
  personalizedEmail: PersonalizedEmail;
}

// ─── API request / response ─────────────────────────────────────────────────

export interface GenerateRequest {
  icpDescription: string;
  geography?: string;       // "Any" | "US" | "EU" | "North America"
  companySize?: string;     // "50-200" | "200-500" | "500-1000" | "1000+"
}

export interface GenerateResponse {
  leads: LeadWithEmail[];
}

export interface GenerateErrorResponse {
  error: string;
  detail?: string;
}
