import { useCallback, useEffect, useState } from "react";
import { getProfile, saveProfile, uploadProfileCv } from "../services/api";

// The saved profile and the actions on it. The tab only draws what this returns.
export default function useProfile(token, onUnauthorized) {
  const [state, setState] = useState({ status: "loading", profile: null, source: null, updatedAt: null });
  const [busy, setBusy] = useState(null); // "upload" | "save" | null
  // Which action failed, so the message can appear next to it: "load" | "upload" | "save".
  const [error, setError] = useState({ kind: null, message: "" });

  const apply = useCallback((data) => {
    setState({
      status: data.profile ? "ready" : "empty",
      profile: data.profile,
      source: data.source,
      updatedAt: data.updated_at,
    });
  }, []);

  // Load the saved profile when the tab opens.
  useEffect(() => {
    let cancelled = false;
    getProfile(token)
      .then((data) => {
        if (!cancelled) apply(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) return onUnauthorized();
        setState((current) => ({ ...current, status: "empty" }));
        setError({ kind: "load", message: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [token, apply, onUnauthorized]);

  // Runs one backend call and applies its reply. Returns true when it worked.
  const run = async (kind, call) => {
    setBusy(kind);
    setError({ kind: null, message: "" });
    try {
      apply(await call());
      return true;
    } catch (err) {
      if (err.status === 401) onUnauthorized();
      else setError({ kind, message: err.message });
      return false;
    } finally {
      setBusy(null);
    }
  };

  return {
    ...state,
    busy,
    error: error.message,
    errorKind: error.kind,
    upload: (file) => run("upload", () => uploadProfileCv(token, file)),
    save: (profile) => run("save", () => saveProfile(token, profile)),
  };
}
