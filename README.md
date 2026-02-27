# compiled-psu

A monorepo of AI-powered sales and developer tooling experiments.

---

## Projects

### `ai-sdr` — AI SDR for Dev Tools

A Next.js app that turns a free-form Ideal Customer Profile (ICP) description into researched leads and personalized outreach emails — powered by Claude.

#### What it does

1. You describe your ICP in plain English (e.g. *"VP of Engineering at post-Series A SaaS companies with 100–1,000 employees actively hiring engineers"*).
2. Claude normalizes that description into a structured ICP (roles, industries, company size, location, signals).
3. Leads are fetched — either live from Apollo.io or from a built-in mock dataset.
4. Each lead is scored against the ICP (0–100 fit score) across title match, industry, company size, location, and buying signals.
5. The top 5 leads are passed back to Claude, which writes a fit explanation and a fully personalized cold email for each one.
6. Results are displayed in a dark-themed UI with fit score badges, one-click copy, and expand/collapse email previews.

#### Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| AI | Anthropic Claude Sonnet 4.6 (`@anthropic-ai/sdk`) |
| Lead data | Apollo.io API (optional) / built-in mock leads |

#### Pipeline overview

```
User input (ICP text + filters)
        │
        ▼
LLM Call #1 — ICP normalization
  claude-sonnet-4-6 → StructuredICP JSON
        │
        ▼
Lead fetch
  ├── Apollo.io (if APOLLO_API_KEY is set)
  │     ├── Step 1: /mixed_people/api_search  (FREE — no credits)
  │     └── Step 2: /organizations/enrich     (~1 org credit per company)
  └── Mock dataset fallback (data/sampleLeads.ts)
        │
        ▼
Scoring engine (lib/leadSelector.ts)
  Title match (30 pts) + Industry (20 pts) + Size (20 pts)
  + Location (10 pts) + Signals (20 pts) = fit score 0–100
        │
        ▼
LLM Call #2 — per-lead (parallel)
  claude-sonnet-4-6 → fitExplanation + subject + email body
        │
        ▼
JSON response → UI cards
```

#### Project structure

```
ai-sdr/
├── app/
│   ├── api/generate/route.ts   # POST /api/generate — orchestrates the full pipeline
│   ├── components/             # (reserved for extracted UI components)
│   ├── globals.css             # CSS custom properties (dark theme tokens)
│   ├── layout.tsx
│   └── page.tsx                # Main UI — form, lead cards, copy button, fit badges
├── data/
│   └── sampleLeads.ts          # Built-in mock leads (used when no Apollo key is set)
├── lib/
│   ├── apollo.ts               # Apollo.io people search + org enrichment
│   ├── leadSelector.ts         # Scoring engine + research summary builder
│   ├── llm.ts                  # Two Claude calls: ICP normalization & email generation
│   ├── prompts.ts              # System prompts for both LLM calls
│   └── types.ts                # Shared TypeScript interfaces
└── .env.local.example          # Environment variable reference
```

#### Getting started

```bash
cd ai-sdr
npm install
cp .env.local.example .env.local
# fill in your keys, then:
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

#### Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | **Yes** | Claude API key — used for ICP normalization and email generation |
| `APOLLO_API_KEY` | No | Apollo.io Master API key — when set, fetches real leads instead of mock data |

Without `APOLLO_API_KEY` the app runs entirely on mock data (no external calls beyond Anthropic). With it, each "Generate" click costs approximately 5 Apollo org credits (one per unique company enriched).

#### API

**`POST /api/generate`**

Request body:
```json
{
  "icpDescription": "VP of Engineering at post-Series A SaaS...",
  "geography": "US",
  "companySize": "100-1000"
}
```

Response:
```json
{
  "source": "apollo" | "mock",
  "leads": [
    {
      "id": "...",
      "name": "...",
      "title": "...",
      "company": "...",
      "companySummary": "...",
      "fitScore": 85,
      "fitExplanation": "...",
      "researchSummary": "...",
      "personalizedEmail": {
        "subject": "...",
        "body": "..."
      }
    }
  ]
}
```

#### UI features

- **Fit score badge** — color-coded: green (≥ 75 · Strong fit), amber (≥ 50 · Good fit), rose (< 50 · Possible fit)
- **Data source indicator** — "Live · Apollo.io" (animated pulse) or "Demo · Mock data"
- **Copy email button** — copies subject + body to clipboard with a 2-second confirmation state
- **Expand / collapse email** — subject line always visible; body expands on click
- **Results sorted by fit score** — highest fit shown first
- **Loading state** — spinner with descriptive status while Claude is working
- **Error banner** — surface API errors with actionable hints
