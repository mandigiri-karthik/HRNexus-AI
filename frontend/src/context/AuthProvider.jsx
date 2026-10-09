import { useCallback, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";

const STORAGE_KEY = "hrnexus_session";

// The session is kept in localStorage so a page refresh does not log the user out.
function readStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export default function AuthProvider({ children }) {
  // session is { token, user } when logged in, or null.
  const [session, setSession] = useState(readStoredSession);

  const startSession = useCallback((newSession) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    setSession(newSession);
  }, []);

  const endSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, startSession, endSession }),
    [session, startSession, endSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
