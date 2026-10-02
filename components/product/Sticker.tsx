import { QRMark } from "./QRMark";

export function Sticker({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const width = size === "lg" ? "w-full max-w-64" : size === "sm" ? "w-full max-w-32" : "w-full max-w-48";

  return (
    <div className={`relative mx-auto overflow-hidden rounded-[18px] border-[5px] border-white bg-white p-3 shadow-sticker ring-4 ring-rescue ${width}`}>
      <div className="mb-2 flex items-center justify-between gap-2 text-[8px] font-black tracking-wider text-navy">
        <span>RESCUE<span className="text-rescue">KARO</span></span>
        <span className="text-right">EMERGENCY QR</span>
      </div>
      <QRMark className="w-full" />
      <p className="mt-2 text-center text-[9px] font-black tracking-[.14em] text-navy">SCAN IN EMERGENCY</p>
    </div>
  );
}
