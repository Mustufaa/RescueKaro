import { EmergencyProfileForm } from "@/components/dashboard/EmergencyProfileForm";
import Link from "next/link";
export default function Page(){return <div className="mx-auto max-w-5xl"><EmergencyProfileForm/><Link href="/dashboard/rescuekaro" className="button button-secondary mt-6">Generate or view digital QR</Link></div>}
