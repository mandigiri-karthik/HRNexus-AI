import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, ExternalLink, FileText, Mic } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackToJobs, JourneyStepper } from "@/components/journey";
import { ListSkeleton, MatchRing, Panel, SourceChip } from "@/components/bits";
import * as api from "@/lib/api";
import { qk } from "@/lib/queries";
import { completeStep } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/jobs/$id")({
  head: () => ({
    meta: [
      { title: "Job details — Career Access" },
      { name: "description", content: "See exactly why this job matches your experience." },
      { property: "og:title", content: "Job details — Career Access" },
      { property: "og:description", content: "See exactly why this job matches your experience." },
    ],
  }),
  component: JobDetail,
});

function JobDetail() {
  const { id } = Route.useParams();
  const { data: j, isLoading } = useQuery(qk.job(id));
  const apps = useQuery(qk.applications);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const saved = apps.data?.some((a) => a.jobId === id);

  const save = useMutation({
    mutationFn: () => api.saveJob(id),
    onSuccess: () => {
      toast.success("Job saved");
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  if (isLoading || !j) return <ListSkeleton />;
  const bars = [
    ["Skills", j.match.skills, 40],
    ["Experience", j.match.experience, 30],
    ["Qualifications", j.match.qualifications, 20],
    ["Location & work preferences", j.match.location, 10],
  ] as const;

  return (
    <>
      <JourneyStepper current={4} />
      <BackToJobs />
      <div className="mt-4 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold md:text-3xl">{j.title}</h1>
            <p className="mt-1 text-muted-foreground">
              {j.employer} · {j.location} ({j.distanceMiles} miles)
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{j.salary}</Badge>
              <Badge variant="secondary">{j.contractType}</Badge>
              <Badge variant="outline">
                Posted {new Date(j.postedDate).toLocaleDateString("en-GB")}
              </Badge>
            </div>
          </div>
          <Panel>
            <h2 className="font-semibold">About the job</h2>
            <p className="mt-2 text-sm leading-relaxed">{j.description}</p>
            <h3 className="mt-4 font-medium">Requirements</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {j.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </Panel>
          <div className="grid gap-4 md:grid-cols-2">
            <Panel className="bg-success-soft">
              <h2 className="font-semibold text-success">Your strengths for this job</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {j.match.strengths.map((s) => (
                  <li key={s.text}>
                    {s.text}
                    <br />
                    <SourceChip source={s.profileSource} />
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel className="bg-warning-soft">
              <h2 className="font-semibold text-warning">Gaps for this job</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {j.match.gaps.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>

        <aside className="space-y-4">
          <Panel>
            <div className="flex items-center gap-4">
              <MatchRing value={j.match.total} size={72} />
              <div>
                <p className="font-semibold">Match score</p>
                <p className="text-sm text-muted-foreground">How we worked this out:</p>
              </div>
            </div>
            <ul className="mt-4 space-y-3">
              {bars.map(([label, v, max]) => (
                <li key={label}>
                  <div className="flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="font-medium">
                      {v}/{max}
                    </span>
                  </div>
                  <div
                    className="mt-1 h-2 rounded-full bg-muted"
                    role="progressbar"
                    aria-label={label}
                    aria-valuenow={v}
                    aria-valuemax={max}
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(v / max) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t pt-3 text-right text-sm font-semibold">
              Total {j.match.total}/100
            </p>
          </Panel>
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              onClick={() => {
                completeStep(4, j.id);
                navigate({ to: "/apply/$jobId", params: { jobId: j.id } });
              }}
            >
              <FileText className="size-4" /> Prepare application
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/interview/$jobId", params: { jobId: j.id } })}
            >
              <Mic className="size-4" /> Practise interview for this job
            </Button>
            <Button
              variant="outline"
              onClick={() => save.mutate()}
              disabled={saved || save.isPending}
            >
              <Bookmark className="size-4" /> {saved ? "Saved" : "Save job"}
            </Button>
            <Button variant="ghost" asChild>
              <a href={j.sourceUrl} target="_blank" rel="noreferrer">
                View original advert <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}
