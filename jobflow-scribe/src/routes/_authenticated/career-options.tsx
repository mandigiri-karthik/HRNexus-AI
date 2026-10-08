import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { JourneyStepper, PageTitle } from "@/components/journey";
import { EmptyState, ListSkeleton, SourceChip } from "@/components/bits";
import * as api from "@/lib/api";
import { qk } from "@/lib/queries";
import { completeStep } from "@/lib/session";
import type { CareerOption } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/career-options")({
  head: () => ({
    meta: [
      { title: "Career options — Career Access" },
      { name: "description", content: "Realistic UK career options based on your experience." },
      { property: "og:title", content: "Career options — Career Access" },
      {
        property: "og:description",
        content: "Realistic UK career options based on your experience.",
      },
    ],
  }),
  component: CareerOptionsPage,
});

const fitLabel = {
  strong: { text: "Strong fit", variant: "success" as const },
  stepping_stone: { text: "Good stepping stone", variant: "soft" as const },
  long_term: { text: "Longer-term goal", variant: "warning" as const },
};

function CareerOptionsPage() {
  const { data, isLoading } = useQuery(qk.options);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [rejecting, setRejecting] = useState<CareerOption | null>(null);
  const [reason, setReason] = useState("");

  const select = useMutation({
    mutationFn: api.selectCareerOption,
    onSuccess: (opt) => {
      qc.invalidateQueries({ queryKey: ["careerOptions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      completeStep(2);
      navigate({ to: "/gaps", search: { careerOptionId: opt.id } });
    },
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.rejectCareerOption(id, reason),
    onSuccess: (opts) => {
      qc.setQueryData(qk.options.queryKey, opts);
      setRejecting(null);
      setReason("");
    },
  });

  return (
    <>
      <JourneyStepper current={2} />
      <PageTitle
        title="Your career options"
        intro="Three realistic directions based on your experience."
      />
      {isLoading ? (
        <ListSkeleton />
      ) : !data?.length ? (
        <EmptyState
          title="No options yet"
          text="Complete your profile and we'll suggest careers."
          action={
            <Button asChild>
              <Link to="/profile">Go to profile</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {data.map((o) => (
            <article
              key={o.id}
              className={`flex flex-col rounded-xl border bg-card p-5 ${o.selected ? "ring-2 ring-primary" : ""}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={fitLabel[o.fitLevel].variant}>{fitLabel[o.fitLevel].text}</Badge>
                {o.regulated.isRegulated && (
                  <Badge variant="danger" className="gap-1">
                    <AlertTriangle className="size-3" aria-hidden /> Regulated profession
                  </Badge>
                )}
              </div>
              <h2 className="mt-3 text-xl font-semibold">{o.title}</h2>
              {o.regulated.isRegulated && (
                <p className="mt-1 text-xs text-destructive">{o.regulated.note}</p>
              )}
              <h3 className="mt-4 text-sm font-medium">Why this fits you</h3>
              <ul className="mt-2 space-y-2">
                {o.whyItFits.map((w) => (
                  <li key={w.text} className="text-sm">
                    • {w.text}
                    <br />
                    <SourceChip source={w.profileSource} />
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {o.transferableSkills.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Typical salary</dt>
                  <dd className="font-medium">{o.salaryRange}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Timeframe</dt>
                  <dd className="font-medium">{o.timeframe}</dd>
                </div>
              </dl>
              <p className="mt-4 flex flex-wrap items-center gap-1 rounded-lg bg-surface p-3 text-xs">
                <span className="font-medium">Realistic route:</span>
                {o.route.map((r, i) => (
                  <span key={r} className="flex items-center gap-1">
                    {i > 0 && <ArrowRight className="size-3" aria-hidden />}
                    {r}
                  </span>
                ))}
              </p>
              <div className="mt-auto flex flex-col gap-2 pt-5">
                <Button onClick={() => select.mutate(o.id)} disabled={select.isPending}>
                  See skills gaps
                </Button>
                <Button variant="ghost" onClick={() => setRejecting(o)}>
                  Not right for me
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="mt-6 text-sm text-muted-foreground">
        Suggestions are based only on what you told us.
      </p>

      <Dialog open={!!rejecting} onOpenChange={(v) => !v && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Why isn't {rejecting?.title} right for you?</DialogTitle>
            <DialogDescription>A short reason helps us suggest something better.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. I don't want shift work"
            aria-label="Reason"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              disabled={!reason.trim() || reject.isPending}
              onClick={() => rejecting && reject.mutate({ id: rejecting.id, reason })}
            >
              {reject.isPending ? "Finding another…" : "Suggest another"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
