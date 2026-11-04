import { useState } from "react";
import Button from "./Button";
import Chip from "./Chip";
import FitScore from "./FitScore";
import Icon from "./Icon";

const thousands = (amount) => `£${Math.round(amount / 1000)}k`;

// "£40k–£50k", "£55k", or "~£43k" when the job board estimated it.
function salaryText(job) {
  if (!job.salary_max) return "Not stated";
  const low = job.salary_min || job.salary_max;
  const amount =
    Math.round(low / 1000) === Math.round(job.salary_max / 1000)
      ? thousands(job.salary_max)
      : `${thousands(low)}–${thousands(job.salary_max)}`;
  return job.salary_is_predicted ? `~${amount}` : amount;
}

// "Today", "3d ago", "2w ago".
function postedText(isoDate) {
  if (!isoDate) return "";
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// The one thing worth flagging on the row, until application status exists.
function flag(job) {
  if (job.why.includes("security clearance")) return { tone: "red", label: "Clearance" };
  if ((job.signals?.too_senior ?? 0) >= 0.6) return { tone: "neutral", label: "Too senior" };
  if (job.fit_level === "high") return { tone: "accent", label: "Strong match" };
  return null;
}

// One job in the list (Figma "Job row"). Click it to see why it matches and the advert.
export default function JobRow({ job }) {
  const [open, setOpen] = useState(false);
  const salary = salaryText(job);
  const posted = postedText(job.posted_at);
  const status = flag(job);
  const detailsId = `job-details-${job.id}`;

  return (
    <article className="job-row">
      <button type="button" className="job-row__summary" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen(!open)}>
        <FitScore score={job.fit} />
        <span className="job-row__title-block">
          <span className="job-row__title">{job.title}</span>
          <span className="job-row__company">{job.company}</span>
          <span className="job-row__meta-inline">{[job.location, salary, posted].filter(Boolean).join(" · ")}</span>
        </span>
        <span className="job-row__cell job-row__location">
          <Icon name="map-pin" size={16} />
          {job.location}
        </span>
        <span className="job-row__cell job-row__salary" title={job.salary_is_predicted ? "Estimated by the job board" : undefined}>
          <Icon name="banknote" size={16} />
          {salary}
        </span>
        <span className="job-row__cell job-row__posted">
          <Icon name="clock" size={16} />
          {posted}
        </span>
        <span className="job-row__status">{status && <Chip tone={status.tone}>{status.label}</Chip>}</span>
        <Icon name="chevron-down" size={18} className="job-row__chevron" />
      </button>

      {open && (
        <div id={detailsId} className="job-row__details">
          <p className="text-body-m-medium">{job.why}</p>
          {job.salary_is_predicted && (
            <p className="text-body-s chat-muted">The salary is the job board's estimate; the advert doesn't state one.</p>
          )}
          <p className="text-body-m job-row__description">{job.description}</p>
          <div className="job-row__actions">
            <a className="button button--secondary" href={job.url} target="_blank" rel="noopener noreferrer">
              <Icon name="external-link" size={16} />
              View advert
            </a>
            <Button variant="ghost" icon="pencil" disabled title="Coming soon">
              Tailor my CV
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
