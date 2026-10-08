import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Pencil, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { BackToJobs, JourneyStepper, PageTitle } from "@/components/journey";
import { ListSkeleton, Panel, SourceChip } from "@/components/bits";
import * as api from "@/lib/api";
import { qk } from "@/lib/queries";
import { completeStep } from "@/lib/session";
import type { DocType, DraftParagraph, Tone } from "@/lib/types";

const DOCS: [DocType, string][] = [
  ["statement", "Supporting statement"],
  ["cover_letter", "Cover letter / email"],
  ["eoi", "Expression of interest"],
  ["cv", "CV tailored to this job"],
];

export const Route = createFileRoute("/_authenticated/apply/$jobId/")({
  validateSearch: (s: Record<string, unknown>): { docType?: DocType } => ({
    docType: DOCS.some(([d]) => d === s.docType) ? (s.docType as DocType) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Application support — Career Access" },
      {
        name: "description",
        content: "Create an honest application draft based only on your profile.",
      },
      { property: "og:title", content: "Application support — Career Access" },
      {
        property: "og:description",
        content: "Create an honest application draft based only on your profile.",
      },
    ],
  }),
  component: ApplyPage,
});

function ApplyPage() {
  const { jobId } = Route.useParams();
  const search = Route.useSearch();
  const job = useQuery(qk.job(jobId));
  const existing = useQuery(qk.draft(jobId));
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [docType, setDocType] = useState<DocType>(search.docType ?? "statement");
  const [tone, setTone] = useState<Tone>("professional");
  const [paras, setParas] = useState<DraftParagraph[]>([]);
  const [editing, setEditing] = useState(false);
  const draft = existing.data;

  useEffect(() => {
    if (draft) setParas(draft.paragraphs);
  }, [draft]);

  const create = useMutation({
    mutationFn: () => api.createDraft({ jobId, docType, tone }),
    onSuccess: (d) => {
      qc.setQueryData(qk.draft(jobId).queryKey, d);
      qc.invalidateQueries({ queryKey: ["applications"] });
      setEditing(false);
    },
  });
  const save = useMutation({
    mutationFn: () => api.updateDraft(draft!.id, paras),
    onSuccess: (d) => {
      qc.setQueryData(qk.draft(jobId).queryKey, d);
      completeStep(5, jobId);
      navigate({ to: "/apply/$jobId/review", params: { jobId } });
    },
  });

  const edit = (id: string, text: string) =>
    setParas((ps) =>
      ps.map((p) =>
        p.id === id
          ? { ...p, text, unsupported: false, profileSource: p.profileSource ?? "Edited by you" }
          : p,
      ),
    );
  const remove = (id: string) => setParas((ps) => ps.filter((p) => p.id !== id));

  return (
    <>
      <JourneyStepper current={5} />
      <BackToJobs />
      <div className="mt-4">
        <PageTitle
          title="Application support"
          intro={job.data ? `${job.data.title} at ${job.data.employer}` : undefined}
        />
      </div>
      <div className="mb-6 flex items-start gap-3 rounded-xl border bg-primary-soft p-4 text-sm text-primary">
        <ShieldCheck className="size-5 shrink-0" aria-hidden />
        <p className="font-medium">
          Career Access never invents experience, qualifications or achievements.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Panel className="space-y-5 self-start">
          <div>
            <p className="mb-2 font-medium">Document type</p>
            <RadioGroup value={docType} onValueChange={(v) => setDocType(v as DocType)}>
              {DOCS.map(([v, l]) => (
                <div key={v} className="flex items-center gap-2">
                  <RadioGroupItem value={v} id={`doc-${v}`} />
                  <Label htmlFor={`doc-${v}`} className="font-normal">
                    {l}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div>
            <p className="mb-2 font-medium">Tone</p>
            <RadioGroup
              value={tone}
              onValueChange={(v) => setTone(v as Tone)}
              className="flex gap-4"
            >
              {(["professional", "warm"] as const).map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <RadioGroupItem value={t} id={`tone-${t}`} />
                  <Label htmlFor={`tone-${t}`} className="font-normal capitalize">
                    {t}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? "Writing your draft…" : draft ? "Create new draft" : "Create draft"}
          </Button>
        </Panel>

        <div>
          {create.isPending || existing.isLoading ? (
            <ListSkeleton rows={4} />
          ) : !draft ? (
            <Panel className="text-center text-muted-foreground">
              Choose a document type and tone, then create your draft.
            </Panel>
          ) : (
            <>
              <div className="space-y-3">
                {paras.map((p) => (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-4 ${p.unsupported ? "border-destructive bg-destructive-soft" : "bg-card"}`}
                  >
                    {editing ? (
                      <Textarea
                        value={p.text}
                        onChange={(e) => edit(p.id, e.target.value)}
                        aria-label="Edit paragraph"
                      />
                    ) : (
                      <p className={p.unsupported ? "text-destructive" : ""}>{p.text}</p>
                    )}
                    {p.unsupported ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-medium text-destructive">
                        <AlertTriangle className="size-4" aria-hidden /> Not in your profile — edit
                        or remove
                        <Button size="sm" variant="outline" onClick={() => remove(p.id)}>
                          Remove
                        </Button>
                        {!editing && (
                          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                            Edit
                          </Button>
                        )}
                      </div>
                    ) : (
                      p.profileSource && <SourceChip source={p.profileSource} />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => create.mutate()}>
                  <RefreshCw className="size-4" /> Regenerate
                </Button>
                <Button variant="outline" onClick={() => setEditing((e) => !e)}>
                  <Pencil className="size-4" /> {editing ? "Done editing" : "Edit"}
                </Button>
                <Button className="ml-auto" onClick={() => save.mutate()} disabled={save.isPending}>
                  Continue to review
                </Button>
              </div>
              {paras.some((p) => p.unsupported) && (
                <p className="mt-2 text-right text-sm text-destructive">
                  Please fix the highlighted text before you send this.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
