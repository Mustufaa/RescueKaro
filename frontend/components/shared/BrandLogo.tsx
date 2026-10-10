import Image from "next/image";

export function BrandLogo({ variant = "emblem" }: { variant?: "emblem" | "full"; inverse?: boolean }) {
  if (variant === "full") {
    return (
      <Image
        src="/brand/logo/rescuekaro-full.png"
        alt="RescueKaro - Scan to Safe Life"
        width={240}
        height={160}
        className="h-auto w-[150px] object-contain sm:w-[190px] md:w-[210px]"
        priority
      />
    );
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-2 sm:gap-3">
      <Image
        src="/brand/logo/rescuekaro-emblem.png"
        alt="RescueKaro"
        width={48}
        height={44}
        className="h-10 w-11 shrink-0 object-contain sm:h-11 sm:w-12"
        priority
      />
      <span className="inline truncate text-sm font-black tracking-normal text-white sm:text-base md:text-lg">
        Rescue<span className="text-rescue">Karo</span>
      </span>
    </span>
  );
}
