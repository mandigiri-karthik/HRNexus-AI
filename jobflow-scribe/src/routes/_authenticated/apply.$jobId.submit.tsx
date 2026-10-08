import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, CheckCircle2, Copy, Download, ExternalLink, Mic, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { JourneyStepper, PageTitle } from "@/components/journey";
import { ListSkeleton, Panel } from "@/components/bits";
import * as api from "@/lib/api";
import { qk } from "@/lib/queries";
import { completeStep } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/apply/$jobId/submit")({
  head: () => ({
    meta: [
      { title: "Apply & next steps — Career Access" },
      { name: "description", content: "Your documents are ready. Apply on the employer's site." },
      { property: "og:title", content: "Apply & next steps — Career Access" },
      {
        property: "og:description",
        content: "Your documents are ready. Apply on the employer's site.",
      },
    ],
  }),
  component: SubmitPage,
});

function SubmitPage() {
  const { jobId } = Route.useParams();
  const job = useQuery(qk.job(jobId));
  const draft = useQuery(qk.draft(jobId));
  const apps = useQuery(qk.applications);
  const qc = useQueryClient();
  const app = apps.data?.find((a) => a.jobId === jobId);
  const text = draft.data?.paragraphs.map((p) => p.text).join("\n\n") ?? "";
  const applied = app && ["applied", "interview", "offer", "rejected"].includes(app.status);

  const submit = useMutation({
    mutationFn: () => api.submitApplication(app!.id),
    onSuccess: () => {
      toast.success("Marked as applied. Well done.");
      completeStep(7, jobId);
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `application-${job.data?.employer.replace(/\W+/g, "-").toLowerCase() ?? jobId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (job.isLoading || apps.isLoading) return <ListSkeleton />;

  return (
    <>
      <JourneyStepper current={7} />
      <PageTitle
        title="Apply & next steps"
        intro="This employer uses its own application site. Your documents are ready."
      />
      <Panel className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => navigator.clipboard.writeText(text).then(() => toast.success("Copied"))}
          disabled={!text}
        >
          <Copy className="size-4" /> Copy statement
        </Button>
        <Button variant="outline" onClick={download} disabled={!text}>
          <Download className="size-4" /> Download as .txt
        </Button>
        {job.data && (
          <Button asChild>
            <a href={job.data.sourceUrl} target="_blank" rel="noreferrer">
              Open the original application page <ExternalLink className="size-4" />
            </a>
          </Button>
        )}
      </Panel>

      <Panel className="mt-6">
        {applied ? (
          <p className="flex items-center gap-2 font-medium text-success">
            <CheckCircle2 className="size-5" aria-hidden /> You applied for this job. We'll help you
            follow up.
          </p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="flex-1 font-medium">Did you apply?</p>
            <Button onClick={() => submit.mutate()} disabled={!app || submit.isPending}>
              {submit.isPending ? "Saving…" : "Yes, mark as Applied"}
            </Button>
          </div>
        )}
      </Panel>

      <h2 className="mb-3 mt-8 text-lg font-semibold">What next?</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          to="/interview/$jobId"
          params={{ jobId }}
          className="rounded-xl border-2 border-primary bg-primary-soft p-5 hover:bg-accent"
        >
          <Mic className="size-6 text-primary" aria-hidden />
          <p className="mt-3 font-semibold">Practise an interview for this job</p>
          <p className="text-sm text-muted-foreground">5 questions, about 10 minutes.</p>
        </Link>
        <Link
          to="/jobs"
          search={{ careerOptionId: job.data?.careerOptionId }}
          className="rounded-xl border bg-card p-5 hover:border-primary"
        >
          <Search className="size-6 text-primary" aria-hidden />
          <p className="mt-3 font-semibold">Find similar jobs</p>
          <p className="text-sm text-muted-foreground">More roles like this one.</p>
        </Link>
        <button
          onClick={() => {
            completeStep(7, jobId);
            toast.success("Reminder set for 7 days from now.");
          }}
          className="rounded-xl border bg-card p-5 text-left hover:border-primary"
        >
          <BellRing className="size-6 text-primary" aria-hidden />
          <p className="mt-3 font-semibold">Set a follow-up reminder in 7 days</p>
          <p className="text-sm text-muted-foreground">We'll remind you to check in.</p>
        </button>
      </div>
      <div className="mt-6 text-right">
        <Button variant="ghost" asChild>
          <Link to="/follow-up">Go to follow-up →</Link>
        </Button>
      </div>
    </>
  );
}
