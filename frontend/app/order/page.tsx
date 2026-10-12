import { Suspense } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { QrWizard } from "@/components/qr/QrWizard";

export default function Page() {
  return <AuthGate><DashboardShell><Suspense fallback={<p className="text-slate-300">Loading QR setup...</p>}><QrWizard /></Suspense></DashboardShell></AuthGate>;
}
