import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { JourneyStepper, PageTitle } from "@/components/journey";
import {
  EmptyState,
  ListSkeleton,
  Panel,
  RecommendationList,
  statusLabel,
} from "@/components/bits";
import * as api from "@/lib/api";
import { qk } from "@/lib/queries";
import { completeStep } from "@/lib/session";
import type { Application, ApplicationStatus } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/follow-up")({
  head: () => ({
    meta: [
      { title: "Follow-up — Career Access" },
      {
        name: "description",
        content: "Track your applications and get advice on what to do next.",
      },
      { property: "og:title", content: "Follow-up — Career Access" },
      {
        property: "og:description",
        content: "Track your applications and get advice on what to do next.",
      },
    ],
  }),
  component: FollowUp,
});

const STATUSES: ApplicationStatus[] = [
  "saved",
  "draft",
  "approved",
  "applied",
  "interview",
  "rejected",
  "offer",
];

function FollowUp() {
  const apps = useQuery(qk.applications);
  const recs = useQuery(qk.recommendations);
  const qc = useQueryClient();
  const [rejected, setRejected] = useState<Application | null>(null);
  const [reason, setReason] = useState("");
  useEffect(() => completeStep(8), []);

  const refresh = () =>
    ["applications", "dashboard", "recommendations"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k] }),
    );
  const update = useMutation({
    mutationFn: (v: { id: string; status: ApplicationStatus; notes?: string }) =>
      api.updateApplicationStatus(v.id, v.status, v.notes),
    onSuccess: (a, v) => {
      refresh();
      if (a.status === "rejected" && v.notes === undefined) setRejected(a);
    },
  });

  return (
    <>
      <JourneyStepper current={8} />
      <PageTitle
        title="Applications & follow-up"
        intro="Keep track of every job and see what to do next."
      />
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section>
          {apps.isLoading ? (
            <ListSkeleton />
          ) : !apps.data?.length ? (
            <EmptyState
              title="No applications yet"
              text="Save or apply for a job and it will appear here."
              action={
                <Button asChild>
                  <Link to="/jobs">Find jobs</Link>
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {apps.data.map((a) => (
                <AppRow
                  key={a.id}
                  app={a}
                  onChange={(status, notes) => update.mutate({ id: a.id, status, notes })}
                />
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold">Recommended for you</h2>
          {recs.isLoading ? (
            <ListSkeleton rows={2} />
          ) : (
            <RecommendationList items={recs.data ?? []} />
          )}
        </section>
      </div>

      <Dialog open={!!rejected} onOpenChange={(v) => !v && setRejected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What happened?</DialogTitle>
            <DialogDescription>
              Sorry about {rejected?.jobTitle}. A short note helps us give better advice.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. They wanted UK experience"
            aria-label="What happened"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejected(null)}>
              Skip
            </Button>
            <Button
              disabled={!reason.trim()}
              onClick={() => {
                update.mutate({ id: rejected!.id, status: "rejected", notes: reason });
                toast.success("Thanks — we've updated your recommendations.");
                setRejected(null);
                setReason("");
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AppRow({
  app,
  onChange,
}: {
  app: Application;
  onChange: (s: ApplicationStatus, notes?: string) => void;
}) {
  const [note, setNote] = useState(app.notes ?? "");
  return (
    <li>
      <Panel className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Link
              to="/jobs/$id"
              params={{ id: app.jobId }}
              className="font-semibold hover:underline"
            >
              {app.jobTitle}
            </Link>
            <p className="text-sm text-muted-foreground">
              {app.employer} · updated {new Date(app.updatedAt).toLocaleDateString("en-GB")}
            </p>
          </div>
          <Select value={app.status} onValueChange={(v) => onChange(v as ApplicationStatus)}>
            <SelectTrigger className="sm:w-40" aria-label={`Status for ${app.jobTitle}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note"
            aria-label="Note"
          />
          <Button
            variant="outline"
            disabled={note === (app.notes ?? "")}
            onClick={() => onChange(app.status, note)}
          >
            Save note
          </Button>
        </div>
      </Panel>
    </li>
  );
}
