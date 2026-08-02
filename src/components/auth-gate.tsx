"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Check, LockKeyhole, Sparkles } from "lucide-react";
import { getSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";
import type { WorkspaceUser } from "@/lib/types";

const PREVIEW_SESSION_KEY = "evolve-preview-session";

function sessionUser(id: string, email: string | undefined, metadata: Record<string, unknown> | undefined): WorkspaceUser {
  const displayName = typeof metadata?.display_name === "string" ? metadata.display_name : (email?.split("@")[0] || "Explorer");
  return { id, email: email ?? "", displayName, mode: "supabase" };
}

export function AuthGate({ children }: { children: (user: WorkspaceUser, signOut: () => Promise<void>) => React.ReactNode }) {
  const configured = hasSupabaseConfig();
  const [user, setUser] = useState<WorkspaceUser | null>(() => {
    if (configured || typeof window === "undefined") return null;
    const saved = window.localStorage.getItem(PREVIEW_SESSION_KEY);
    if (!saved) return null;
    try { return JSON.parse(saved) as WorkspaceUser; }
    catch { window.localStorage.removeItem(PREVIEW_SESSION_KEY); return null; }
  });
  const [loading, setLoading] = useState(configured);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const api = getSupabaseClient();
    if (!api) return;

    void api.auth.getSession().then(({ data }) => {
      const active = data.session?.user;
      if (active) setUser(sessionUser(active.id, active.email, active.user_metadata));
      setLoading(false);
    });
    const { data: listener } = api.auth.onAuthStateChange((_event, session) => {
      const active = session?.user;
      setUser(active ? sessionUser(active.id, active.email, active.user_metadata) : null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);
    const api = getSupabaseClient();
    if (!api) {
      const previewUser: WorkspaceUser = {
        id: `preview-${email.trim().toLowerCase() || "guest"}`,
        email: email.trim(),
        displayName: displayName.trim() || email.split("@")[0] || "Explorer",
        mode: "preview",
      };
      window.localStorage.setItem(PREVIEW_SESSION_KEY, JSON.stringify(previewUser));
      setUser(previewUser);
      setSubmitting(false);
      return;
    }

    if (mode === "signup") {
      const { data, error } = await api.auth.signUp({ email, password, options: { data: { display_name: displayName.trim() } } });
      if (error) setMessage(error.message);
      else if (!data.session) setMessage("Check your email to confirm your account, then sign in.");
    } else {
      const { error } = await api.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    }
    setSubmitting(false);
  }

  async function signOut() {
    if (user?.mode === "supabase") await getSupabaseClient()?.auth.signOut();
    window.localStorage.removeItem(PREVIEW_SESSION_KEY);
    setUser(null);
  }

  if (loading) return <div className="auth-loading"><span className="brand-mark"><Sparkles size={19} /></span></div>;
  if (user) return <>{children(user, signOut)}</>;

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="brand auth-brand"><span className="brand-mark"><Sparkles size={19} /></span><span>evolve</span></div>
        <p className="eyebrow">A clearer week starts here</p>
        <h1>Build momentum<br />that feels <em>yours.</em></h1>
        <p>Shape your week around the work, movement, learning and personal goals that matter to you.</p>
        <ul>
          <li><Check size={17} /> Start with a completely clean workspace</li>
          <li><Check size={17} /> Create your own categories and choose their icons</li>
          <li><Check size={17} /> Keep every goal private by default</li>
        </ul>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <span className="auth-lock"><LockKeyhole size={20} /></span>
          <p className="eyebrow">{configured ? "Private account" : "Device-only preview"}</p>
          <h2>{configured ? (mode === "signin" ? "Welcome back" : "Create your space") : "Start with a fresh space"}</h2>
          <p>{configured ? "Your week is waiting for you." : "This preview stays in this browser until Supabase is connected."}</p>
          <form onSubmit={submit}>
            {(mode === "signup" || !configured) && <label>Name<input required value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="How should we greet you?" /></label>}
            <label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
            {configured && <label>Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>}
            {message && <p className="form-message" role="status">{message}</p>}
            <button className="primary-button auth-submit" disabled={submitting} type="submit">
              {submitting ? "One moment…" : configured ? (mode === "signin" ? "Sign in" : "Create account") : "Enter my workspace"}<ArrowRight size={17} />
            </button>
          </form>
          {configured && <button className="auth-switch" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>}
        </div>
      </section>
    </main>
  );
}
