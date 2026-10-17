import Button from "./Button";
import Chip from "./Chip";

const SKILLS_SHOWN = 8;

const joined = (values) => (values?.length ? values.join(", ") : null);
const capitalise = (word) => word[0].toUpperCase() + word.slice(1);

function Row({ label, value, pending }) {
  const showPending = pending && value == null;
  return (
    <div className="profile-panel__row">
      <span className="text-body-s profile-panel__muted">{label}</span>
      <span className={`text-body-s profile-panel__value${showPending ? " profile-panel__value--pending" : ""}`}>
        {showPending ? "pending" : (value ?? "—")}
      </span>
    </div>
  );
}

// The "Search profile" panel beside the chat. Fills in as the intake answers come back.
export default function ProfilePanel({ profile, askingField, complete, onConfirm, open, onClose }) {
  const basics = profile.basics || {};
  const preferences = profile.preferences || {};
  const skills = profile.skills || [];
  const latestRole = profile.experience?.[0]?.title;
  const isAsking = (name) => askingField === `preferences.${name}`;

  let visa = null;
  if (preferences.needs_visa_sponsorship === true) visa = "Needs sponsorship";
  if (preferences.needs_visa_sponsorship === false) visa = "Not needed";

  return (
    <aside className={`profile-panel${open ? " profile-panel--open" : ""}`} aria-label="Search profile">
      <div>
        <div className="profile-panel__head">
          <h2 className="text-heading-m">Search profile</h2>
          <Chip tone={complete ? "accent" : "amber"}>{complete ? "Ready" : "Draft"}</Chip>
                    <Button variant="ghost" icon="x" className="profile-panel__close" onClick={onClose} aria-label="Close profile" />
        </div>
        <p className="text-body-s profile-panel__muted">Built from your CV and your answers.</p>
      </div>

      <section>
        <h3 className="text-overline profile-panel__muted">Candidate</h3>
        <div className="profile-panel__card">
          <p className="text-heading-s">{basics.full_name || "—"}</p>
          <p className="text-body-s profile-panel__muted">{[latestRole, basics.location].filter(Boolean).join(" · ")}</p>
        </div>
      </section>

      <section>
        <h3 className="text-overline profile-panel__muted">Target roles</h3>
        <div className="profile-panel__chips">
          {preferences.target_roles?.length ? (
            preferences.target_roles.map((role) => (
              <Chip key={role} tone="accent">
                {role}
              </Chip>
            ))
          ) : (
            <span className="text-body-s profile-panel__muted">{isAsking("target_roles") ? "pending" : "—"}</span>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-overline profile-panel__muted">Skills · {skills.length}</h3>
        <div className="profile-panel__chips">
          {skills.slice(0, SKILLS_SHOWN).map((skill) => (
            <Chip key={skill}>{skill}</Chip>
          ))}
          {skills.length > SKILLS_SHOWN && <Chip>+{skills.length - SKILLS_SHOWN}</Chip>}
        </div>
      </section>

      <section>
        <h3 className="text-overline profile-panel__muted">Preferences</h3>
        <div className="profile-panel__rows">
          <Row label="Location" value={joined(preferences.locations)} pending={isAsking("locations")} />
          <Row label="Work mode" value={joined(preferences.work_modes?.map(capitalise))} pending={isAsking("work_modes")} />
          <Row label="Job types" value={joined(preferences.job_types)} pending={isAsking("job_types")} />
          <Row label="Salary floor" value={preferences.min_salary} pending={isAsking("min_salary")} />
          <Row label="Visa sponsorship" value={visa} pending={isAsking("needs_visa_sponsorship")} />
        </div>
      </section>

      <Button className="profile-panel__confirm" icon="check" disabled={!complete} onClick={onConfirm}>
        Confirm profile &amp; start search
      </Button>
    </aside>
  );
}