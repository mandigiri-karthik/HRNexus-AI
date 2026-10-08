import type { Application } from "@/lib/types";

export const demoApplications: Application[] = [
  {
    id: "a1",
    jobId: "v5",
    jobTitle: "Project Support Officer",
    employer: "Blackdown Housing Trust",
    status: "saved",
    updatedAt: "2026-10-03T09:00:00Z",
  },
  {
    id: "a2",
    jobId: "v4",
    jobTitle: "Operations Administrator",
    employer: "Levels Healthcare Services",
    status: "applied",
    appliedAt: "2026-09-26T11:00:00Z",
    updatedAt: "2026-09-26T11:00:00Z",
  },
  {
    id: "a3",
    jobId: "v3",
    jobTitle: "Logistics Supervisor",
    employer: "Parrett Distribution Co",
    status: "applied",
    appliedAt: "2026-09-30T15:00:00Z",
    updatedAt: "2026-09-30T15:00:00Z",
  },
  {
    id: "a4",
    jobId: "v6",
    jobTitle: "Warehouse Operations Lead",
    employer: "Brue Logistics Park",
    status: "rejected",
    appliedAt: "2026-09-15T10:00:00Z",
    notes: "Needed forklift licence.",
    updatedAt: "2026-09-29T10:00:00Z",
  },
];
