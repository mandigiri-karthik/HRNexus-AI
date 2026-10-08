import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logIn, signUp } from "@/lib/auth";
import { USE_MOCK } from "@/lib/config";

export function AuthForm({ mode, redirect }: { mode: "login" | "signup"; redirect?: string }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(mode === "login" && USE_MOCK ? "amira@example.com" : "");
  const [password, setPassword] = useState(mode === "login" && USE_MOCK ? "demo1234" : "");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp(name, email, password);
        navigate({ to: "/profile" });
      } else {
        await logIn(email, password);
        if (redirect?.startsWith("/")) navigate({ href: redirect });
        else navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {mode === "login"
          ? "Log in to continue your career journey."
          : "It takes one minute. No CV needed yet."}
      </p>
      {USE_MOCK && mode === "login" && (
        <p className="mt-4 rounded-lg bg-warning-soft p-3 text-sm text-warning">
          Demo mode: log in to explore with the fictional persona “Amira”.
        </p>
      )}
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
        </div>
        <Button type="submit" className="h-11 w-full" disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link to="/signup" className="text-primary underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link to="/login" className="text-primary underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
