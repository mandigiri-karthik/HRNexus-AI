import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JourneyStepper, PageTitle } from "@/components/journey";
import { EmptyState, ListSkeleton, MatchRing } from "@/components/bits";
import { qk } from "@/lib/queries";

const num = (v: unknown) => (v === undefined || v === "" ? undefined : Number(v) || undefined);

export const Route = createFileRoute("/_authenticated/jobs/")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { careerOptionId?: string; maxDistance?: number; minMatch?: number; contract?: string } => ({
    careerOptionId: typeof s.careerOptionId === "string" ? s.careerOptionId : undefined,
    maxDistance: num(s.maxDistance),
    minMatch: num(s.minMatch),
    contract: typeof s.contract === "string" ? s.contract : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Job matches — Career Access" },
      {
        name: "description",
        content: "Jobs in your area ranked by how well they match your experience.",
      },
      { property: "og:title", content: "Job matches — Career Access" },
      {
        property: "og:description",
        content: "Jobs ranked by how well they match your experience.",
      },
    ],
  }),
  component: JobsPage,
});

const ALL = "all";

function JobsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const options = useQuery(qk.options);
  const jobs = useQuery(
    qk.jobs({
      careerOptionId: search.careerOptionId,
      minMatch: search.minMatch,
      maxDistance: search.maxDistance,
    }),
  );
  const list = (jobs.data ?? []).filter(
    (j) => !search.contract || j.contractType.toLowerCase().includes(search.contract),
  );

  const setFilter = (patch: Partial<typeof search>) =>
    navigate({ to: ".", search: (prev) => ({ ...prev, ...patch }) });

  return (
    <>
      <JourneyStepper current={4} />
      <PageTitle
        title="Job matches"
        intro="Sorted by how well each job matches your profile. All jobs are fictional demo data."
      />
      <div className="mb-6 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          label="Career option"
          value={search.careerOptionId}
          onChange={(v) => setFilter({ careerOptionId: v })}
          options={(options.data ?? []).map((o) => [o.id, o.title])}
        />
        <FilterSelect
          label="Distance"
          value={search.maxDistance?.toString()}
          onChange={(v) => setFilter({ maxDistance: num(v) })}
          options={[
            ["5", "Within 5 miles"],
            ["15", "Within 15 miles"],
            ["30", "Within 30 miles"],
          ]}
        />
        <FilterSelect
          label="Contract"
          value={search.contract}
          onChange={(v) => setFilter({ contract: v })}
          options={[
            ["permanent", "Permanent"],
            ["fixed", "Fixed-term"],
            ["part", "Part-time"],
          ]}
        />
        <FilterSelect
          label="Minimum match"
          value={search.minMatch?.toString()}
          onChange={(v) => setFilter({ minMatch: num(v) })}
          options={[
            ["60", "60%+"],
            ["70", "70%+"],
            ["80", "80%+"],
          ]}
        />
      </div>
      {jobs.isLoading ? (
        <ListSkeleton rows={4} />
      ) : !list.length ? (
        <EmptyState
          title="No jobs match these filters"
          text="Try widening your distance or lowering the minimum match."
        />
      ) : (
        <ul className="space-y-3">
          {list.map((j) => (
            <li key={j.id}>
              <Link
                to="/jobs/$id"
                params={{ id: j.id }}
                className="flex items-center gap-4 rounded-xl border bg-card p-4 transition hover:border-primary"
              >
                <MatchRing value={j.match.total} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{j.title}</h2>
                  <p className="text-sm text-muted-foreground">{j.employer}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" aria-hidden />
                      {j.location} · {j.distanceMiles} mi
                    </span>
                    <span>{j.salary}</span>
                  </div>
                </div>
                <div className="hidden flex-col items-end gap-1 sm:flex">
                  <Badge variant="secondary">{j.contractType}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Posted{" "}
                    {new Date(j.postedDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
  options: string[][];
}) {
  const id = "f-" + label.replace(/\s/g, "");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Any</SelectItem>
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
