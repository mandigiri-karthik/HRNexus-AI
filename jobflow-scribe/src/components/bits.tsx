import { useRouter } from "@tanstack/react-router";
import { FileText, Lightbulb, Mic, Search, Target } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Recommendation } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SourceChip({ source }: { source: string }) {
  return (
    <Badge variant="source" className="mt-1 text-[11px]">
      Source: {source}
    </Badge>
  );
}

export function MatchRing({ value, size = 56 }: { value: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${value}% match`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={6}
          className="fill-none stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className="fill-none stroke-primary"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
        {value}%
      </span>
    </div>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl border bg-card p-5", className)}>{children}</div>;
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

const recIcon = {
  cv: FileText,
  targeting: Target,
  interview: Mic,
  skills: Lightbulb,
  jobs: Search,
};

export function RecommendationList({ items }: { items: Recommendation[] }) {
  const router = useRouter();
  if (!items.length)
    return (
      <EmptyState
        title="No suggestions yet"
        text="As you apply and practise, we'll suggest what to do next."
      />
    );
  return (
    <ul className="space-y-3">
      {items.map((r) => {
        const Icon = recIcon[r.type];
        return (
          <li
            key={r.id}
            className="flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="flex-1">
              <p className="font-medium">{r.title}</p>
              <p className="text-sm text-muted-foreground">{r.reason}</p>
            </div>
            <Button variant="outline" onClick={() => router.navigate({ href: r.actionRoute })}>
              {r.actionLabel}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

export const statusLabel: Record<string, string> = {
  saved: "Saved",
  draft: "Draft",
  approved: "Approved",
  applied: "Applied",
  interview: "Interview",
  rejected: "Rejected",
  offer: "Offer",
};
