import { useState, useCallback, useMemo } from "react";
import {
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  RefreshCw,
  Eye,
  CheckCircle2,
  Copy,
  BookOpen,
  Check,
  FileCode2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export interface RawProfile {
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  street?: string;
  city?: string;
  town?: string;
  postcode?: string;
  zip?: string;
  country?: string;
  dateOfBirth?: string;
  dob?: string;
  nationalInsurance?: string;
  ssn?: string;
  rightToWork?: string;
  socials?: Record<string, string>;
  experience?: Array<{
    jobTitle?: string;
    title?: string;
    employerName?: string;
    company?: string;
    organization?: string;
    employerType?: string;
    industry?: string;
    country?: string;
    city?: string;
    startYear?: number | string;
    endYear?: number | string;
    tasks?: string[];
    responsibilities?: string[];
    tools?: string[];
    skills?: string[];
  }>;
  qualifications?: Array<{
    name?: string;
    degree?: string;
    field?: string;
    level?: string;
    institution?: string;
    school?: string;
    year?: number | string;
  }>;
  skills?: string[];
  languages?: string[];
  goals?: string;
  careerGoals?: string;
  summary?: string;
  bio?: string;
  preferences?: {
    jobType?: string;
    workMode?: string;
    hours?: string;
    maxTravelMiles?: number;
    desiredSalary?: string;
  };
  [key: string]: unknown;
}

export interface AnonymisedProfile {
  experience: Array<{
    jobTitle: string;
    industrySector: string;
    durationYears: number | string;
    tasks: string[];
    tools: string[];
  }>;
  qualifications: Array<{
    qualification: string;
    levelOrField: string;
  }>;
  skills: string[];
  languages: string[];
  goals: string;
  preferences: {
    jobType: string;
    workMode: string;
    hours: string;
    maxTravelMiles: number;
  };
}

export interface CareerSuggestion {
  title: string;
  fitLevel: "strong" | "stepping_stone" | "long_term";
  summary: string;
  whyItFits: string[];
  transferableSkills: string[];
  upskillingRecommendations: string[];
  salaryRange: string;
  timeframe: string;
  route: string[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}

// ---------------------------------------------------------------------------
// Sample Profiles for Easy Testing
// ---------------------------------------------------------------------------

const SAMPLE_PROFILES: { label: string; description: string; data: RawProfile }[] = [
  {
    label: "Healthcare Administrator -> HealthTech / Ops",
    description: "Experienced clinic supervisor with scheduling, patient data, and compliance skills",
    data: {
      name: "Sarah Jenkins",
      email: "sarah.j.confidential@example.co.uk",
      phone: "+44 7700 900123",
      address: "14 Elm Terrace, Bristol, BS1 4TJ, UK",
      dateOfBirth: "1988-06-15",
      nationalInsurance: "QQ 12 34 56 A",
      experience: [
        {
          jobTitle: "Senior Clinical Operations Supervisor",
          company: "Bristol Regional Health Trust",
          employerType: "Public Healthcare Service",
          city: "Bristol",
          startYear: 2019,
          endYear: 2024,
          tasks: [
            "Coordinated patient admission and scheduling workflows for 12 specialty clinics",
            "Managed team of 14 administrative and frontline intake officers",
            "Monitored regulatory compliance with GDPR and medical record security standards",
            "Streamlined appointment booking, reducing cancellation delays by 22%",
          ],
          tools: ["EMIS Health", "Excel (Advanced Pivot)", "MS Teams", "SystmOne"],
        },
        {
          jobTitle: "Medical Records Coordinator",
          company: "St. Jude Private Medical Centre",
          employerType: "Private Healthcare Clinic",
          startYear: 2016,
          endYear: 2019,
          tasks: [
            "Maintained confidential records database for over 25,000 active patient files",
            "Audited compliance and trained junior personnel on data handling protocols",
          ],
          tools: ["Electronic Health Record (EHR) Systems", "Office 365"],
        },
      ],
      qualifications: [
        {
          name: "BSc Healthcare Management",
          level: "Undergraduate Degree",
          institution: "University of the West of England",
          year: 2016,
        },
        {
          name: "Certified Associate in Project Management (CAPM)",
          level: "Professional Certification",
          institution: "PMI UK",
          year: 2022,
        },
      ],
      skills: [
        "Clinical Operations",
        "Data Compliance (GDPR/HIPAA)",
        "Process Optimization",
        "Team Leadership",
        "Stakeholder Communication",
        "Budget Tracking",
      ],
      languages: ["English (Native)", "French (Conversational)"],
      goals: "I want to transition into healthtech project management or clinical product operations where I can leverage my domain experience.",
      preferences: {
        jobType: "Permanent Full-Time",
        workMode: "Hybrid / Remote",
        hours: "37.5 hours/week",
        maxTravelMiles: 25,
      },
    },
  },
  {
    label: "Retail & Customer Support Lead -> Client Success / Account Ops",
    description: "High-volume customer resolutions, team coaching, and CRM management",
    data: {
      name: "Marcus Vance",
      email: "marcus.vance89@domain.org",
      phone: "+44 7911 123456",
      address: "88 high street, Manchester, M4 1HQ",
      dob: "1994-11-20",
      experience: [
        {
          jobTitle: "Customer Operations Lead",
          company: "Apex Retail Solutions Ltd",
          employerType: "E-commerce & Retail Logistics",
          startYear: 2021,
          endYear: 2024,
          tasks: [
            "Led team of 12 customer support representatives handling 3,500+ weekly inquiries",
            "Analyzed churn metrics and built SLA response playbooks improving CSAT from 82% to 94%",
            "Conducted root-cause resolution for high-value enterprise order disputes",
          ],
          tools: ["Zendesk", "Salesforce Service Cloud", "Slack", "Jira Service Desk"],
        },
        {
          jobTitle: "Store Assistant Manager",
          company: "Highline Lifestyle Stores",
          employerType: "High-Street Retail",
          startYear: 2018,
          endYear: 2021,
          tasks: [
            "Oversaw daily inventory audit and store cash flow balancing",
            "Onboarded and trained 20+ new retail associates",
          ],
          tools: ["Square POS", "SAP Retail"],
        },
      ],
      qualifications: [
        {
          name: "BA Business Administration & Communications",
          level: "Bachelor",
          institution: "Manchester Metropolitan University",
          year: 2018,
        },
      ],
      skills: [
        "Client Relationship Management",
        "SLA Governance",
        "De-escalation",
        "Cross-functional Collaboration",
        "Onboarding & Training",
        "CRM Reporting",
      ],
      languages: ["English (Native)", "Spanish (B1)"],
      goals: "Looking for an Account Executive, Customer Success Manager, or Business Client Onboarding role in B2B SaaS.",
      preferences: {
        jobType: "Full-Time",
        workMode: "Hybrid or Remote",
        hours: "40 hours",
        maxTravelMiles: 20,
      },
    },
  },
  {
    label: "Junior Developer -> AI & Solutions Engineer",
    description: "Full-stack web engineer looking to pivot into AI applications and technical architecture",
    data: {
      name: "Alex Zhao",
      email: "alex.zhao.dev@personalmailbox.com",
      phone: "+44 7800 445566",
      address: "Flat 4, 12 Kensington Way, London, W8 5EP",
      experience: [
        {
          jobTitle: "Junior Full Stack Web Developer",
          company: "Nexus Innovations Agency",
          employerType: "Digital Consultancy Agency",
          startYear: 2022,
          endYear: 2024,
          tasks: [
            "Built responsive web applications with TypeScript, React, and Node.js REST APIs",
            "Integrated external third-party payment and auth webhooks",
            "Created automated unit test suites achieving 85% code coverage",
          ],
          tools: ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "Git"],
        },
      ],
      qualifications: [
        {
          name: "BSc Computer Science",
          level: "First Class Honours",
          institution: "University of Edinburgh",
          year: 2022,
        },
      ],
      skills: [
        "TypeScript",
        "React",
        "Node.js",
        "REST APIs",
        "SQL Databases",
        "Git & CI/CD Pipelines",
        "Prompt Engineering Basics",
      ],
      languages: ["English (Fluent)", "Mandarin (Native)"],
      goals: "Aspiring to become an AI Solutions Engineer or AI Application Specialist building production LLM apps.",
      preferences: {
        jobType: "Full-time",
        workMode: "Remote or Central London",
        hours: "Full Time",
        maxTravelMiles: 15,
      },
    },
  },
];

// ---------------------------------------------------------------------------
// PII Sanitization Engine
// Strips personal and confidential details before payload dispatch
// ---------------------------------------------------------------------------

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function redactSensitiveText(text: string, entitiesToRedact: string[] = []): string {
  if (!text) return "";
  let sanitized = text;

  // Redact emails
  sanitized = sanitized.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    "[CONFIDENTIAL_EMAIL]"
  );

  // Redact phone numbers (UK, international, common mobile patterns)
  sanitized = sanitized.replace(
    /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}\b/g,
    "[CONFIDENTIAL_PHONE]"
  );

  // Redact UK postcodes or international zip codes
  sanitized = sanitized.replace(
    /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi,
    "[CONFIDENTIAL_POSTCODE]"
  );

  // Redact known confidential entities (names, employer names, institutions, cities)
  for (const entity of entitiesToRedact) {
    if (!entity || entity.trim().length < 3) continue;
    const escaped = escapeRegex(entity.trim());
    const reg = new RegExp(`\\b${escaped}\\b`, "gi");
    sanitized = sanitized.replace(reg, "[CONFIDENTIAL_ORGANIZATION]");
  }

  return sanitized;
}

