import { Link, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useJourney } from "@/lib/session";
import { cn } from "@/lib/utils";

export const STEPS = [
  "Profile",
  "Career options",
  "Skills gaps",
  "Job matches",
  "Application support",
  "Your approval",
  "Apply & next steps",
  "Follow-up",
] as const;

/** Returns a navigate callback for a 1-based step number. */
export function useGoToStep() {
  const navigate = useNavigate();
  const { jobId } = useJourney();
  return (step: number) => {
    const j = jobId ?? "v1";
    switch (step) {
      case 1:
        return navigate({ to: "/profile" });
      case 2:
        return navigate({ to: "/career-options" });
      case 3:
        return navigate({ to: "/gaps" });
      case 4:
        return navigate({ to: "/jobs" });
      case 5:
        return jobId
          ? navigate({ to: "/apply/$jobId", params: { jobId: j } })
          : navigate({ to: "/jobs" });
      case 6:
        return navigate({ to: "/apply/$jobId/review", params: { jobId: j } });
      case 7:
        return navigate({ to: "/apply/$jobId/submit", params: { jobId: j } });
      default:
        return navigate({ to: "/follow-up" });
    }
  };
}

export function JourneyStepper({ current }: { current: number }) {
  const { maxStep } = useJourney();
  const go = useGoToStep();
  return (
    <nav aria-label="Journey progress" className="mb-8">
      <p className="text-sm font-medium text-muted-foreground md:hidden">
        Step {current} of 8 · <span className="text-foreground">{STEPS[current - 1]}</span>
      </p>
      <div className="mt-2 h-1.5 rounded-full bg-muted md:hidden">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${(current / 8) * 100}%` }}
        />
      </div>
      <ol className="hidden items-center gap-1 md:flex">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n <= maxStep && n !== current;
          const isCurrent = n === current;
          const content = (
            <>
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  isCurrent && "bg-primary text-primary-foreground",
                  done && "bg-primary-soft text-primary",
                  !isCurrent && !done && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : n}
              </span>
              <span
                className={cn(
                  "truncate text-xs",
                  isCurrent ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </>
          );
          return (
            <li key={label} className="flex min-w-0 flex-1 items-center gap-1">
              {done ? (
                <button
                  onClick={() => go(n)}
                  className="flex min-w-0 items-center gap-1.5 rounded-lg px-1 py-1 hover:bg-muted"
                >
                  {content}
                </button>
              ) : (
                <div
                  className="flex min-w-0 items-center gap-1.5 px-1 py-1"
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {content}
                </div>
              )}
              {n < 8 && <span className="h-px min-w-2 flex-1 bg-border" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PageTitle({ title, intro }: { title: string; intro?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      {intro && <p className="mt-2 max-w-2xl text-muted-foreground">{intro}</p>}
    </header>
  );
}

export function BackToJobs() {
  return (
    <Link to="/jobs" className="text-sm text-primary hover:underline">
      ← Back to job matches
    </Link>
  );
}
