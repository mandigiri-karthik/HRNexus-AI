import type { GapAnalysis, NextStep } from "@/lib/types";

const nextSteps = (prefix: string): NextStep[] => [
  {
    id: `${prefix}-ns1`,
    title: "Get an Ecctis statement for your degree",
    priority: "high",
    timeEstimate: "2–4 weeks",
    whyItMatters: "UK employers can see how your BA compares to a UK degree.",
    whatToDo: "Apply online for a Statement of Comparability.",
    type: "user",
    officialUrl: "https://www.ecctis.com",
    done: false,
  },
  {
    id: `${prefix}-ns2`,
    title: "Create a UK-style CV",
    priority: "high",
    timeEstimate: "30 minutes",
    whyItMatters: "UK CVs are short, have no photo, and lead with results.",
    whatToDo: "Let us draft a CV tailored to a matching job, then check it.",
    type: "ai",
    aiAction: "cv",
    done: false,
  },
  {
    id: `${prefix}-ns3`,
    title: "Volunteer to gain UK experience and a reference",
    priority: "medium",
    timeEstimate: "4–8 hours a week",
    whyItMatters: "A UK reference builds trust with employers.",
    whatToDo: "Look for operations or admin volunteering near you.",
    type: "user",
    officialUrl: "https://do-it.org",
    done: false,
  },
  {
    id: `${prefix}-ns4`,
    title: "Practise interview answers",
    priority: "medium",
    timeEstimate: "10 minutes",
    whyItMatters: "UK interviews often use the STAR method.",
    whatToDo: "Do a practice voice interview and read the feedback.",
    type: "ai",
    aiAction: "interview",
    done: false,
  },
  {
    id: `${prefix}-ns5`,
    title: "Consider the APM Project Fundamentals Qualification",
    priority: "low",
    timeEstimate: "2–3 months",
    whyItMatters: "Many project coordinator adverts ask for PRINCE2 or APM PFQ.",
    whatToDo: "Read about the qualification and check for funded courses.",
    type: "user",
    officialUrl: "https://www.apm.org.uk/qualifications-and-training/",
    done: false,
  },
];

export function buildGaps(careerOptionId: string): GapAnalysis {
  return {
    careerOptionId,
    have: [
      { item: "Team leadership", profileSource: "Work experience: Led a team of 12" },
      { item: "Budgeting", profileSource: "Skills: Budgeting" },
      { item: "Excel", profileSource: "Skills: Excel" },
      { item: "SAP", profileSource: "Skills: SAP" },
    ],
    missing: [
      { item: "UK workplace experience", importance: "Often asked for" },
      { item: "UK reference", importance: "Usually needed before starting" },
      { item: "PRINCE2 or APM PFQ", importance: "Helpful for project roles" },
      { item: "Ecctis statement", importance: "Helps employers understand your degree" },
    ],
    nextSteps: nextSteps(careerOptionId),
  };
}
