import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { JourneyStepper, PageTitle } from "@/components/journey";
import { EmptyState, ListSkeleton, SourceChip } from "@/components/bits";
import * as api from "@/lib/api";
import { qk } from "@/lib/queries";
import { completeStep, useJourney } from "@/lib/session";
import type { NextStep } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/gaps")({
  validateSearch: (s: Record<string, unknown>): { careerOptionId?: string } => ({
    careerOptionId: typeof s.careerOptionId === "string" ? s.careerOptionId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Skills gaps — Career Access" },
      {
        name: "description",
        content: "What you already have, what you may be missing, and your next steps.",
      },
      { property: "og:title", content: "Skills gaps — Career Access" },
      {
        property: "og:description",
        content: "What you already have, what you may be missing, and your next steps.",
      },
    ],
  }),
  component: GapsPage,
});

const prio = { high: "danger", medium: "warning", low: "secondary" } as const;

function GapsPage() {
  const search = Route.useSearch();
  const options = useQuery(qk.options);
  const optionId = search.careerOptionId ?? options.data?.find((o) => o.selected)?.id;
  const option = options.data?.find((o) => o.id === optionId);
  const gaps = useQuery({ ...qk.gaps(optionId ?? ""), enabled: !!optionId });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { jobId } = useJourney();

  const toggle = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => api.updateNextStep(id, done),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gaps"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const aiGo = (s: NextStep) => {
    const j = jobId ?? "v1";
    if (s.aiAction === "interview") navigate({ to: "/interview/$jobId", params: { jobId: j } });
    else
      navigate({
        to: "/apply/$jobId",
        params: { jobId: j },
        search: { docType: s.aiAction === "cv" ? "cv" : "statement" },
      });
  };

  if (!options.isLoading && !optionId)
    return (
      <>
        <JourneyStepper current={3} />
        <EmptyState
          title="Choose a career option first"
          text="Pick a direction to see your skills gaps."
          action={
            <Button asChild>
              <Link to="/career-options">See options</Link>
            </Button>
          }
        />
      </>
    );

  return (
    <>
      <JourneyStepper current={3} />
      <PageTitle
        title={`Skills gaps${option ? `: ${option.title}` : ""}`}
        intro="What you already bring, and what could help you get hired."
      />
      {gaps.isLoading || !gaps.data ? (
        <ListSkeleton />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr_2fr]">
          <section className="rounded-xl border bg-success-soft p-5">
            <h2 className="flex items-center gap-2 font-semibold text-success">
              <CheckCircle2 className="size-5" aria-hidden /> You already have
            </h2>
            <ul className="mt-3 space-y-3">
              {gaps.data.have.map((h) => (
                <li key={h.item} className="text-sm font-medium">
                  {h.item}
                  <br />
                  <SourceChip source={h.profileSource} />
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border bg-warning-soft p-5">
            <h2 className="flex items-center gap-2 font-semibold text-warning">
              <CircleAlert className="size-5" aria-hidden /> You may be missing
            </h2>
            <ul className="mt-3 space-y-3">
              {gaps.data.missing.map((m) => (
                <li key={m.item} className="text-sm">
                  <span className="font-medium">{m.item}</span>
                  <br />
                  <span className="text-muted-foreground">{m.importance}</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Next steps</h2>
            <div className="space-y-3">
              {gaps.data.nextSteps.map((s) => (
                <article
                  key={s.id}
                  className={`rounded-xl border bg-card p-4 ${s.done ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={s.done}
                      onCheckedChange={(v) => toggle.mutate({ id: s.id, done: v === true })}
                      aria-label={`Mark "${s.title}" as done`}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`font-medium ${s.done ? "line-through" : ""}`}>{s.title}</h3>
                        <Badge variant={prio[s.priority]} className="capitalize">
                          {s.priority}
                        </Badge>
                        <Badge variant="outline">{s.timeEstimate}</Badge>
                      </div>
                      <p className="mt-2 text-sm">
                        <span className="font-medium">Why it matters:</span> {s.whyItMatters}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">What to do:</span> {s.whatToDo}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {s.type === "user" ? (
                          <>
                            <Badge variant="secondary">You do this</Badge>
                            {s.officialUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={s.officialUrl} target="_blank" rel="noreferrer">
                                  Official site <ExternalLink className="size-3.5" />
                                </a>
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <Badge variant="soft">Do it with AI</Badge>
                            <Button size="sm" onClick={() => aiGo(s)}>
                              <Sparkles className="size-3.5" /> Start
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
      <div className="mt-8 flex justify-end">
        <Button
          size="lg"
          onClick={() => {
            completeStep(3);
            navigate({ to: "/jobs", search: { careerOptionId: optionId } });
          }}
        >
          Find matching jobs
        </Button>
      </div>
    </>
  );
}
