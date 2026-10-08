import type { Application, InterviewFeedback, Recommendation } from "@/lib/types";

export function buildRecommendations(
  apps: Application[],
  interviews: InterviewFeedback[],
  rejectionReasons: string[],
): Recommendation[] {
  const applied = apps.filter((a) =>
    ["applied", "interview", "rejected", "offer"].includes(a.status),
  ).length;
  const gotInterviews = apps.filter((a) => a.status === "interview").length;
  const recs: Recommendation[] = [];

  if (applied > 0 && gotInterviews === 0) {
    recs.push({
      id: "r1",
      type: "targeting",
      title: "Review your CV and job targeting",
      reason: `You've applied for ${applied} job${applied === 1 ? "" : "s"} and had no interviews yet. A tailored CV for your strongest match could help.`,
      actionLabel: "Tailor my CV",
      actionRoute: "/apply/v1",
    });
  } else if (gotInterviews > 0) {
    recs.push({
      id: "r1",
      type: "interview",
      title: "Practise interviews next",
      reason: "You're getting interviews. Practice can help turn them into offers.",
      actionLabel: "Practise now",
      actionRoute: "/interview/v1",
    });
  }

  if (interviews.length >= 2) {
    const first = interviews[0].overallScore;
    const last = interviews[interviews.length - 1].overallScore;
    recs.push({
      id: "r2",
      type: "interview",
      title: "Keep up your interview practice",
      reason: `Your practice score went from ${first} to ${last}. One more session focused on STAR examples could push you higher.`,
      actionLabel: "Practise interview",
      actionRoute: "/interview/v1",
    });
  } else {
    recs.push({
      id: "r2",
      type: "interview",
      title: "Try your first practice interview",
      reason: "A 10-minute practice helps you feel ready for real interviews.",
      actionLabel: "Start practice",
      actionRoute: "/interview",
    });
  }

  if (rejectionReasons.some((r) => /licen|skill|qualif|experience/i.test(r))) {
    recs.push({
      id: "r4",
      type: "skills",
      title: "Close a skills gap",
      reason: "Recent feedback mentioned a missing skill or qualification. Check your next steps.",
      actionLabel: "See skills gaps",
      actionRoute: "/gaps",
    });
  }

  recs.push({
    id: "r3",
    type: "jobs",
    title: "Focus on Operations Coordinator roles",
    reason: "Your strongest matches (up to 88%) are Operations Coordinator roles near Taunton.",
    actionLabel: "View these jobs",
    actionRoute: "/jobs?careerOptionId=co1",
  });

  return recs;
}
