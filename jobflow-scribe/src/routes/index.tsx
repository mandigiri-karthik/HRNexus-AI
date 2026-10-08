import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STEPS } from "@/components/journey";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Career Access — Your overseas experience, a UK career" },
      {
        name: "description",
        content:
          "An AI career agent that turns overseas work experience into realistic UK careers, job matches and applications.",
      },
      { property: "og:title", content: "Career Access — Your overseas experience, a UK career" },
      {
        property: "og:description",
        content: "Find realistic UK careers and jobs based on the experience you already have.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="grid gap-10 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="text-sm font-medium text-primary">AI career agent</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Your experience counts here.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Career Access helps people with overseas work experience find realistic careers and jobs
            in the UK — and apply with confidence.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild className="h-12 px-6">
              <Link to="/signup">Get started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-6">
              <Link to="/login">Try the demo</Link>
            </Button>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" aria-hidden />
            We never invent experience. Nothing is sent without your approval.
          </p>
        </div>
        <ol className="grid gap-2 rounded-2xl border bg-card p-6">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-3 rounded-lg bg-background p-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                {i + 1}
              </span>
              <span className="font-medium">{s}</span>
              <CheckCircle2 className="ml-auto size-4 text-muted-foreground/40" aria-hidden />
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
