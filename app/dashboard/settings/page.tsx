import { Bell, Shield, User } from "lucide-react";

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <span className="eyebrow">Preferences</span>
        <h1 className="display mt-2 text-2xl sm:text-4xl text-white">Account Settings</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Manage your personal account profile, notifications, and security.
        </p>
      </div>

      <div className="glass-panel divide-y divide-white/10">
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5 text-white font-black text-base">
            <User size={18} className="text-safety" />
            <h2>Profile Information</h2>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-slate-300">
            Aarav Sharma • aarav@example.com • +91 98765 43210
          </p>
          <button className="button button-secondary mt-4 !min-h-[44px] text-xs font-bold">
            Edit Account Profile
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5 text-white font-black text-base">
            <Bell size={18} className="text-safety" />
            <h2>Notifications</h2>
          </div>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3 text-xs sm:text-sm text-slate-200 cursor-pointer min-h-[44px]">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-safety shrink-0" />
              <span>Order dispatch and tracking alerts (SMS & Email)</span>
            </label>
            <label className="flex items-center gap-3 text-xs sm:text-sm text-slate-200 cursor-pointer min-h-[44px]">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-safety shrink-0" />
              <span>Replacement review & shipment status updates</span>
            </label>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5 text-rescue font-black text-base">
            <Shield size={18} />
            <h2>Data & Security</h2>
          </div>
          <p className="mt-2 text-xs text-slate-400 leading-5">
            You can request your data export or permanent account removal. Printed offline QR codes will continue to function on vehicles regardless.
          </p>
          <button className="button button-secondary mt-4 !min-h-[44px] text-xs font-bold text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-500/40">
            Request Account Deletion
          </button>
        </div>
      </div>
    </div>
  );
}
