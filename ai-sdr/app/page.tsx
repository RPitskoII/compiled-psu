"use client";

import { useState } from "react";
import type {
  CompanyContext,
  GenerateRequest,
  GenerateResponse,
  LeadWithEmail,
} from "@/lib/types";
import { DEFAULT_COMPANY_CONTEXT } from "@/lib/prompts";

// ─── Sub-components ───────────────────────────────────────────────────────────

function FitScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75
      ? "bg-green-100 text-green-800 ring-green-300"
      : score >= 50
        ? "bg-yellow-100 text-yellow-800 ring-yellow-300"
        : "bg-red-100 text-red-700 ring-red-300";

  const label =
    score >= 75 ? "Strong fit" : score >= 50 ? "Good fit" : "Possible fit";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${color}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          score >= 75
            ? "bg-green-600"
            : score >= 50
              ? "bg-yellow-500"
              : "bg-red-500"
        }`}
      />
      {score}/100 · {label}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments where clipboard API is restricted
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
        bg-black/5 text-black ring-1 ring-black/15
        hover:bg-black/10 transition-all duration-150"
    >
      {copied ? (
        <>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy email
        </>
      )}
    </button>
  );
}

function LeadCard({ lead, index }: { lead: LeadWithEmail; index: number }) {
  const [emailExpanded, setEmailExpanded] = useState(false);
  const fullEmail = `Subject: ${lead.personalizedEmail.subject}\n\n${lead.personalizedEmail.body}`;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Card header */}
      <div
        className="px-6 py-4 flex items-start justify-between gap-4"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--surface-2)",
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="text-base font-semibold"
              style={{ color: "var(--text)" }}
            >
              {lead.name}
            </h3>
            <FitScoreBadge score={lead.fitScore} />
          </div>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {lead.title} ·{" "}
            <span className="font-semibold" style={{ color: "var(--text)" }}>
              {lead.company}
            </span>
          </p>
        </div>
      </div>

      {/* Card body */}
      <div className="px-6 py-5 space-y-5">
        {/* Company summary */}
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            About the company
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text)" }}
          >
            {lead.companySummary}
          </p>
        </div>

        {/* Research signals */}
        <div
          className="rounded-lg px-4 py-3"
          style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-1.5"
            style={{ color: "#64748b" }}
          >
            Research signals
          </p>
          <p
            className="text-sm leading-relaxed whitespace-pre-line"
            style={{ color: "#0f172a" }}
          >
            {lead.formattedResearchSummary ?? lead.researchSummary}
          </p>
        </div>

        {/* Fit explanation */}
        <div
          className="rounded-lg px-4 py-3"
          style={{
            background: "var(--accent-muted)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            Why they&apos;re a fit right now
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text)" }}
          >
            {lead.fitExplanation}
          </p>
        </div>

        {/* Personalized email */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              Personalized email
            </p>
            <div className="flex items-center gap-2">
              <CopyButton text={fullEmail} />
              <button
                onClick={() => setEmailExpanded((v) => !v)}
                className="text-xs px-2.5 py-1.5 rounded-md ring-1 transition-all duration-150"
                style={{
                  color: "var(--text-muted)",
                  borderColor: "var(--border)",
                  background: "transparent",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-muted)")
                }
              >
                {emailExpanded ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>

          {/* Subject line — always visible */}
          <div
            className="rounded-t-lg px-4 py-2.5 flex items-center gap-2"
            style={{
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              color: "#0f172a",
            }}
          >
            <span className="text-xs font-medium" style={{ color: "#64748b" }}>
              Subject:
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: "#0f172a" }}
            >
              {lead.personalizedEmail.subject}
            </span>
          </div>

          {/* Email body */}
          {emailExpanded && (
            <div
              className="rounded-b-lg px-4 py-4 border-t-0"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderTop: "none",
              }}
            >
              <pre
                className="text-sm leading-relaxed whitespace-pre-wrap font-sans"
                style={{ color: "#0f172a", maxHeight: "none" }}
              >
                {lead.personalizedEmail.body}
              </pre>
            </div>
          )}

          {!emailExpanded && (
            <div
              className="rounded-b-lg px-4 py-3 border-t-0 cursor-pointer group"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderTop: "none",
              }}
              onClick={() => setEmailExpanded(true)}
            >
              <p
                className="text-sm truncate group-hover:opacity-80 transition-opacity"
                style={{ color: "#334155" }}
              >
                {lead.personalizedEmail.body
                  .split("\n")
                  .find((l) => l.trim()) ?? ""}
              </p>
              <p className="text-xs mt-1 text-indigo-600 group-hover:text-indigo-500 transition-colors">
                Click to expand full email →
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-t-black border-r-black/40 border-b-black/10 border-l-transparent animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
          Researching leads and drafting emails…
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Claude is analyzing your ICP and writing personalized outreach
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const DEFAULT_ICP = `VP of Engineering or Head of Engineering at post-Series A/B SaaS companies with 100–1,000 employees in the US that are actively hiring engineers or recently raised funding.`;

export default function HomePage() {
  const [icpDescription, setIcpDescription] = useState(DEFAULT_ICP);
  const [geography, setGeography] = useState("US");
  const [companySize, setCompanySize] = useState("100-1000");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LeadWithEmail[] | null>(null);
  const [dataSource, setDataSource] = useState<"apollo" | "mock" | null>(null);
  const [error, setError] = useState<{
    message: string;
    detail?: string;
  } | null>(null);
  const [companyPanelOpen, setCompanyPanelOpen] = useState(false);

  // Company context — pre-filled with demo defaults, fully editable by user
  const [companyName, setCompanyName] = useState(
    DEFAULT_COMPANY_CONTEXT.companyName,
  );
  const [productDescription, setProductDescription] = useState(
    DEFAULT_COMPANY_CONTEXT.productDescription,
  );
  // Value props stored as a single textarea string (one per line) for easy editing
  const [valuePropText, setValuePropText] = useState(
    DEFAULT_COMPANY_CONTEXT.valueProps.join("\n"),
  );
  const [senderName, setSenderName] = useState(
    DEFAULT_COMPANY_CONTEXT.senderName,
  );
  const [senderTitle, setSenderTitle] = useState(
    DEFAULT_COMPANY_CONTEXT.senderTitle,
  );
  const [senderEmail, setSenderEmail] = useState(
    DEFAULT_COMPANY_CONTEXT.senderEmail,
  );

  const buildCompanyContext = (): CompanyContext => ({
    companyName: companyName.trim() || DEFAULT_COMPANY_CONTEXT.companyName,
    productDescription:
      productDescription.trim() || DEFAULT_COMPANY_CONTEXT.productDescription,
    valueProps: valuePropText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0),
    senderName: senderName.trim() || DEFAULT_COMPANY_CONTEXT.senderName,
    senderTitle: senderTitle.trim() || DEFAULT_COMPANY_CONTEXT.senderTitle,
    senderEmail: senderEmail.trim(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    setDataSource(null);

    const payload: GenerateRequest = {
      icpDescription,
      geography,
      companySize,
      companyContext: buildCompanyContext(),
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as GenerateResponse & {
        source?: "apollo" | "mock";
        error?: string;
        detail?: string;
      };

      if (!res.ok) {
        setError({
          message: data.error ?? "Something went wrong. Please try again.",
          detail: data.detail,
        });
        return;
      }

      setResults(data.leads);
      setDataSource(data.source ?? "mock");
    } catch {
      setError({
        message: "Network error — please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Top nav bar */}
      <header
        className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between"
        style={{
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent)" }}
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span
            className="font-bold text-sm tracking-tight"
            style={{ color: "var(--text)" }}
          >
            Propelr.ai
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 pb-20">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1
            className="text-3xl font-bold tracking-tight mb-3"
            style={{ color: "var(--text)" }}
          >
            Turn an ICP into researched leads and personalized emails
          </h1>
          <p
            className="text-base max-w-lg mx-auto"
            style={{ color: "var(--text-muted)" }}
          >
            Describe your ideal customer, and the agent will surface matching
            leads with a concrete reason they need your product today.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-6 space-y-4"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div>
            <label
              htmlFor="icp"
              className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Describe your ideal customer profile
            </label>
            <textarea
              id="icp"
              value={icpDescription}
              onChange={(e) => setIcpDescription(e.target.value)}
              rows={4}
              placeholder="e.g. VP of Engineering at post-Series A SaaS companies with 100–500 employees who are actively hiring engineers…"
              className="w-full rounded-lg px-4 py-3 text-sm resize-y transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-black/20"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="geo"
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                Location
              </label>
              <select
                id="geo"
                value={geography}
                onChange={(e) => setGeography(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 transition-all"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
                disabled={loading}
              >
                <option value="Any">Any</option>
                <option value="US">US</option>
                <option value="EU">EU</option>
                <option value="North America">North America</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="size"
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                Company size
              </label>
              <select
                id="size"
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 transition-all"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
                disabled={loading}
              >
                <option value="50-200">50 – 200</option>
                <option value="200-500">200 – 500</option>
                <option value="500-1000">500 – 1,000</option>
                <option value="100-1000">100 – 1,000 (all)</option>
                <option value="1000+">1,000+</option>
              </select>
            </div>
          </div>

          {/* ── Company context panel ─────────────────────────────────── */}
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            <button
              type="button"
              onClick={() => setCompanyPanelOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:opacity-80"
              style={{ background: "var(--surface-2)" }}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--text-muted)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  Your company
                </span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-medium"
                  style={{
                    background: "var(--accent-muted)",
                    color: "var(--accent-hover)",
                  }}
                >
                  {companyName || "unnamed"}
                </span>
              </div>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${companyPanelOpen ? "rotate-180" : ""}`}
                style={{ color: "var(--text-muted)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {companyPanelOpen && (
              <div
                className="px-4 py-4 space-y-3"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                {/* Company name */}
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Company name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                    disabled={loading}
                  />
                </div>

                {/* Sender name */}
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Sender name
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                    disabled={loading}
                  />
                </div>

                {/* Sender title */}
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Sender title
                  </label>
                  <input
                    type="text"
                    value={senderTitle}
                    onChange={(e) => setSenderTitle(e.target.value)}
                    placeholder="Account Executive"
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                    disabled={loading}
                  />
                </div>

                {/* Sender email */}
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Sender email
                  </label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="alex@yourcompany.com"
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                    disabled={loading}
                  />
                </div>

                {/* What your product does — resizable */}
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    What your product does
                    <span
                      className="normal-case font-normal ml-1.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      — drag corner to expand
                    </span>
                  </label>
                  <textarea
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    rows={3}
                    placeholder="A unified platform that replaces X with Y for Z customers…"
                    className="w-full rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-black/20"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      minHeight: "72px",
                    }}
                    disabled={loading}
                  />
                </div>

                {/* Value props — resizable */}
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Value props
                    <span
                      className="normal-case font-normal ml-1.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      — one per line, e.g. "Speed — 60% faster builds" · drag to
                      expand
                    </span>
                  </label>
                  <textarea
                    value={valuePropText}
                    onChange={(e) => setValuePropText(e.target.value)}
                    rows={5}
                    placeholder={
                      "Speed — 60% faster build times\nReliability — automatic rollback on failures\nScale — no DevOps headcount needed"
                    }
                    className="w-full rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-black/20 font-mono"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      minHeight: "100px",
                    }}
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || icpDescription.trim().length < 10}
            className="w-full py-3 rounded-lg text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: loading ? "var(--surface-2)" : "var(--accent)",
              color: "white",
            }}
            onMouseEnter={(e) => {
              if (!loading)
                e.currentTarget.style.background = "var(--accent-hover)";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = "var(--accent)";
            }}
          >
            {loading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Generate leads &amp; emails
              </>
            )}
          </button>
        </form>

        {/* Loading state */}
        {loading && <LoadingState />}

        {/* Error banner */}
        {error && !loading && (
          <div
            className="mt-6 rounded-xl px-5 py-4 flex items-start gap-3"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
            }}
          >
            <svg
              className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-400">
                {error.message}
              </p>
              {error.detail && (
                <p
                  className="text-xs mt-1 font-mono break-words"
                  style={{ color: "var(--text-muted)" }}
                >
                  {error.detail}
                </p>
              )}
              {!error.detail && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Adjust your ICP or try again. If the issue persists, check
                  your API key configuration.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-lg font-bold"
                style={{ color: "var(--text)" }}
              >
                {results.length} matching lead{results.length !== 1 ? "s" : ""}{" "}
                found
              </h2>
              <div className="flex items-center gap-2">
                {dataSource === "apollo" ? (
                  <span className="text-xs px-2.5 py-1 rounded-full ring-1 ring-black/20 text-black bg-black/5 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                    Live · Apollo.io
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full ring-1 ring-black/15 text-black/60 bg-black/5 font-medium">
                    Demo · Mock data
                  </span>
                )}
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Sorted by fit score
                </p>
              </div>
            </div>
            <div className="space-y-5">
              {results.map((lead, i) => (
                <LeadCard key={lead.id} lead={lead} index={i} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
