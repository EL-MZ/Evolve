"use client";

import { AuthGate } from "@/components/auth-gate";
import { Dashboard } from "@/components/dashboard";

export default function Home() {
  return <AuthGate>{(user, signOut) => <Dashboard user={user} onSignOut={signOut} />}</AuthGate>;
}
