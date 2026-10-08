import type { Profile, User } from "@/lib/types";

export const demoUser: User = { id: "u1", name: "Amira Haddad", email: "amira@example.com" };

export const demoProfile: Profile = {
  id: "p1",
  userId: "u1",
  name: "Amira Haddad",
  town: "Taunton",
  homeLanguage: "Arabic",
  rightToWork: "Refugee status",
  experience: [
    {
      id: "we1",
      jobTitle: "Operations Manager",
      employerType: "Logistics company",
      country: "Jordan (Amman)",
      startYear: 2015,
      endYear: 2024,
      tasks: [
        "Led a team of 12",
        "Planned staff and delivery schedules",
        "Managed suppliers",
        "Set and tracked budgets",
      ],
      tools: ["Excel", "SAP"],
    },
  ],
  qualifications: [
    { id: "q1", name: "BA Business Administration", country: "Jordan", level: "Bachelor's degree" },
  ],
  skills: ["Team leadership", "Scheduling", "Supplier management", "Budgeting", "Excel", "SAP"],
  languages: ["Arabic (native)", "English (good)"],
  goals: "An operations or project coordination role in Somerset.",
  preferences: { jobType: "Permanent", hours: "Full-time", maxTravelMiles: 15 },
  updatedAt: "2026-09-20T10:00:00Z",
};

export function emptyProfile(user: User): Profile {
  return {
    id: "p-" + user.id,
    userId: user.id,
    name: user.name,
    town: "",
    homeLanguage: "English",
    rightToWork: "",
    experience: [],
    qualifications: [],
    skills: [],
    languages: [],
    goals: "",
    preferences: { jobType: "Permanent", hours: "Full-time", maxTravelMiles: 15 },
    updatedAt: new Date().toISOString(),
  };
}

/** What a parsed CV returns in mock mode. */
export const parsedCv: Partial<Profile> = {
  town: demoProfile.town,
  homeLanguage: demoProfile.homeLanguage,
  experience: demoProfile.experience,
  qualifications: demoProfile.qualifications,
  skills: demoProfile.skills,
  languages: demoProfile.languages,
};
