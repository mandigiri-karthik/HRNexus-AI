import { useCallback, useEffect, useState } from "react";
import { getJobs, runScout } from "../services/api";

// Scout's job search for this user. It runs once per account; afterwards its saved results are loaded.
export default function useJobs(token, onUnauthorized) {
  const [state, setState] = useState({ status: "loading", jobs: [], searchedRoles: [], searchedAt: null });
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null); // { status, message }

  const apply = useCallback((data) => {
    setState({
      status: data.status, // "not_run" | "running" | "done"
      jobs: data.jobs || [],
      searchedRoles: data.searched_roles || [],
      searchedAt: data.searched_at || null,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    getJobs(token)
      .then((data) => {
        if (!cancelled) apply(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) return onUnauthorized();
        setError({ status: err.status, message: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [token, apply, onUnauthorized]);

  // Runs Scout. Returns true when it found and saved the jobs.
  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      apply(await runScout(token));
      return true;
    } catch (err) {
      if (err.status === 401) {
        onUnauthorized();
      } else {
        setError({ status: err.status, message: err.message });
        if (err.status === 403) apply(await getJobs(token).catch(() => ({ status: "done" }))); // already used: show what's saved
      }
      return false;
    } finally {
      setRunning(false);
    }
  };

  return { ...state, running, error, run };
}
