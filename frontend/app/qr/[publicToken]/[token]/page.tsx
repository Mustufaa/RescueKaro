"use client";

import { useParams } from "next/navigation";
import PublicQrPage from "@/components/qr/PublicQrPage";

export default function Page() {
  const params = useParams<{ publicToken: string; token: string }>();
  return <PublicQrPage serial={params.publicToken} token={params.token} />;
}
