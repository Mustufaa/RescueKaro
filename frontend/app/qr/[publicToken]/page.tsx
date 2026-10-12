"use client";

import { useParams } from "next/navigation";
import PublicQrPage from "@/components/qr/PublicQrPage";

export default function Page() {
  const params = useParams<{ publicToken: string }>();
  return <PublicQrPage token={params.publicToken} />;
}