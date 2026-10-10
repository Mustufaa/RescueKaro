import type { Metadata } from "next";
import { OrderFlow } from "@/components/order/OrderFlow";
import {AuthGate} from "@/components/auth/AuthGate";
export const metadata:Metadata={title:"Order RescueKaro",description:"Personalise and order your RescueKaro emergency QR Starter Kit."};
export default function Page(){return <AuthGate><OrderFlow/></AuthGate>}
