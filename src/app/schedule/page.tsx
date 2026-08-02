"use client";

import { AuthGate } from "@/components/auth-gate";
import { ScheduleWorkspace } from "@/components/schedule-workspace";

export default function SchedulePage() {
  return <AuthGate>{(user, signOut) => <ScheduleWorkspace user={user} onSignOut={signOut} />}</AuthGate>;
}
