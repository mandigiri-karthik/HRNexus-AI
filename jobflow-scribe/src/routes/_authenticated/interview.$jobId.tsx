import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mic, Square } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PageTitle } from "@/components/journey";
import { ListSkeleton, Panel } from "@/components/bits";
import * as api from "@/lib/api";
import { qk } from "@/lib/queries";
import type {
  InterviewFeedback,
  InterviewSession,
  PerQuestionFeedback,
  TranscriptTurn,
} from "@/lib/types";

const VoiceInterview = lazy(() => import("@/components/voice-interview"));
const LANGS = [
  "English",
  "Arabic",
  "Hindi",
  "Urdu",
  "Ukrainian",
  "Polish",
  "Farsi",
  "Pashto",
  "Tigrinya",
  "Romanian",
  "Spanish",
  "French",
  "Portuguese",
  "Chinese",
];

export const Route = createFileRoute("/_authenticated/interview/$jobId")({
  head: () => ({
    meta: [
      { title: "Voice interview — Career Access" },
      {
        name: "description",
        content: "Practise a job interview by voice and get STAR-based feedback.",
      },
      { property: "og:title", content: "Voice interview — Career Access" },
      {
        property: "og:description",
        content: "Practise a job interview by voice and get feedback.",
      },
    ],
  }),
  component: InterviewPage,
});