export function anonymiseProfile(profile: RawProfile): AnonymisedProfile {
  // Collect all known confidential entities to scrub from free text
  const entitiesToScrub: string[] = [];

  const addEntity = (val?: string) => {
    if (val && typeof val === "string") {
      const clean = val.trim();
      if (clean.length >= 3 && !entitiesToScrub.includes(clean)) {
        entitiesToScrub.push(clean);
        // Also extract distinctive root words from entity names (e.g., "Secret" from "Secret Global Financial Ltd")
        const words = clean.split(/\s+/);
        for (const w of words) {
          const stripped = w.replace(/[^A-Za-z0-9]/g, "");
          if (
            stripped.length >= 4 &&
            !["global", "financial", "international", "services", "solutions", "technologies", "systems", "trust", "group", "management"].includes(stripped.toLowerCase())
          ) {
            if (!entitiesToScrub.includes(stripped)) {
              entitiesToScrub.push(stripped);
            }
          }
        }
      }
    }
  };

  addEntity(profile.name);
  addEntity(profile.fullName);
  addEntity(profile.firstName);
  addEntity(profile.lastName);
  addEntity(profile.address);
  addEntity(profile.street);
  addEntity(profile.city);
  addEntity(profile.town);
  addEntity(profile.postcode);
  addEntity(profile.zip);
  addEntity(profile.nationalInsurance);
  addEntity(profile.ssn);

  for (const exp of profile.experience ?? []) {
    addEntity(exp.company);
    addEntity(exp.employerName);
    addEntity(exp.organization);
    addEntity(exp.city);
    addEntity(exp.country);
  }

  for (const q of profile.qualifications ?? []) {
    addEntity(q.institution);
    addEntity(q.school);
  }

  // Sort entities by length descending so longer phrases match first
  entitiesToScrub.sort((a, b) => b.length - a.length);

  return {
    experience: (profile.experience ?? []).map((exp, index) => {
      // Generalize sector or employer type without disclosing actual company name
      const rawSector = exp.employerType || exp.industry;
      const fallbackSector = rawSector
        ? redactSensitiveText(rawSector, entitiesToScrub)
        : `Industry Sector #${index + 1}`;
      
      const start = typeof exp.startYear === "number" ? exp.startYear : Number.parseInt(String(exp.startYear || 0), 10);
      const end = typeof exp.endYear === "number" ? exp.endYear : (exp.endYear ? Number.parseInt(String(exp.endYear), 10) : new Date().getFullYear());
      const duration = start && end && end >= start ? end - start : "1+ years";

      const rawTasks = exp.tasks ?? exp.responsibilities ?? [];
      const sanitizedTasks = rawTasks.map((task) => redactSensitiveText(task, entitiesToScrub));

      return {
        jobTitle: redactSensitiveText(exp.jobTitle ?? exp.title ?? "Professional Role", entitiesToScrub),
        industrySector: fallbackSector,
        durationYears: duration,
        tasks: sanitizedTasks,
        tools: (exp.tools ?? exp.skills ?? []).map((tool) => redactSensitiveText(tool, entitiesToScrub)),
      };
    }),
    qualifications: (profile.qualifications ?? []).map((q) => ({
      qualification: redactSensitiveText(q.name ?? q.degree ?? "Professional Qualification", entitiesToScrub),
      levelOrField: redactSensitiveText(q.level ?? q.field ?? "Specialized Field", entitiesToScrub),
    })),
    skills: (profile.skills ?? []).map((s) => redactSensitiveText(s, entitiesToScrub)),
    languages: profile.languages ?? ["English"],
    goals: redactSensitiveText(profile.goals ?? profile.careerGoals ?? profile.summary ?? "", entitiesToScrub),
    preferences: {
      jobType: profile.preferences?.jobType ?? "Any",
      workMode: profile.preferences?.workMode ?? "Flexible",
      hours: profile.preferences?.hours ?? "Full-time",
      maxTravelMiles: profile.preferences?.maxTravelMiles ?? 25,
    },
  };
}

