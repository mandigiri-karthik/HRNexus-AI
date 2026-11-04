import { useState } from "react";
import Button from "./Button";
import TagInput from "./TagInput";

// Must match REQUIRED_FOR_SEARCH and EMAIL_PATTERN in the backend's profile_schema.py.
const REQUIRED = ["target_roles", "locations", "work_modes", "needs_visa_sponsorship"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WORK_MODES = [
  ["remote", "Remote"],
  ["hybrid", "Hybrid"],
  ["on-site", "On-site"],
];
const TAGLINE_MAX = 120;

const isEmpty = (value) => value === null || value === undefined || value === "" || (Array.isArray(value) && !value.length);
const dates = (item) => [item.start, item.end].filter(Boolean).join(" – ");

function Field({ label, required, missing, wide, hint, children }) {
  return (
    <div className={`field${missing ? " field--missing" : ""}${wide ? " field--wide" : ""}`} role="group" aria-label={label}>
      <span className="field__label text-label-s">
        {label}
        {required && <span className="field__required">Required</span>}
      </span>
      {children}
      {hint && <span className="text-body-s chat-muted">{hint}</span>}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, wide, maxLength, hint, required, missing, type = "text" }) {
  return (
    <Field label={label} wide={wide} hint={hint} required={required} missing={missing}>
      <input
        className="field__input"
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value || null)}
      />
    </Field>
  );
}

