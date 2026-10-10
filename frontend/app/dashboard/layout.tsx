import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {AuthGate} from "@/components/auth/AuthGate";
export default function Layout({children}:{children:React.ReactNode}){return <AuthGate><DashboardShell>{children}</DashboardShell></AuthGate>}
