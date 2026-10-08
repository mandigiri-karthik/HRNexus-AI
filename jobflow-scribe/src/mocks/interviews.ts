import type { InterviewFeedback, Profile, TranscriptTurn, Vacancy } from "@/lib/types";

export function questionsFor(job: Vacancy): string[] {
  return [
    `Tell me about yourself and why you want this ${job.title} role.`,
    "Describe a time you had to manage several priorities at once.",
    "Tell me about a problem with a supplier and how you solved it.",
    "How do you keep a team motivated when work is busy?",
    `What would you do in your first month at ${job.employer}?`,
  ];
}

const strongerAnswers = (p: Profile): string[] => {
  const exp = p.experience[0];
  const role = exp
    ? `${exp.jobTitle} at a ${exp.employerType.toLowerCase()} in ${exp.country}`
    : "my last role";
  return [
    `I worked for ${exp ? exp.endYear - exp.startYear : "several"} years as ${role}. I ${exp?.tasks[0]?.toLowerCase() ?? "led a team"}. I now live in ${p.town || "the area"} and want to use these skills in a UK team.`,
    `Situation: as ${role}, schedules often clashed. Task: I had to plan staff and deliveries. Action: I built a weekly plan in Excel and agreed priorities with the team. Result: work was delivered on time.`,
    `Situation: a supplier was late. Task: I needed to protect our deliveries. Action: I spoke to them directly and arranged a backup. Result: our customers were not affected.`,
    `I ${exp?.tasks[0]?.toLowerCase() ?? "led a team"}. I held short daily check-ins and shared the plan clearly, so everyone knew what mattered most.`,
    `I would learn your systems, meet the team and suppliers, and use my experience with ${p.skills.slice(0, 2).join(" and ") || "planning"} to support daily operations.`,
  ];
};

const translations: Record<string, string> = {
  Arabic: "أجوبتك واضحة ومرتبطة بخبرتك. حاول استخدام طريقة STAR وأضف نتائج واضحة لكل مثال.",
  Ukrainian:
    "Ваші відповіді чіткі та пов'язані з досвідом. Використовуйте метод STAR і додавайте результати.",
  Polish:
    "Twoje odpowiedzi są jasne i związane z doświadczeniem. Używaj metody STAR i podawaj wyniki.",
  Spanish:
    "Tus respuestas son claras y están ligadas a tu experiencia. Usa el método STAR y añade resultados.",
  French:
    "Vos réponses sont claires et liées à votre expérience. Utilisez la méthode STAR et ajoutez des résultats.",
};

export function buildFeedback(
  id: string,
  sessionId: string,
  job: Vacancy,
  questions: string[],
  transcript: TranscriptTurn[],
  language: string,
  profile: Profile,
): InterviewFeedback {
  const answers = transcript.filter((t) => t.role === "candidate").map((t) => t.text);
  const avgWords = answers.length
    ? answers.reduce((n, a) => n + a.split(/\s+/).length, 0) / answers.length
    : 0;
  const base = Math.min(8.5, 5 + avgWords / 25);
  const r = (x: number) => Math.round(Math.max(1, Math.min(10, x)) * 10) / 10;
  const scores = {
    relevance: r(base + 0.6),
    clarity: r(base + 0.3),
    examples: r(base - 0.4),
    structure: r(base - 0.7),
  };
  const overall = r((scores.relevance + scores.clarity + scores.examples + scores.structure) / 4);
  const stronger = strongerAnswers(profile);
  const summary =
    "Your answers are clear and linked to your real experience. Use the STAR method (Situation, Task, Action, Result) and finish each example with a clear result.";
  return {
    id,
    sessionId,
    jobId: job.id,
    overallScore: overall,
    scores,
    perQuestion: questions.map((q, i) => ({
      question: q,
      answerSummary: answers[i] ? answers[i].slice(0, 140) : "No answer given.",
      wentWell: answers[i] ? "You stayed on topic and mentioned your own experience." : "—",
      improve:
        answers[i] && answers[i].split(/\s+/).length > 30
          ? "Add a clear result at the end."
          : "Give a specific example with a result.",
      strongerAnswer: stronger[i % stronger.length] ?? "",
    })),
    summary,
    translatedSummary:
      language !== "English"
        ? (translations[language] ??
          `(${language} translation is provided by the real backend.) ${summary}`)
        : undefined,
    language,
    createdAt: new Date().toISOString(),
  };
}

export const pastInterviews: InterviewFeedback[] = [
  {
    id: "if1",
    sessionId: "s-old1",
    jobId: "v1",
    overallScore: 5.5,
    scores: { relevance: 6.2, clarity: 5.8, examples: 5.1, structure: 4.9 },
    perQuestion: [],
    summary: "Good start. Answers were short and lacked results.",
    language: "Arabic",
    createdAt: "2026-09-21T14:00:00Z",
  },
  {
    id: "if2",
    sessionId: "s-old2",
    jobId: "v2",
    overallScore: 6.8,
    scores: { relevance: 7.4, clarity: 7.0, examples: 6.5, structure: 6.3 },
    perQuestion: [],
    summary: "Clearer examples. Keep working on STAR structure.",
    language: "Arabic",
    createdAt: "2026-09-28T16:30:00Z",
  },
];
