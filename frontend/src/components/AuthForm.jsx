import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { googleLogIn, logIn, signUp } from "../services/api";

const TEXT = {
  login: {
    title: "Welcome back",
    subtitle: "Log in to continue.",
    submit: "Log in",
    google: "signin_with",
    switchPrompt: "New here?",
    switchLink: "Create an account",
    switchTo: "/signup",
  },
  signup: {
    title: "Create your account",
    subtitle: "It takes less than a minute.",
    submit: "Sign up",
    google: "signup_with",
    switchPrompt: "Already have an account?",
    switchLink: "Log in",
    switchTo: "/login",
  },
};

// One form for both pages. mode is "login" or "signup".
export default function AuthForm({ mode }) {
  const { startSession } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";
  const text = TEXT[mode];

  // Runs a login request, then saves the session or shows the error.
  async function authenticate(sendRequest) {
    setError("");
    setBusy(true);
    try {
      startSession(await sendRequest());
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    authenticate(() => (isSignup ? signUp(name, email, password) : logIn(email, password)));
  }

  function handleGoogle(response) {
    authenticate(() => googleLogIn(response.credential));
  }

  return (
    <main className="auth-page">
      <section className="card">
        <h1>{text.title}</h1>
        <p className="muted">{text.subtitle}</p>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={isSignup ? 8 : undefined}
              required
            />
          </label>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="primary" disabled={busy}>
            {busy ? "Please wait…" : text.submit}
          </button>
        </form>

        <div className="divider">or</div>

        <div className="google">
          <GoogleLogin
            text={text.google}
            onSuccess={handleGoogle}
            onError={() => setError("Google sign-in failed. Please try again.")}
          />
        </div>

        <p className="muted switch">
          {text.switchPrompt} <Link to={text.switchTo}>{text.switchLink}</Link>
        </p>
      </section>
    </main>
  );
}
