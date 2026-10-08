import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, PenLine, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { JourneyStepper, PageTitle } from "@/components/journey";
import { ListSkeleton, Panel } from "@/components/bits";
import * as api from "@/lib/api";
import { qk } from "@/lib/queries";
import { completeStep } from "@/lib/session";
import type { Profile, WorkExperience, Qualification } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Career Access" },
      { name: "description", content: "Tell us about your experience, skills and goals." },
      { property: "og:title", content: "Your profile — Career Access" },
      { property: "og:description", content: "Tell us about your experience, skills and goals." },
    ],
  }),
  component: ProfilePage,
});

export const LANGUAGES = [
  "English",
  "Arabic",
  "Hindi",
  "Urdu",
  "Ukrainian",
  "Polish",
  "Farsi",
  "Pashto",
  "Tigrinya",
  "Romanian",
  "Spanish",
  "French",
  "Portuguese",
  "Chinese",
];
const RTW = [
  "I have the right to work",
  "Graduate visa",
  "Skilled Worker visa",
  "Refugee status",
  "Not sure",
];
const uid = () => Math.random().toString(36).slice(2, 9);

function ProfilePage() {
  const { data, isLoading } = useQuery(qk.profile);
  return (
    <>
      <JourneyStepper current={1} />
      <PageTitle
        title="Tell us about you"
        intro="Upload a CV or fill in the form. You can change anything later."
      />
      {isLoading || !data ? <ListSkeleton rows={4} /> : <ProfileForm initial={data} />}
    </>
  );
}

