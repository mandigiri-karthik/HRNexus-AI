import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { JourneyStepper, PageTitle } from "@/components/journey";
import { EmptyState, ListSkeleton, Panel } from "@/components/bits";
import * as api from "@/lib/api";
import { qk } from "@/lib/queries";
import { completeStep } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/apply/$jobId/review")({
  head: () => ({
    meta: [
      { title: "Your approval — Career Access" },
      {
        name: "description",
        content: "Check and approve your application. Nothing is sent without you.",
      },
      { property: "og:title", content: "Your approval — Career Access" },
      { property: "og:description", content: "Check and approve your application." },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const { jobId } = Route.useParams();
  const job = useQuery(qk.job(jobId));
  const draft = useQuery(qk.draft(jobId));
  const [ok1, setOk1] = useState(false);
  const [ok2, setOk2] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const approve = useMutation({
    mutationFn: () => api.approveApplication(draft.data!.id),
    onSuccess: () => {
      toast.success("Approved. Your documents are ready.");
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      completeStep(6, jobId);
      navigate({ to: "/apply/$jobId/submit", params: { jobId } });
    },
  });

  if (draft.isLoading || job.isLoading) return <ListSkeleton />;
  if (!draft.data)
    return (
      <EmptyState
        title="No draft yet"
        text="Create a draft first."
        action={
          <Button asChild>
            <Link to="/apply/$jobId" params={{ jobId }}>
              Create draft
            </Link>
          </Button>
        }
      />
    );
  const hasUnsupported = draft.data.paragraphs.some((p) => p.unsupported);

  return (
    <>
      <JourneyStepper current={6} />
      <PageTitle
        title="Your approval"
        intro="Read it carefully. Nothing is ever sent without your approval."
      />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel className="space-y-4 bg-background leading-relaxed">
          {draft.data.paragraphs.map((p) => (
            <p
              key={p.id}
              className={p.unsupported ? "rounded bg-destructive-soft text-destructive" : ""}
            >
              {p.text}
            </p>
          ))}
        </Panel>
        <aside className="space-y-4">
          {job.data && (
            <Panel>
              <p className="text-sm text-muted-foreground">Applying for</p>
              <p className="font-semibold">{job.data.title}</p>
              <p className="text-sm">
                {job.data.employer} · {job.data.location}
              </p>
              <p className="text-sm">{job.data.salary}</p>
            </Panel>
          )}
          <Panel className="space-y-3">
            {hasUnsupported && (
              <p className="text-sm text-destructive">
                This draft still contains text that isn't in your profile. Please go back and fix
                it.
              </p>
            )}
            <label className="flex items-start gap-3 text-sm">
              <Checkbox
                checked={ok1}
                onCheckedChange={(v) => setOk1(v === true)}
                className="mt-0.5"
              />{" "}
              This is true and accurate
            </label>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox
                checked={ok2}
                onCheckedChange={(v) => setOk2(v === true)}
                className="mt-0.5"
              />{" "}
              I'm happy for this to be used for my application
            </label>
            <Button
              className="w-full"
              disabled={!ok1 || !ok2 || hasUnsupported || approve.isPending}
              onClick={() => approve.mutate()}
            >
              {approve.isPending ? "Approving…" : "Approve"}
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/apply/$jobId" params={{ jobId }}>
                Go back and edit
              </Link>
            </Button>
          </Panel>
        </aside>
      </div>
    </>
  );
}