// ---------------------------------------------------------------------------
// High-Fidelity Simulation / Demo Response
// Used when no API key is provided or for offline preview
// ---------------------------------------------------------------------------

function generateSimulatedSuggestions(anon: AnonymisedProfile): CareerSuggestion[] {
  const primaryRole = anon.experience[0]?.jobTitle || "Professional";
  const skillsList = anon.skills.slice(0, 4).join(", ") || "Analytical and operational abilities";

  return [
    {
      title: `${primaryRole} Team Lead / Project Coordinator`,
      fitLevel: "strong",
      summary: `Directly builds on your proven background in ${primaryRole} while taking on higher-impact workflow leadership and project delivery.`,
      whyItFits: [
        `Directly maps to your key experience in ${anon.experience[0]?.industrySector || "your sector"}.`,
        `Capitalizes immediately on demonstrated skills in ${skillsList}.`,
        "Low transition friction with immediate employability.",
      ],
      transferableSkills: anon.skills.slice(0, 4).length > 0 ? anon.skills.slice(0, 4) : ["Workflow Governance", "Team Collaboration", "Problem Solving", "Reporting"],
      upskillingRecommendations: [
        "Agile / Scrum Fundamentals (Scrum Master or Kanban certification)",
        "Stakeholder Communication & Executive Briefing",
      ],
      salaryRange: "£38,000 – £48,000",
      timeframe: "Ready now (Immediate fit)",
      route: [
        "Step 1: Align existing portfolio to emphasize cross-team leadership",
        "Step 2: Complete targeted Agile delivery or workflow sprint",
        "Step 3: Secure Team Lead / Project Coordinator placement",
      ],
    },
    {
      title: "Operations & Client Implementation Specialist",
      fitLevel: "stepping_stone",
      summary: "Combines domain problem-solving with client onboarding, process enhancement, and software implementations.",
      whyItFits: [
        "Transforms operational expertise into high-demand customer implementation consulting.",
        "Allows you to leverage systems and tools knowledge with external client accounts.",
        "Strong market growth and clear progression to Senior Implementation Consultant.",
      ],
      transferableSkills: ["Process Optimization", "Client Onboarding", "Requirement Gathering", "Cross-functional Coordination"],
      upskillingRecommendations: [
        "SaaS Implementation methodologies",
        "CRM/ERP integration overview",
      ],
      salaryRange: "£42,000 – £52,000",
      timeframe: "3 – 6 months",
      route: [
        "Step 1: Showcase process automation and efficiency gains on CV",
        "Step 2: Shadow implementation workshops and build case studies",
        "Step 3: Step into Client Success or Technical Implementation roles",
      ],
    },
    {
      title: "Strategic Operations / Product Operations Manager",
      fitLevel: "long_term",
      summary: "An aspirational, high-impact career path focusing on enterprise business strategy, tooling automation, and organizational scale.",
      whyItFits: [
        "Strategic evolution from day-to-day execution to long-term architectural operations.",
        "High earning trajectory and executive visibility.",
        "Benefits immensely from genuine frontline experience that purely theoretical managers lack.",
      ],
      transferableSkills: ["Strategic Planning", "Data-driven Decision Making", "Change Management", "Vendor & Tool Management"],
      upskillingRecommendations: [
        "Advanced Data Analytics (SQL, BI Dashboards)",
        "Product Management Foundations / Pragmatic Institute",
      ],
      salaryRange: "£55,000 – £72,000",
      timeframe: "6 – 12 months",
      route: [
        "Step 1: Lead multi-department efficiency initiatives in current scope",
        "Step 2: Acquire certification in Product/Data Analytics",
        "Step 3: Transition to Strategic Operations or Product Operations Lead",
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Gemini AI API Call
// ---------------------------------------------------------------------------

async function fetchSuggestionsFromGemini(
  apiKey: string,
  anonymisedProfile: AnonymisedProfile
): Promise<CareerSuggestion[]> {
  const prompt = `You are an expert career transition advisor and talent architect.
Analyze the following ANONYMISED candidate profile (personal names, exact contact details, addresses, and employer identities have been strictly removed for confidentiality).

Generate EXACTLY 3 realistic, high-potential career trajectory options for this profile:
1. Option 1: "strong" fit (Immediate transition leveraging existing strengths)
2. Option 2: "stepping_stone" (Tactical transition opening new growth areas in 3-6 months)
3. Option 3: "long_term" (Aspirational career milestone reachable in 6-12 months with upskilling)

CANDIDATE ANONYMISED PROFILE:
${JSON.stringify(anonymisedProfile, null, 2)}

Strict requirements:
- Respond ONLY with a valid JSON array of exactly 3 objects.
- Do NOT output markdown code fences, backticks, or introduction text.
- Each object MUST follow this exact JSON schema:
{
  "title": string,
  "fitLevel": "strong" | "stepping_stone" | "long_term",
  "summary": string,
  "whyItFits": string[],
  "transferableSkills": string[],
  "upskillingRecommendations": string[],
  "salaryRange": string,
  "timeframe": string,
  "route": string[]
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1800,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorBody}`);
  }

  const data: GeminiResponse = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed: CareerSuggestion[] = JSON.parse(cleaned);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Unable to parse structured career options from Gemini response.");
  }
  return parsed.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Card Presentation Component
// ---------------------------------------------------------------------------

const fitConfig = {
  strong: {
    label: "Strong Fit (Ready Now)",
    variant: "success" as const,
    gradient: "from-emerald-500/10 via-background to-teal-500/5",
    border: "border-emerald-500/30",
    badgeBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  stepping_stone: {
    label: "Stepping Stone (3 – 6 mo)",
    variant: "soft" as const,
    gradient: "from-blue-500/10 via-background to-indigo-500/5",
    border: "border-blue-500/30",
    badgeBg: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  },
  long_term: {
    label: "Long-Term Goal (6 – 12 mo)",
    variant: "warning" as const,
    gradient: "from-amber-500/10 via-background to-orange-500/5",
    border: "border-amber-500/30",
    badgeBg: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
};

function CareerOptionCard({
  suggestion,
  index,
}: {
  suggestion: CareerSuggestion;
  index: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const fit = fitConfig[suggestion.fitLevel] ?? fitConfig.stepping_stone;

  const handleCopySummary = () => {
    const text = `${suggestion.title} (${fit.label})\nSalary: ${suggestion.salaryRange}\nTimeframe: ${suggestion.timeframe}\n\nSummary: ${suggestion.summary}\n\nWhy it fits:\n${suggestion.whyItFits.map((w) => `• ${w}`).join("\n")}\n\nCareer Roadmap:\n${suggestion.route.join(" -> ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article
      id={`career-suggestion-${index + 1}`}
      className={cn(
        "flex flex-col rounded-2xl border bg-gradient-to-br p-6 shadow-sm transition-all duration-300 hover:shadow-md",
        fit.gradient,
        fit.border
      )}
    >
      {/* Header & Badges */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            fit.badgeBg
          )}
        >
          {fit.label}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={handleCopySummary}
          title="Copy career summary"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-600" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Title & Summary */}
      <h3 className="mt-3 text-xl font-bold tracking-tight text-foreground">
        {suggestion.title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        {suggestion.summary}
      </p>

      {/* Meta Stats: Salary & Readiness */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/50 bg-background/80 p-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="size-3.5 text-primary" aria-hidden />
            <span className="text-[11px] font-medium uppercase tracking-wider">Salary Band</span>
          </div>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">
            {suggestion.salaryRange}
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-background/80 p-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-3.5 text-primary" aria-hidden />
            <span className="text-[11px] font-medium uppercase tracking-wider">Timeline</span>
          </div>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">
            {suggestion.timeframe}
          </p>
        </div>
      </div>

      {/* Transferable Skills Chips */}
      <div className="mt-4">
        <span className="text-xs font-medium text-muted-foreground">Transferable Skills:</span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {suggestion.transferableSkills.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs font-normal">
              {s}
            </Badge>
          ))}
        </div>
      </div>

      {/* Accordion Toggle */}
      <button
        type="button"
        id={`career-suggestion-${index + 1}-toggle`}
        className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-sm font-medium text-primary transition-opacity hover:opacity-80"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span>{expanded ? "Hide trajectory roadmap" : "View rationale & roadmap"}</span>
        {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>

      {/* Expanded Sections */}
      {expanded && (
        <div className="mt-3 space-y-4 pt-1">
          {/* Why this fits */}
          <div>
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-600" /> Why this fits you
            </h4>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {suggestion.whyItFits.map((point) => (
                <li key={point} className="flex items-start gap-2 text-xs leading-relaxed">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Upskilling Recommendations */}
          {suggestion.upskillingRecommendations && suggestion.upskillingRecommendations.length > 0 && (
            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                <BookOpen className="size-3.5 text-blue-600" /> Recommended Upskilling
              </h4>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {suggestion.upskillingRecommendations.map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-blue-500" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Realistic Transition Pathway */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Transition Pathway
            </h4>
            <div className="mt-2 space-y-2 rounded-xl border border-border/50 bg-background/90 p-3">
              {suggestion.route.map((step, sIdx) => (
                <div key={step} className="flex items-start gap-2 text-xs">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
                    {sIdx + 1}
                  </span>
                  <span className={sIdx === 0 ? "font-medium text-foreground" : "text-muted-foreground"}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Loading Cards
// ---------------------------------------------------------------------------

function SkeletonCards() {
  return (
    <div className="grid gap-6 lg:grid-cols-3" aria-busy="true" aria-label="Analyzing profile...">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-3 rounded-2xl border bg-card p-6 shadow-sm">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="mt-2 h-7 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
          <div className="mt-2 flex gap-2">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-14 rounded-md" />
          </div>
          <Skeleton className="mt-4 h-24 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main CareerSuggester Component
// ---------------------------------------------------------------------------

export function CareerSuggester() {
  const [jsonInput, setJsonInput] = useState(() => JSON.stringify(SAMPLE_PROFILES[0].data, null, 2));
  const [apiKey, setApiKey] = useState(
    (typeof import.meta !== "undefined"
      ? (import.meta.env?.VITE_GEMINI_API_KEY as string | undefined)
      : undefined) ?? ""
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState<"input" | "preview">("input");
  const [suggestions, setSuggestions] = useState<CareerSuggestion[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [usedSimulator, setUsedSimulator] = useState(false);

  // Validate JSON string
  const validateJson = useCallback((value: string): RawProfile | null => {
    if (!value.trim()) {
      setJsonError("Profile JSON cannot be empty.");
      return null;
    }
    try {
      const parsed = JSON.parse(value) as RawProfile;
      setJsonError("");
      return parsed;
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON syntax.");
      return null;
    }
  }, []);

  // Compute anonymised version in real-time
  const parsedProfile = useMemo(() => {
    try {
      return JSON.parse(jsonInput) as RawProfile;
    } catch {
      return null;
    }
  }, [jsonInput]);

  const anonymisedPayload = useMemo(() => {
    if (!parsedProfile) return null;
    return anonymiseProfile(parsedProfile);
  }, [parsedProfile]);

  const handleInputChange = (value: string) => {
    setJsonInput(value);
    validateJson(value);
    if (suggestions) setSuggestions(null);
  };

  const handleLoadSample = (sample: RawProfile) => {
    const formatted = JSON.stringify(sample, null, 2);
    setJsonInput(formatted);
    validateJson(formatted);
    if (suggestions) setSuggestions(null);
  };

  const handleFormatJson = () => {
    const valid = validateJson(jsonInput);
    if (valid) {
      setJsonInput(JSON.stringify(valid, null, 2));
    }
  };

  // Run Career Suggestion Analysis
  const handleAnalyse = async (forceDemo = false) => {
    const profile = validateJson(jsonInput);
    if (!profile) return;

    const anonymised = anonymiseProfile(profile);

    setStatus("loading");
    setErrorMsg("");
    setSuggestions(null);

    // If user clicked demo or no API key is set, use the built-in intelligent engine
    if (forceDemo || !apiKey.trim()) {
      setTimeout(() => {
        const results = generateSimulatedSuggestions(anonymised);
        setSuggestions(results);
        setUsedSimulator(true);
        setStatus("success");
      }, 750);
      return;
    }

    // Call real Google Gemini API
    try {
      setUsedSimulator(false);
      const results = await fetchSuggestionsFromGemini(apiKey.trim(), anonymised);
      setSuggestions(results);
      setStatus("success");
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while communicating with the AI service."
      );
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* Page Title & Hero */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Briefcase className="size-5" aria-hidden />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Career Trajectory Suggester
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Provide a candidate's profile JSON to receive 3 tailored career paths. All personal identifiers are removed locally before sending to AI.
          </p>
        </div>
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <div className="space-y-1">
          <p className="font-semibold text-emerald-900 dark:text-emerald-200">
            Guaranteed Confidentiality & Local PII Redaction
          </p>
          <p className="text-xs leading-relaxed opacity-90">
            Names, personal emails, phone numbers, home addresses, dates of birth, National Insurance numbers, and specific employer brand identities are purged locally. Only generalized role responsibilities, transferable skills, and qualifications leave your browser.
          </p>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* Workspace Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-6 py-3.5">
          {/* Tabs: Input vs Sanitized Preview */}
          <div className="flex items-center gap-1 rounded-lg bg-background p-1 border">
            <button
              type="button"
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
                activeTab === "input"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab("input")}
            >
              <FileCode2 className="size-3.5" />
              Profile JSON Input
            </button>
            <button
              type="button"
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
                activeTab === "preview"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab("preview")}
            >
              <Eye className="size-3.5" />
              Inspect Redacted Payload ({anonymisedPayload ? "Ready" : "Empty"})
            </button>
          </div>

          {/* Quick Preset Profiles */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Load sample:</span>
            <div className="flex flex-wrap gap-1">
              {SAMPLE_PROFILES.map((sample, idx) => (
                <Button
                  key={sample.label}
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] px-2.5"
                  onClick={() => handleLoadSample(sample.data)}
                >
                  Preset {idx + 1}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] px-2"
              onClick={handleFormatJson}
              title="Prettify JSON indentation"
            >
              Prettify
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "input" ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="career-suggester-json" className="text-sm font-semibold text-foreground">
                    Candidate Profile (JSON)
                  </label>
                  {jsonError && (
                    <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                      <AlertTriangle className="size-3" /> Invalid JSON
                    </span>
                  )}
                </div>
                <Textarea
                  id="career-suggester-json"
                  value={jsonInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Paste profile JSON here..."
                  className="h-64 font-mono text-xs leading-relaxed"
                  aria-invalid={!!jsonError}
                />
                {jsonError && (
                  <p className="text-xs text-destructive">{jsonError}</p>
                )}
              </div>

              {/* API Configuration & Controls */}
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="career-suggester-apikey" className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <span>Google Gemini API Key</span>
                      <span className="text-muted-foreground font-normal">(optional if using Demo)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="career-suggester-apikey"
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="AIzaSy... (leave blank to use instant demo mode)"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        autoComplete="off"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        id="career-suggester-apikey-toggle"
                        onClick={() => setShowApiKey((v) => !v)}
                        className="h-9 px-3 text-xs shrink-0"
                      >
                        {showApiKey ? "Hide" : "Show"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end gap-2 sm:flex-row sm:items-center">
                    <Button
                      id="career-suggester-demo-submit"
                      variant="outline"
                      size="default"
                      onClick={() => handleAnalyse(true)}
                      disabled={!!jsonError || status === "loading"}
                      className="w-full sm:w-auto text-xs"
                    >
                      Instant Demo Analysis
                    </Button>

                    <Button
                      id="career-suggester-submit"
                      onClick={() => handleAnalyse(false)}
                      disabled={!!jsonError || status === "loading"}
                      className="w-full sm:w-auto text-xs gap-1.5"
                    >
                      {status === "loading" ? (
                        <>
                          <RefreshCw className="size-3.5 animate-spin" />
                          Processing…
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3.5" />
                          Generate 3 Career Options
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Sanitized Payload Preview Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Sanitized Transmission Payload
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    This is the exact JSON structure dispatched to the AI model. Notice all names, contact records, and company brands are stripped.
                  </p>
                </div>
                <Badge variant="success">PII Stripped</Badge>
              </div>
              <pre className="max-h-72 overflow-auto rounded-xl border bg-muted/40 p-4 font-mono text-xs text-foreground leading-relaxed">
                {anonymisedPayload
                  ? JSON.stringify(anonymisedPayload, null, 2)
                  : "// Unable to generate preview. Please provide valid JSON in the input tab."}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {status === "loading" && <SkeletonCards />}

      {/* Error Message */}
      {status === "error" && errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold">Analysis Failed</p>
            <p className="text-xs opacity-90 leading-relaxed">{errorMsg}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAnalyse(true)}
              className="mt-2 text-xs"
            >
              Try with simulated demo response instead
            </Button>
          </div>
        </div>
      )}

      {/* Career Suggestions Results Section */}
      {status === "success" && suggestions && (
        <section aria-label="3 Career Options" className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  3 Recommended Career Pathways
                </h2>
                {usedSimulator ? (
                  <Badge variant="secondary" className="text-[11px]">
                    Simulated Engine
                  </Badge>
                ) : (
                  <Badge variant="soft" className="text-[11px]">
                    Gemini AI Powered
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Synthesized exclusively from anonymised functional skills and career milestones.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              id="career-suggester-regenerate"
              onClick={() => handleAnalyse(false)}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className="size-3.5" aria-hidden />
              Regenerate
            </Button>
          </div>

          {/* Cards Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {suggestions.map((option, index) => (
              <CareerOptionCard
                key={`${option.title}-${index}`}
                suggestion={option}
                index={index}
              />
            ))}
          </div>

          {/* Compliance & Verification Disclaimer */}
          <div className="rounded-xl border border-border/50 bg-muted/30 p-4 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <HelpCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p>
                Career suggestions and compensation benchmarks are AI-estimated advisory indicators. All confidential person records remained protected during synthesis. Always verify qualification prerequisites and regulatory certifications with prospective hiring managers.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
