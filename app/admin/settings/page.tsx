export default function Page() {
  return (
    <div className="mx-auto max-w-4xl">
      <span className="text-xs font-black uppercase tracking-[.16em] text-safety">
        Configuration
      </span>
      <h1 className="mt-2 text-3xl font-black sm:text-4xl">Admin settings</h1>

      <div className="mt-7 space-y-5">
        <section className="surface p-4 sm:p-6">
          <h2 className="font-black text-white">Pricing</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="label">
              Starter Kit price (₹)
              <input
                className="field mt-2"
                defaultValue="99"
                inputMode="numeric"
              />
            </label>
            <label className="label">
              Replacement target price (₹)
              <input
                className="field mt-2"
                defaultValue="50"
                inputMode="numeric"
              />
            </label>
          </div>
          <p className="mt-3 text-xs text-muted">
            Shipping is calculated separately by the shipping service.
          </p>
        </section>

        <section className="surface p-4 sm:p-6">
          <h2 className="font-black text-white">Replacement rules</h2>
          <label className="mt-4 flex min-h-[44px] cursor-pointer items-center gap-3 text-xs sm:text-sm text-slate-200 touch-manipulation">
            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded border-line bg-canvas text-safety focus:ring-safety"
            />
            <span>Allow one eligible free replacement per order</span>
          </label>
        </section>

        <button className="button button-primary min-h-[44px] touch-manipulation">
          Save configuration
        </button>
      </div>
    </div>
  );
}
