import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import Icon from "./Icon";
import ProfileForm from "./ProfileForm";
import { useAuth } from "../context/AuthContext";
import useJobs from "../hooks/useJobs";
import useProfile from "../hooks/useProfile";

const EMPTY_PROFILE = {
  basics: {},
  skills: [],
  experience: [],
  projects: [],
  education: [],
  certifications: [],
  preferences: { target_roles: [], job_types: [], locations: [], work_modes: [], min_salary: null, needs_visa_sponsorship: null },
};

// Tab 1: upload a CV to build the profile, then check and edit it.
export default function SearchProfileTab() {
  const { session, endSession } = useAuth();
  const profile = useProfile(session.token, endSession);
  const scout = useJobs(session.token, endSession);
  const navigate = useNavigate();
  const scoutAvailable = scout.status === "not_run";
  const [manual, setManual] = useState(false);
  const fileInput = useRef(null);
  const uploading = profile.busy === "upload";
  const current = profile.profile || (manual ? EMPTY_PROFILE : null);

  // Save first (Scout reads the saved profile); if Scout hasn't run yet, run it and then show the jobs it found.
  const saveAndScout = async (draft) => {
    const saved = await profile.save(draft);
    if (saved && scoutAvailable && (await scout.run())) navigate("/jobs");
    return saved;
  };

  const chooseFile = () => fileInput.current.click();
  const pickFile = (event) => {
    const file = event.target.files[0];
    event.target.value = ""; // lets the same file be picked again
    if (file) profile.upload(file);
  };

  return (
    <div>
      {current && (
        <div className="search-profile__toolbar">
          <p className="text-body-s chat-muted">
            {profile.source === "cv" ? "Built from your CV. Check it and fill in anything missing." : "Filled in by you."}
          </p>
          <Button variant="secondary" icon="upload" onClick={chooseFile} disabled={uploading}>
            {uploading ? "Reading your CV…" : profile.profile ? "Replace CV" : "Upload CV"}
          </Button>
        </div>
      )}

      {profile.error && profile.errorKind !== "save" && (
        <p className="notice notice--red text-body-m" role="alert">
          {profile.error}
        </p>
      )}
      {profile.status === "loading" && <p className="text-body-s chat-muted">Loading your profile…</p>}

      {profile.status === "empty" && !current && (
        <div className="empty-card">
          <Icon name="file-text" size={32} />
          <p className="text-heading-m">Upload your CV</p>
          <p className="text-body-m chat-muted">We'll read it and fill in your search profile. It takes about 10 seconds.</p>
          <Button icon="upload" onClick={chooseFile} disabled={uploading}>
            {uploading ? "Reading your CV…" : "Choose a PDF"}
          </Button>
          <Button variant="ghost" onClick={() => setManual(true)} disabled={uploading}>
            Fill in manually instead
          </Button>
        </div>
      )}

      {current && (
        <ProfileForm
          key={profile.updatedAt || "new"}
          profile={current}
          saving={profile.busy === "save"}
          saveError={profile.errorKind === "save" ? profile.error : scout.error?.message || ""}
          onSave={saveAndScout}
          scoutAvailable={scoutAvailable}
          scouting={scout.running}
        />
      )}

      <input ref={fileInput} type="file" accept="application/pdf" hidden onChange={pickFile} />
    </div>
  );
}
