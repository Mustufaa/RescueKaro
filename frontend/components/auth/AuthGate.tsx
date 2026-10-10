"use client";
import {useEffect,useState} from "react";
import {usePathname,useRouter} from "next/navigation";
import {authService} from "@/services/auth.service";
import {apiRequest,ApiError} from "@/services/api";

export function AuthGate({children}:{children:React.ReactNode}){
 const router=useRouter();const path=usePathname();const [ready,setReady]=useState(false);const [error,setError]=useState("");
 useEffect(()=>{let active=true;async function check(){try{await authService.session();await apiRequest("/auth/csrf");if(active)setReady(true)}catch(e){if(!active)return;if(e instanceof ApiError&&(e.status===401||e.status===403)){router.replace(`/${path.startsWith("/order")?"register":"login"}?next=${encodeURIComponent(path)}`);return}setError(e instanceof Error?e.message:"Could not load your account.")}}void check();return()=>{active=false}},[router,path]);
 if(error)return <main className="grid min-h-dvh place-items-center bg-[#050d1a] p-6 text-white"><div className="glass-panel max-w-lg p-6"><p role="alert">{error}</p><button className="button button-primary mt-4" onClick={()=>location.reload()}>Retry</button></div></main>;
 if(!ready)return <main className="grid min-h-dvh place-items-center bg-[#050d1a] text-slate-300">Loading your account...</main>;
 return <>{children}</>;
}
