import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { STEPS, useGoToStep } from "@/components/journey";
import {
  EmptyState,
  ListSkeleton,
  Panel,
  RecommendationList,
  statusLabel,
} from "@/components/bits";
import { qk } from "@/lib/queries";
import { useAuth, useJourney } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Career Access" },
      {
        name: "description",
        content: "Your career journey at a glance: progress, jobs, applications and practice.",
      },
      { property: "og:title", content: "Dashboard — Career Access" },
      { property: "og:description", content: "Your career journey at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const auth = useAuth();
  const { maxStep } = useJourney();
  const go = useGoToStep();
  const stats = useQuery(qk.dashboard);
  const recs = useQuery(qk.recommendations);
  const s = stats.data;
  const nextStep = Math.min(maxStep + 1, 8);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold md:text-3xl">
          Welcome, {auth?.user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {s?.careerDirection ? (
            <>
              Your direction:{" "}
              <span className="font-medium text-foreground">{s.careerDirection}</span>
            </>
          ) : (
            "Let's find your career direction."
          )}
        </p>
      </header>

      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Your journey</h2>
            <p className="text-sm text-muted-foreground">{maxStep} of 8 steps done</p>
          </div>
          <Button onClick={() => go(nextStep)}>
            {maxStep === 0 ? "Start with your profile" : `Continue: ${STEPS[nextStep - 1]}`}
          </Button>
        </div>
        <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {STEPS.map((l, i) => (
            <li
              key={l}
              className={`flex items-center gap-2 rounded-lg p-2 text-xs ${i < maxStep ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"}`}
            >
              {i < maxStep ? (
                <Check className="size-3.5" aria-hidden />
              ) : (
                <span className="w-3.5 text-center">{i + 1}</span>
              )}
              {l}
            </li>
          ))}
        </ol>
      </Panel>

      {stats.isLoading || !s ? (
        <ListSkeleton rows={2} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {(
              [
                ["Jobs matched", s.jobsMatched],
                ["Jobs saved", s.jobsSaved],
                ["Applications sent", s.applicationsSent],
                ["Interviews", s.interviews],
                ["Offers", s.offers],
                ["Practice interviews", s.practiceCount],
                ["Avg. practice score", s.avgInterviewScore ?? "—"],
              ] as const
            ).map(([l, v]) => (
              <Panel key={l} className="p-4">
                <p className="text-2xl font-semibold">{v}</p>
                <p className="text-xs text-muted-foreground">{l}</p>
              </Panel>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel>
              <h2 className="mb-4 font-semibold">Interview practice scores</h2>
              {s.scoreHistory.length ? (
                <div className="h-56">
                  <ResponsiveContainer>
                    <LineChart data={s.scoreHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis
                        dataKey="date"
                        fontSize={12}
                        tickFormatter={(d: string) =>
                          new Date(d).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })
                        }
                      />
                      <YAxis domain={[0, 10]} fontSize={12} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="var(--color-primary)"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  title="No practice yet"
                  text="Try a 10-minute practice interview."
                  action={
                    <Button asChild variant="outline">
                      <Link to="/interview">Practise now</Link>
                    </Button>
                  }
                />
              )}
            </Panel>
            <Panel>
              <h2 className="mb-4 font-semibold">Applications by status</h2>
              {Object.values(s.statusCounts).some(Boolean) ? (
                <div className="h-56">
                  <ResponsiveContainer>
                    <BarChart
                      data={Object.entries(s.statusCounts).map(([k, v]) => ({
                        name: statusLabel[k],
                        count: v,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis allowDecimals={false} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  title="No applications yet"
                  text="Find a job match to get started."
                  action={
                    <Button asChild variant="outline">
                      <Link to="/jobs">See jobs</Link>
                    </Button>
                  }
                />
              )}
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Panel>
              <h2 className="font-semibold">Skills gaps</h2>
              {s.nextStepsTotal ? (
                <>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {s.nextStepsDone} of {s.nextStepsTotal} next steps done
                  </p>
                  <Progress
                    value={(s.nextStepsDone / s.nextStepsTotal) * 100}
                    className="mt-3"
                    aria-label="Next steps progress"
                  />
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link to="/gaps">View next steps</Link>
                  </Button>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose a career option to see your next steps.
                </p>
              )}
            </Panel>
            <Panel className="lg:col-span-2">
              <h2 className="mb-3 font-semibold">Recent activity</h2>
              {s.recentActivity.length ? (
                <ul className="divide-y">
                  {s.recentActivity.map((a, i) => (
                    <li key={i} className="flex justify-between gap-4 py-2 text-sm">
                      <span>{a.text}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {new Date(a.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nothing yet — start with your profile.
                </p>
              )}
            </Panel>
          </div>
        </>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recommended for you</h2>
        {recs.isLoading ? (
          <ListSkeleton rows={2} />
        ) : (
          <RecommendationList items={(recs.data ?? []).slice(0, 3)} />
        )}
      </section>
    </div>
  );
}
