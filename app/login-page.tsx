"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, identifier, password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to continue.");
      window.location.replace("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to continue.");
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-mark" aria-hidden="true">
          <LockKeyhole size={24} />
        </div>
        <h1 id="login-title">Hawkes Health Helper</h1>
        <p className="login-subtitle">Calories and macros, kept simple.</p>

        <div className="login-switch" role="group" aria-label="Account action">
          <button type="button" aria-pressed={mode === "sign_in"} onClick={() => { setMode("sign_in"); setError(""); }}>Sign in</button>
          <button type="button" aria-pressed={mode === "sign_up"} onClick={() => { setMode("sign_up"); setError(""); }}>Create account</button>
        </div>

        <form className="login-form" onSubmit={submit}>
          <label>
            Email
            <input
              autoComplete="username"
              inputMode="email"
              placeholder="you@example.com"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <span className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "sign_up" ? "new-password" : "current-password"}
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {mode === "sign_up" && <p className="login-hint">Use at least 8 characters. No verification email required.</p>}
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="primary full login-submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "sign_up" ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="login-privacy">Your diary stays private to your account.</p>
      </section>
    </main>
  );
}