function InterviewPage() {
  const { jobId } = Route.useParams();
  const job = useQuery(qk.job(jobId));
  const profile = useQuery(qk.profile);
  const qc = useQueryClient();
  const [language, setLanguage] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const lang = language ?? profile.data?.homeLanguage ?? "English";

  const start = useMutation({
    mutationFn: () => api.startInterviewSession(jobId, lang),
    onSuccess: setSession,
  });
  const finish = useMutation({
    mutationFn: (transcript: TranscriptTurn[]) =>
      api.submitInterviewFeedback({
        sessionId: session!.sessionId,
        jobId,
        transcript,
        language: lang,
      }),
    onSuccess: (f) => {
      setFeedback(f);
      setSession(null);
      ["interviews", "dashboard", "recommendations"].forEach((k) =>
        qc.invalidateQueries({ queryKey: [k] }),
      );
    },
  });

  const vars = useMemo(
    () => ({
      job_title: job.data?.title ?? "",
      employer: job.data?.employer ?? "",
      job_description: job.data?.description ?? "",
      candidate_name: profile.data?.name ?? "",
    }),
    [job.data, profile.data],
  );

  if (job.isLoading || !job.data) return <ListSkeleton />;

  if (finish.isPending)
    return (
      <>
        <PageTitle title="Preparing your feedback…" />
        <ListSkeleton rows={3} />
      </>
    );
  if (feedback) return <FeedbackView fb={feedback} onRetry={() => setFeedback(null)} />;

  if (session) {
    const live = session.signedUrl || session.agentId;
    return (
      <>
        <PageTitle title={`Interview: ${job.data.title}`} intro={job.data.employer} />
        {live ? (
          <Suspense fallback={<ListSkeleton rows={1} />}>
            <VoiceInterview session={session} vars={vars} onEnd={(t) => finish.mutate(t)} />
          </Suspense>
        ) : (
          <MockInterview questions={session.questions} onEnd={(t) => finish.mutate(t)} />
        )}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle
        title={`Practise an interview: ${job.data.title}`}
        intro={`${job.data.employer} · ${job.data.location}`}
      />
      <Panel className="space-y-5">
        <div>
          <h2 className="font-semibold">What to expect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>5 questions, about 10 minutes</li>
            <li>Answer out loud, like a real interview</li>
            <li>Get scores and tips at the end</li>
          </ul>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fb-lang">Feedback language</Label>
          <Select value={lang} onValueChange={setLanguage}>
            <SelectTrigger id="fb-lang" className="sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-start gap-3 text-sm">
          <Checkbox
            checked={consent}
            onCheckedChange={(v) => setConsent(v === true)}
            className="mt-0.5"
          />
          I agree my answers are processed to give feedback. Audio is not stored.
        </label>
        <Button
          size="lg"
          className="w-full"
          disabled={!consent || start.isPending}
          onClick={() => start.mutate()}
        >
          <Mic className="size-4" /> {start.isPending ? "Starting…" : "Start voice interview"}
        </Button>
      </Panel>
    </div>
  );
}

// Minimal typing for the browser Web Speech API
interface SpeechRec {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function MockInterview({
  questions,
  onEnd,
}: {
  questions: string[];
  onEnd: (t: TranscriptTurn[]) => void;
}) {
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState("");
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [recording, setRecording] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const rec = useRef<SpeechRec | null>(null);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    };
    setCanSpeak(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const toggleRecord = () => {
    if (recording) {
      rec.current?.stop();
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "en-GB";
    r.interimResults = true;
    r.continuous = true;
    const before = answer ? answer + " " : "";
    r.onresult = (e) =>
      setAnswer(
        before +
          Array.from(e.results)
            .map((x) => x[0].transcript)
            .join(" "),
      );
    r.onend = () => setRecording(false);
    rec.current = r;
    r.start();
    setRecording(true);
  };

  const next = () => {
    rec.current?.stop();
    const now = new Date().toISOString();
    const t = [
      ...turns,
      { role: "interviewer" as const, text: questions[i], timestamp: now },
      { role: "candidate" as const, text: answer.trim(), timestamp: now },
    ];
    setTurns(t);
    setAnswer("");
    if (i + 1 >= questions.length) onEnd(t);
    else setI(i + 1);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Question {i + 1} of {questions.length} · Practice mode
      </p>
      <div className="mt-2 h-1.5 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${((i + 1) / questions.length) * 100}%` }}
        />
      </div>
      <Panel className="mt-4 space-y-4">
        <p className="text-lg font-medium" aria-live="polite">
          {questions[i]}
        </p>
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={6}
          placeholder={canSpeak ? "Press Record and speak, or type here" : "Type your answer"}
          aria-label="Your answer"
        />
        <div className="flex flex-wrap gap-2">
          {canSpeak && (
            <Button variant={recording ? "destructive" : "outline"} onClick={toggleRecord}>
              {recording ? (
                <>
                  <Square className="size-4" /> Stop
                </>
              ) : (
                <>
                  <Mic className="size-4" /> Record answer
                </>
              )}
            </Button>
          )}
          <Button className="ml-auto" onClick={next} disabled={!answer.trim()}>
            {i + 1 >= questions.length ? "Finish and get feedback" : "Next question"}
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onEnd(turns)}>
          End interview
        </Button>
      </Panel>
    </div>
  );
}

function FeedbackView({ fb, onRetry }: { fb: InterviewFeedback; onRetry: () => void }) {
  const [translated, setTranslated] = useState(false);
  const areas = [
    ["Relevance", fb.scores.relevance],
    ["Clarity", fb.scores.clarity],
    ["Examples", fb.scores.examples],
    ["Structure (STAR)", fb.scores.structure],
  ] as const;
  return (
    <>
      <PageTitle title="Your interview feedback" />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Panel className="self-start text-center">
          <p className="text-sm text-muted-foreground">Overall score</p>
          <p className="text-5xl font-semibold text-primary">
            {fb.overallScore}
            <span className="text-xl text-muted-foreground">/10</span>
          </p>
          <ul className="mt-6 space-y-3 text-left">
            {areas.map(([l, v]) => (
              <li key={l}>
                <div className="flex justify-between text-sm">
                  <span>{l}</span>
                  <span className="font-medium">{v}/10</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${v * 10}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="space-y-4">
          <Panel>
            {fb.translatedSummary && (
              <div className="mb-3 flex items-center gap-2">
                <Switch id="tr" checked={translated} onCheckedChange={setTranslated} />
                <Label htmlFor="tr">Show feedback in {fb.language}</Label>
              </div>
            )}
            <p dir={translated && fb.language === "Arabic" ? "rtl" : undefined}>
              {translated && fb.translatedSummary ? fb.translatedSummary : fb.summary}
            </p>
          </Panel>
          {fb.perQuestion.map((q: PerQuestionFeedback, i: number) => (
            <Panel key={i} className="space-y-2 text-sm">
              <p className="font-semibold">
                {i + 1}. {q.question}
              </p>
              <p className="text-muted-foreground">Your answer: {q.answerSummary}</p>
              <p>
                <span className="font-medium text-success">What went well:</span> {q.wentWell}
              </p>
              <p>
                <span className="font-medium text-warning">What to improve:</span> {q.improve}
              </p>
              <div className="rounded-lg bg-primary-soft p-3">
                <p className="font-medium text-primary">
                  A stronger answer (from your profile only)
                </p>
                <p className="mt-1">{q.strongerAnswer}</p>
              </div>
            </Panel>
          ))}
          <div className="flex gap-2">
            <Button onClick={onRetry}>Try again</Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
