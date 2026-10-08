import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mic } from "lucide-react";
import { PageTitle } from "@/components/journey";
import { EmptyState, ListSkeleton, Panel } from "@/components/bits";
import { qk } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/interview/")({
  head: () => ({
    meta: [
      { title: "Interview practice — Career Access" },
      {
        name: "description",
        content: "Practise voice interviews for real job matches and get clear feedback.",
      },
      { property: "og:title", content: "Interview practice — Career Access" },
      { property: "og:description", content: "Practise voice interviews and get clear feedback." },
    ],
  }),
  component: InterviewHub,
});

function InterviewHub() {
  const jobs = useQuery(qk.jobs({}));
  const past = useQuery(qk.interviews);
  return (
    <>
      <PageTitle
        title="Interview practice"
        intro="Pick a job and practise a 10-minute interview. You'll get feedback straight away."
      />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section>
          <h2 className="mb-3 font-semibold">Choose a job</h2>
          {jobs.isLoading ? (
            <ListSkeleton />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {jobs.data?.slice(0, 6).map((j) => (
                <li key={j.id}>
                  <Link
                    to="/interview/$jobId"
                    params={{ jobId: j.id }}
                    className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:border-primary"
                  >
                    <Mic className="size-5 text-primary" aria-hidden />
                    <span>
                      <span className="block font-medium">{j.title}</span>
                      <span className="text-sm text-muted-foreground">{j.employer}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="mb-3 font-semibold">Past practice</h2>
          {past.isLoading ? (
            <ListSkeleton rows={2} />
          ) : !past.data?.length ? (
            <EmptyState title="No practice yet" text="Your scores will appear here." />
          ) : (
            <ul className="space-y-2">
              {past.data.map((i) => (
                <li key={i.id}>
                  <Panel className="flex items-center justify-between p-4">
                    <span className="text-sm">
                      {new Date(i.createdAt).toLocaleDateString("en-GB")}
                    </span>
                    <span className="font-semibold">{i.overallScore}/10</span>
                  </Panel>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
