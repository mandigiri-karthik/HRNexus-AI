import type {
  ApplicationDraft,
  DocType,
  DraftParagraph,
  Profile,
  Tone,
  Vacancy,
} from "@/lib/types";

export function buildDraft(
  id: string,
  job: Vacancy,
  docType: DocType,
  tone: Tone,
  profile: Profile,
): ApplicationDraft {
  const exp = profile.experience[0];
  const expSource = exp
    ? `Work experience: ${exp.jobTitle}, ${exp.startYear}–${exp.endYear}`
    : "Work experience";
  const years = exp ? exp.endYear - exp.startYear : 0;
  const qual = profile.qualifications[0];
  const warm = tone === "warm";

  const opening: Record<DocType, string> = {
    statement: warm
      ? `I was really pleased to see the ${job.title} role at ${job.employer}.`
      : `I am applying for the ${job.title} role at ${job.employer}.`,
    cover_letter: `Dear Hiring Manager, ${warm ? "I'd love to be considered" : "I would like to apply"} for the ${job.title} position.`,
    eoi: `I would like to express my interest in ${job.title} opportunities at ${job.employer}.`,
    cv: `Profile: Experienced ${exp?.jobTitle ?? "professional"} now based in ${profile.town || "the UK"}, looking for a ${job.title} role.`,
  };

  const p: DraftParagraph[] = [
    {
      id: "d1",
      text: `${opening[docType]} I have ${years} years of experience as ${exp ? `an ${exp.jobTitle} at a ${exp.employerType.toLowerCase()} in ${exp.country}` : "a manager"}, and I now live in ${profile.town || "the area"}.`,
      profileSource: expSource,
    },
    {
      id: "d2",
      text: `In my last role I ${exp?.tasks.slice(0, 2).join(" and ").toLowerCase() ?? "organised daily work"}.`,
      profileSource: "Work experience: tasks",
    },
    {
      id: "d3",
      text: `I ${exp?.tasks.slice(2).join(" and ").toLowerCase() || "worked with suppliers"}, using ${profile.skills.filter((s) => ["Excel", "SAP"].includes(s)).join(" and ") || "spreadsheets"} to keep track of costs and progress.`,
      profileSource: `Skills: ${profile.skills.slice(0, 4).join(", ")}`,
    },
    {
      id: "d4",
      text: "I also hold a PRINCE2 Practitioner certificate and reduced delivery costs by 30%.",
      profileSource: null,
      unsupported: true,
    } as DraftParagraph,
    {
      id: "d5",
      text: `I hold a ${qual?.name ?? "degree"}${qual ? ` from ${qual.country}` : ""} and I speak ${profile.languages.join(" and ") || "English"}.`,
      profileSource: qual ? `Qualifications: ${qual.name} (${qual.country})` : "Languages",
    },
    {
      id: "d6",
      text: warm
        ? `I'd be glad to talk about how my experience could help your team at ${job.employer}.`
        : `I would welcome the opportunity to discuss how my experience could support ${job.employer}.`,
      profileSource: "Career goals",
    },
  ].map((x) => ({ unsupported: false, ...x }));

  return { id, jobId: job.id, docType, tone, paragraphs: p, createdAt: new Date().toISOString() };
}
