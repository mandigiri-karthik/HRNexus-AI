import type { CareerOption } from "@/lib/types";

export const careerOptions: CareerOption[] = [
  {
    id: "co1",
    title: "Operations Coordinator",
    fitLevel: "strong",
    whyItFits: [
      {
        text: "You ran day-to-day operations for 9 years.",
        profileSource: "Work experience: Operations Manager, 2015–2024",
      },
      {
        text: "You planned schedules and managed suppliers.",
        profileSource: "Work experience: tasks",
      },
      {
        text: "You use Excel and SAP, which UK operations teams rely on.",
        profileSource: "Skills: Excel, SAP",
      },
    ],
    transferableSkills: ["Scheduling", "Supplier management", "Budgeting", "Excel", "SAP"],
    salaryRange: "£25,000 – £31,000",
    timeframe: "Ready now – 3 months",
    regulated: { isRegulated: false },
    route: ["Operations Coordinator", "Senior Operations Coordinator", "Operations Manager"],
    selected: false,
  },
  {
    id: "co2",
    title: "Project Coordinator",
    fitLevel: "strong",
    whyItFits: [
      {
        text: "You led a team of 12 and kept work on track.",
        profileSource: "Work experience: Led a team of 12",
      },
      { text: "You set and tracked budgets.", profileSource: "Skills: Budgeting" },
      { text: "Your goal mentions project coordination.", profileSource: "Career goals" },
    ],
    transferableSkills: ["Team leadership", "Budgeting", "Planning", "Stakeholder contact"],
    salaryRange: "£26,000 – £32,000",
    timeframe: "3 – 6 months",
    regulated: { isRegulated: false },
    route: ["Project Coordinator", "Project Officer", "Project Manager"],
    selected: false,
  },
  {
    id: "co3",
    title: "Logistics Supervisor",
    fitLevel: "stepping_stone",
    whyItFits: [
      {
        text: "Your whole career has been in logistics.",
        profileSource: "Work experience: Logistics company",
      },
      {
        text: "You supervised a team and planned deliveries.",
        profileSource: "Work experience: tasks",
      },
    ],
    transferableSkills: ["Team leadership", "Delivery planning", "SAP"],
    salaryRange: "£27,000 – £32,000",
    timeframe: "Ready now",
    regulated: {
      isRegulated: true,
      body: "DVSA",
      note: "Some transport manager roles need a Certificate of Professional Competence (CPC).",
    },
    route: ["Logistics Supervisor", "Transport Planner", "Logistics Manager"],
    selected: false,
  },
];

export const alternativeOption: CareerOption = {
  id: "co4",
  title: "Procurement Assistant",
  fitLevel: "long_term",
  whyItFits: [
    {
      text: "You managed supplier relationships.",
      profileSource: "Work experience: Managed suppliers",
    },
    { text: "You understand budgets and costs.", profileSource: "Skills: Budgeting" },
  ],
  transferableSkills: ["Supplier management", "Negotiation", "Excel"],
  salaryRange: "£23,000 – £28,000",
  timeframe: "6 – 12 months",
  regulated: {
    isRegulated: true,
    body: "CIPS",
    note: "Chartered title needs professional body membership (CIPS).",
  },
  route: ["Procurement Assistant", "Buyer", "Procurement Manager"],
  selected: false,
};