// Read-only list for experience, education and projects. Replace CV refreshes them.
function Entries({ title, items, describe }) {
  if (!items.length) return null;
  return (
    <section className="profile-section">
      <h2 className="text-heading-s">{title}</h2>
      {items.map((item, index) => {
        const { heading, detail, bullets } = describe(item);
        return (
          <div key={index} className="entry">
            <p className="text-body-m-medium">{heading || "—"}</p>
            {detail && <p className="text-body-s chat-muted">{detail}</p>}
            {bullets?.length > 0 && (
              <ul className="text-body-s">
                {bullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}

// The editable search profile: tagline, details, preferences and skills; experience and education read-only.
export default function ProfileForm({ profile, saving, saveError, onSave, scoutAvailable, scouting }) {
  const [draft, setDraft] = useState(profile);
  const [dirty, setDirty] = useState(false);
  const basics = draft.basics || {};
  const preferences = draft.preferences || {};
  const missing = REQUIRED.filter((name) => isEmpty(preferences[name]));
  if (!EMAIL_PATTERN.test((basics.email || "").trim())) missing.push("email");

  const change = (section, name, value) => {
    setDraft((current) => ({ ...current, [section]: { ...(current[section] || {}), [name]: value } }));
    setDirty(true);
  };
  const setPreference = (name) => (value) => change("preferences", name, value);
  const setBasic = (name) => (value) => change("basics", name, value);
  const setSkills = (skills) => {
    setDraft((current) => ({ ...current, skills }));
    setDirty(true);
  };

  const workModes = preferences.work_modes || [];
  const toggleWorkMode = (mode) =>
    setPreference("work_modes")(workModes.includes(mode) ? workModes.filter((item) => item !== mode) : [...workModes, mode]);

  // Saving needs every required field filled, and either a change to save or Scout still to run.
  const busy = saving || scouting;
  const canSave = (dirty || scoutAvailable) && !missing.length && !busy;
  let saveStatus = "All changes saved";
  if (missing.length) saveStatus = "Fill in the required fields to save.";
  else if (scouting) saveStatus = "Scout is searching the job board and scoring each job. About 15 seconds.";
  else if (dirty) saveStatus = "Unsaved changes";
  else if (scoutAvailable) saveStatus = "Ready. Scout can search for jobs once.";

  let buttonLabel = scoutAvailable ? "Save profile & run Scout" : "Save profile";
  if (saving) buttonLabel = "Saving…";
  if (scouting) buttonLabel = "Scout is finding jobs…";

  const save = async (event) => {
    event.preventDefault();
    if (!canSave) return;
    if (await onSave(draft)) setDirty(false);
  };

  return (
    <form onSubmit={save}>
      <p className={`notice text-body-m ${missing.length ? "notice--amber" : "notice--accent"}`}>
        {missing.length ? "Add the highlighted fields to unlock job search." : "Your profile is ready for job search."}
      </p>

      <section className="profile-section">
        <h2 className="text-heading-s">About you</h2>
        <div className="profile-section__grid">
          <TextField
            label="Tagline"
            wide
            value={basics.headline}
            onChange={setBasic("headline")}
            maxLength={TAGLINE_MAX}
            placeholder="e.g. MSc AI student · Python, LangChain, AWS"
            hint={`One line that sums you up. ${TAGLINE_MAX - (basics.headline?.length || 0)} characters left.`}
          />
          <TextField label="Full name" value={basics.full_name} onChange={setBasic("full_name")} />
          <TextField label="Location" value={basics.location} onChange={setBasic("location")} placeholder="e.g. Glasgow, UK" />
          <TextField label="Right to work" value={basics.work_authorization} onChange={setBasic("work_authorization")} placeholder="e.g. Graduate visa" />
          <TextField
            label="Email"
            type="email"
            required
            missing={missing.includes("email")}
            value={basics.email}
            onChange={setBasic("email")}
            placeholder="you@example.com"
          />
          <TextField label="Phone" value={basics.phone} onChange={setBasic("phone")} />
        </div>
      </section>

      <section className="profile-section">
        <h2 className="text-heading-s">Job search preferences</h2>
        <div className="profile-section__grid">
          <Field label="Target roles" required missing={missing.includes("target_roles")}>
            <TagInput
              label="Target roles"
              values={preferences.target_roles || []}
              onChange={setPreference("target_roles")}
              placeholder="e.g. AI Engineer, then Enter"
            />
          </Field>
          <Field label="Locations" required missing={missing.includes("locations")}>
            <TagInput
              label="Locations"
              values={preferences.locations || []}
              onChange={setPreference("locations")}
              placeholder="e.g. London, then Enter"
            />
          </Field>
          <Field label="Work mode" required missing={missing.includes("work_modes")}>
            <div className="choice-row">
              {WORK_MODES.map(([value, label]) => (
                <button key={value} type="button" className="option" aria-pressed={workModes.includes(value)} onClick={() => toggleWorkMode(value)}>
                  {label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Need visa sponsorship?" required missing={missing.includes("needs_visa_sponsorship")}>
            <div className="choice-row">
              {[
                [true, "Yes"],
                [false, "No"],
              ].map(([value, label]) => (
                <button
                  key={label}
                  type="button"
                  className="option"
                  aria-pressed={preferences.needs_visa_sponsorship === value}
                  onClick={() => setPreference("needs_visa_sponsorship")(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Job types">
            <TagInput
              label="Job types"
              values={preferences.job_types || []}
              onChange={setPreference("job_types")}
              placeholder="e.g. Graduate, Full-time"
            />
          </Field>
          <TextField label="Minimum salary" value={preferences.min_salary} onChange={setPreference("min_salary")} placeholder="e.g. £30,000" />
        </div>
      </section>

      <section className="profile-section">
        <h2 className="text-heading-s">Skills</h2>
        <TagInput label="Skills" values={draft.skills || []} onChange={setSkills} placeholder="Add a skill, then Enter" />
      </section>

      <Entries
        title="Experience"
        items={draft.experience || []}
        describe={(job) => ({ heading: [job.title, job.company].filter(Boolean).join(" · "), detail: dates(job), bullets: job.highlights })}
      />
      <Entries
        title="Education"
        items={draft.education || []}
        describe={(edu) => ({ heading: edu.degree, detail: [edu.institution, edu.end].filter(Boolean).join(" · ") })}
      />
      <Entries title="Projects" items={draft.projects || []} describe={(project) => ({ heading: project.name, bullets: project.highlights })} />

      <div className="save-bar">
        {saveError ? (
          <span className="save-bar__status text-body-s save-bar__status--error" role="alert">
            {saveError}
          </span>
        ) : (
          <span className={`save-bar__status text-body-s${missing.length ? " save-bar__status--warning" : ""}`} role="status">
            {saveStatus}
          </span>
        )}
        <Button type="submit" icon={scoutAvailable ? "search" : "check"} disabled={!canSave}>
          {buttonLabel}
        </Button>
      </div>
    </form>
  );
}
