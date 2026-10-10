import Link from "next/link";
import { ScanLine } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
export default function NotFound(){return <main className="grid min-h-dvh place-items-center bg-[#07182d] p-4 sm:p-6 text-white"><div className="max-w-xl text-center"><BrandLogo inverse/><ScanLine className="mx-auto mt-14 text-blue-300" size={54}/><span className="display mt-6 block text-6xl sm:text-8xl text-rescue">404</span><h1 className="mt-4 text-3xl font-black">This route is not one scan away.</h1><p className="mt-4 text-white/60">The page may have moved, but your journey can continue safely from the homepage.</p><Link href="/" className="button button-primary mt-8">Return home</Link></div></main>}
