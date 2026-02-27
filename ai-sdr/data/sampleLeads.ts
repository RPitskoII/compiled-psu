import type { MockLead } from "@/lib/types";

/**
 * Five realistic mock leads shaped like PDL / Apollo enrichment data.
 * All are VP/Head of Engineering at post-Series A/B SaaS companies
 * in the 100–1,000 employee range.
 */
export const SAMPLE_LEADS: MockLead[] = [
  {
    id: "lead-001",
    name: "Sarah Chen",
    title: "VP of Engineering",
    linkedin_url: "https://linkedin.com/in/sarah-chen-eng",
    company: "Stackline",
    company_size: 280,
    location: "San Francisco, CA, US",
    industry: "B2B SaaS / Retail Analytics",
    tech_stack: [
      "Kubernetes",
      "GitHub Actions",
      "AWS",
      "Terraform",
      "Python",
      "React",
    ],
    hiring_signals: [
      "Senior Backend Engineer (3 open roles)",
      "DevOps / Platform Engineer",
      "Staff Engineer - Infrastructure",
    ],
    funding_events: [
      "Series B $45M led by Sapphire Ventures (March 2024)",
    ],
    company_summary:
      "Stackline is a retail analytics SaaS platform that helps consumer brands measure and optimize their e-commerce presence across Amazon, Walmart, and Target. The platform processes petabytes of retail data daily and serves 2,000+ brands including Nike and Samsung.",
  },

  {
    id: "lead-002",
    name: "Marcus Williams",
    title: "Head of Engineering",
    linkedin_url: "https://linkedin.com/in/marcus-williams-hoe",
    company: "Finli",
    company_size: 165,
    location: "New York, NY, US",
    industry: "B2B SaaS / FinTech",
    tech_stack: [
      "Docker",
      "CircleCI",
      "GCP",
      "Node.js",
      "Go",
      "PostgreSQL",
    ],
    hiring_signals: [
      "Senior Software Engineer - Payments",
      "Engineering Manager - Platform",
      "Site Reliability Engineer",
    ],
    funding_events: [
      "Series A $18M led by Lightspeed (November 2023)",
    ],
    company_summary:
      "Finli is a payments and invoicing platform for small business owners, enabling them to get paid faster and manage cash flow. They recently expanded from mobile-only to a full web application, tripling their codebase in 12 months.",
  },

  {
    id: "lead-003",
    name: "Priya Nair",
    title: "VP Engineering",
    linkedin_url: "https://linkedin.com/in/priya-nair-vpe",
    company: "Memo Health",
    company_size: 420,
    location: "Austin, TX, US",
    industry: "B2B SaaS / HealthTech",
    tech_stack: [
      "Kubernetes",
      "Jenkins",
      "AWS",
      "Java",
      "React",
      "Kafka",
    ],
    hiring_signals: [
      "Principal Engineer - Backend",
      "DevOps Engineer (2 open roles)",
      "Software Engineer - Data Platform",
      "Engineering Manager",
    ],
    funding_events: [
      "Series B $62M led by General Catalyst (January 2024)",
      "Series A $15M (2022)",
    ],
    company_summary:
      "Memo Health builds care coordination software used by 300+ hospital networks and insurance providers. Their platform surfaces care gaps and automates prior authorizations, and they are scaling rapidly after doubling ARR in 2023.",
  },

  {
    id: "lead-004",
    name: "David Park",
    title: "Head of Engineering",
    linkedin_url: "https://linkedin.com/in/david-park-engineering",
    company: "Launchpad HQ",
    company_size: 110,
    location: "Seattle, WA, US",
    industry: "B2B SaaS / Developer Tools",
    tech_stack: [
      "Docker",
      "GitHub Actions",
      "AWS Lambda",
      "TypeScript",
      "Rust",
      "PostgreSQL",
    ],
    hiring_signals: [
      "Senior Full-Stack Engineer",
      "Platform / Infrastructure Engineer",
    ],
    funding_events: [
      "Series A $12M led by Andreessen Horowitz (August 2023)",
    ],
    company_summary:
      "Launchpad HQ is a developer productivity platform that unifies sprint planning, PR review, and on-call schedules into a single workflow hub. It integrates with GitHub, Jira, and PagerDuty and is used by 800+ engineering teams.",
  },

  {
    id: "lead-005",
    name: "Aisha Thompson",
    title: "VP of Engineering",
    linkedin_url: "https://linkedin.com/in/aisha-thompson-vpe",
    company: "Rentable",
    company_size: 340,
    location: "Chicago, IL, US",
    industry: "B2B SaaS / PropTech",
    tech_stack: [
      "Kubernetes",
      "Bitbucket Pipelines",
      "AWS",
      "Ruby on Rails",
      "React",
      "Redis",
    ],
    hiring_signals: [
      "Senior Software Engineer - Backend (4 open roles)",
      "Staff Engineer - Platform",
      "Cloud Infrastructure Engineer",
    ],
    funding_events: [
      "Series B $35M led by Moderne Ventures (October 2023)",
    ],
    company_summary:
      "Rentable is a multifamily housing SaaS platform that powers lease management, rent payments, and maintenance workflows for 1,200+ apartment operators across the US. After their Series B they are rebuilding their monolith into microservices.",
  },
];