function ProfileForm({ initial }: { initial: Profile }) {
  const [p, setP] = useState<Profile>(initial);
  const [consent, setConsent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  useEffect(() => setP(initial), [initial]);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setP((x: Profile) => ({ ...x, [k]: v }));

  const parse = useMutation({
    mutationFn: api.parseCv,
    onSuccess: (partial) => {
      setP((x: Profile) => ({ ...x, ...partial }));
      toast.success("We filled in the form from your CV. Please check it.");
    },
  });

  const analyse = useMutation({
    mutationFn: async () => {
      await api.saveProfile(p);
      return api.generateCareerOptions();
    },
    onSuccess: (opts) => {
      qc.setQueryData(qk.options.queryKey, opts);
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      completeStep(1);
      navigate({ to: "/career-options" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-start gap-4 rounded-xl border bg-card p-5 text-left hover:border-primary"
          disabled={parse.isPending}
        >
          <FileUp className="mt-0.5 size-6 text-primary" aria-hidden />
          <span>
            <span className="block font-medium">
              {parse.isPending ? "Reading your CV…" : "Upload your CV"}
            </span>
            <span className="text-sm text-muted-foreground">
              PDF or DOCX. We'll fill in the form for you.
            </span>
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          aria-label="Upload CV file"
          onChange={(e) => e.target.files?.[0] && parse.mutate(e.target.files[0])}
        />
        <a
          href="#personal"
          className="flex items-start gap-4 rounded-xl border bg-card p-5 hover:border-primary"
        >
          <PenLine className="mt-0.5 size-6 text-primary" aria-hidden />
          <span>
            <span className="block font-medium">Fill in manually</span>
            <span className="text-sm text-muted-foreground">
              Answer a few short questions below.
            </span>
          </span>
        </a>
      </div>

      <Panel>
        <h2 id="personal" className="mb-4 text-lg font-semibold">
          Personal
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Full name" id="name">
            <Input id="name" value={p.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Current UK town" id="town">
            <Input
              id="town"
              value={p.town}
              onChange={(e) => set("town", e.target.value)}
              placeholder="e.g. Taunton"
            />
          </Field>
          <Field label="Home language" id="lang">
            <Select value={p.homeLanguage} onValueChange={(v) => set("homeLanguage", v)}>
              <SelectTrigger id="lang">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-4 text-lg font-semibold">Right to work</h2>
        <Field label="Your status" id="rtw">
          <Select value={p.rightToWork} onValueChange={(v) => set("rightToWork", v)}>
            <SelectTrigger id="rtw" className="md:w-80">
              <SelectValue placeholder="Choose one" />
            </SelectTrigger>
            <SelectContent>
              {RTW.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <p className="mt-2 text-sm text-muted-foreground">We don't give immigration advice.</p>
      </Panel>

      <Panel>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Work experience</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              set("experience", [
                ...p.experience,
                {
                  id: uid(),
                  jobTitle: "",
                  employerType: "",
                  country: "",
                  startYear: 2020,
                  endYear: 2024,
                  tasks: [],
                  tools: [],
                },
              ])
            }
          >
            <Plus className="size-4" /> Add job
          </Button>
        </div>
        {p.experience.length === 0 && (
          <p className="text-sm text-muted-foreground">No jobs added yet.</p>
        )}
        <div className="space-y-4">
          {p.experience.map((w: WorkExperience, i: number) => {
            const upd = (patch: Partial<WorkExperience>) =>
              set(
                "experience",
                p.experience.map((x: WorkExperience, j: number) => (j === i ? { ...x, ...patch } : x)),
              );
            return (
              <div key={w.id} className="rounded-lg border bg-background p-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="Job title" id={`jt${i}`}>
                    <Input
                      id={`jt${i}`}
                      value={w.jobTitle}
                      onChange={(e) => upd({ jobTitle: e.target.value })}
                    />
                  </Field>
                  <Field label="Employer type" id={`et${i}`}>
                    <Input
                      id={`et${i}`}
                      value={w.employerType}
                      onChange={(e) => upd({ employerType: e.target.value })}
                      placeholder="e.g. Logistics company"
                    />
                  </Field>
                  <Field label="Country" id={`c${i}`}>
                    <Input
                      id={`c${i}`}
                      value={w.country}
                      onChange={(e) => upd({ country: e.target.value })}
                    />
                  </Field>
                  <Field label="From (year)" id={`sy${i}`}>
                    <Input
                      id={`sy${i}`}
                      type="number"
                      value={w.startYear}
                      onChange={(e) => upd({ startYear: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="To (year)" id={`ey${i}`}>
                    <Input
                      id={`ey${i}`}
                      type="number"
                      value={w.endYear}
                      onChange={(e) => upd({ endYear: Number(e.target.value) })}
                    />
                  </Field>
                  <p className="self-end pb-2 text-sm text-muted-foreground">
                    {Math.max(0, w.endYear - w.startYear)} years
                  </p>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Field label="Main tasks" id={`t${i}`}>
                    <TagInput id={`t${i}`} value={w.tasks} onChange={(v) => upd({ tasks: v })} />
                  </Field>
                  <Field label="Tools" id={`to${i}`}>
                    <TagInput id={`to${i}`} value={w.tools} onChange={(v) => upd({ tools: v })} />
                  </Field>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-destructive"
                  onClick={() =>
                    set(
                      "experience",
                      p.experience.filter((_: WorkExperience, j: number) => j !== i),
                    )
                  }
                >
                  <Trash2 className="size-4" /> Remove
                </Button>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Qualifications</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              set("qualifications", [
                ...p.qualifications,
                { id: uid(), name: "", country: "", level: "" },
              ])
            }
          >
            <Plus className="size-4" /> Add qualification
          </Button>
        </div>
        {p.qualifications.length === 0 && (
          <p className="text-sm text-muted-foreground">No qualifications added yet.</p>
        )}
        <div className="space-y-3">
          {p.qualifications.map((q: Qualification, i: number) => {
            const upd = (patch: Partial<Qualification>) =>
              set(
                "qualifications",
                p.qualifications.map((x: Qualification, j: number) => (j === i ? { ...x, ...patch } : x)),
              );
            return (
              <div
                key={q.id}
                className="grid items-end gap-3 rounded-lg border bg-background p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
              >
                <Field label="Name" id={`qn${i}`}>
                  <Input
                    id={`qn${i}`}
                    value={q.name}
                    onChange={(e) => upd({ name: e.target.value })}
                  />
                </Field>
                <Field label="Country" id={`qc${i}`}>
                  <Input
                    id={`qc${i}`}
                    value={q.country}
                    onChange={(e) => upd({ country: e.target.value })}
                  />
                </Field>
                <Field label="Level" id={`ql${i}`}>
                  <Input
                    id={`ql${i}`}
                    value={q.level}
                    onChange={(e) => upd({ level: e.target.value })}
                    placeholder="e.g. Bachelor's degree"
                  />
                </Field>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove qualification"
                  onClick={() =>
                    set(
                      "qualifications",
                      p.qualifications.filter((_: Qualification, j: number) => j !== i),
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel className="grid gap-4 md:grid-cols-2">
        <Field label="Skills (press Enter to add)" id="skills">
          <TagInput id="skills" value={p.skills} onChange={(v) => set("skills", v)} />
        </Field>
        <Field label="Languages you speak" id="langs">
          <TagInput id="langs" value={p.languages} onChange={(v) => set("languages", v)} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Career goals" id="goals">
            <Textarea
              id="goals"
              value={p.goals}
              onChange={(e) => set("goals", e.target.value)}
              placeholder="What kind of work would you like?"
            />
          </Field>
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-4 text-lg font-semibold">Preferences</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Job type" id="jt">
            <Select
              value={p.preferences.jobType}
              onValueChange={(v) => set("preferences", { ...p.preferences, jobType: v })}
            >
              <SelectTrigger id="jt">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Permanent", "Fixed-term", "Temporary", "Any"].map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Hours" id="hrs">
            <Select
              value={p.preferences.hours}
              onValueChange={(v) => set("preferences", { ...p.preferences, hours: v })}
            >
              <SelectTrigger id="hrs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Full-time", "Part-time", "Either"].map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Max travel (miles)" id="travel">
            <Input
              id="travel"
              type="number"
              min={0}
              value={p.preferences.maxTravelMiles}
              onChange={(e) =>
                set("preferences", { ...p.preferences, maxTravelMiles: Number(e.target.value) })
              }
            />
          </Field>
        </div>
      </Panel>

      <div className="flex flex-col gap-4 rounded-xl border bg-primary-soft p-5 md:flex-row md:items-center">
        <label className="flex flex-1 items-start gap-3 text-sm">
          <Checkbox
            checked={consent}
            onCheckedChange={(v) => setConsent(v === true)}
            className="mt-0.5"
          />
          I understand Career Access uses AI to suggest options. I'll check important information
          myself.
        </label>
        <Button
          size="lg"
          className="h-12"
          disabled={!consent || !p.name || analyse.isPending}
          onClick={() => analyse.mutate()}
        >
          {analyse.isPending ? "Analysing…" : "Analyse my profile"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function TagInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setText("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    }
  };
  return (
    <div>
      <Input
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        onBlur={add}
        placeholder="Type and press Enter"
      />
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((v) => (
            <Badge key={v} variant="soft" className="gap-1 py-1">
              {v}
              <button
                aria-label={`Remove ${v}`}
                onClick={() => onChange(value.filter((x) => x !== v))}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
