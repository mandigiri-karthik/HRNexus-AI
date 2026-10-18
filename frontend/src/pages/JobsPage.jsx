import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import JobRow from "../components/JobRow";
import { useAuth } from "../context/AuthContext";
import useJobs from "../hooks/useJobs";

// The jobs Scout found. Scout itself runs from the search profile ("Save profile & run Scout").
export default function JobsPage() {
  const { session, endSession } = useAuth();
  const scout = useJobs(session.token, endSession);

  return (
    <div className="jobs-page">
      <header className="jobs-page__header">
        <div>
          <h1 className="text-display-l">Jobs</h1>
          <p className="text-body-s chat-muted">
            {scout.status === "done"
              ? `${scout.jobs.length} jobs for ${scout.searchedRoles.join(", ")} · found by Scout on ${new Date(scout.searchedAt).toLocaleDateString()}`
              : "Found by Scout and ranked by how well they fit your profile."}
          </p>
        </div>
      </header>

      {scout.error && (
        <p className="notice notice--red text-body-m" role="alert">
          {scout.error.message}
        </p>
      )}
      {scout.status === "loading" && <p className="text-body-s chat-muted">Loading your jobs…</p>}
      {scout.status === "running" && (
        <p className="notice notice--accent text-body-m" role="status">
          Scout is still searching. Refresh in a moment.
        </p>
      )}

      {scout.status === "not_run" && (
        <div className="empty-card">
          <Icon name="briefcase" size={32} />
          <p className="text-heading-m">Scout hasn't searched yet</p>
          <p className="text-body-m chat-muted">
            Finish your search profile and press "Save profile &amp; run Scout". Scout searches once, then your jobs appear here.
          </p>
          <Link className="button button--primary" to="/">
            Go to your search profile
          </Link>
        </div>
      )}

      {scout.status === "done" && scout.jobs.length === 0 && (
        <div className="empty-card">
          <p className="text-heading-m">Scout found no jobs</p>
          <p className="text-body-m chat-muted">There were no matching adverts for your roles and locations at the time.</p>
        </div>
      )}

      {scout.jobs.length > 0 && (
        <div className="job-list">
          {scout.jobs.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
