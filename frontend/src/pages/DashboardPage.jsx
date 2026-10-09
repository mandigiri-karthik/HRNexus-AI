import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCurrentUser } from "../services/api";

export default function DashboardPage() {
  const { session, endSession } = useAuth();
  const [user, setUser] = useState(session.user);
  const [error, setError] = useState("");

  // Ask the backend who we are. This proves the saved token is still valid.
  useEffect(() => {
    let cancelled = false;
    getCurrentUser(session.token)
      .then((freshUser) => {
        if (!cancelled) setUser(freshUser);
      })
      .catch((err) => {
        if (cancelled) return;
        // 401 means the token expired or is invalid, so log out.
        if (err.status === 401) endSession();
        else setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [session.token, endSession]);

  return (
    <main className="auth-page">
      <section className="card">
        <h1>Welcome, {user.name}</h1>
        <p className="muted">Signed in as {user.email}</p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" onClick={endSession}>
          Log out
        </button>
      </section>
    </main>
  );
}
