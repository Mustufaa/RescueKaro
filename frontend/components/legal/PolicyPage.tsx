import { PublicShell } from "@/components/layout/PublicShell";

export function PolicyPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: Array<[string, string]>;
}) {
  return (
    <PublicShell>
      <section className="section border-b border-line bg-surface">
        <div className="container-page pt-4 sm:pt-10">
          <span className="eyebrow">Legal & support</span>
          <h1 className="display mt-4 text-3xl sm:text-5xl lg:text-7xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm sm:text-base leading-7 text-muted">{intro}</p>
          <p className="mt-4 text-xs font-bold text-rescue">
            Draft placeholder • Requires legal review before production launch
          </p>
        </div>
      </section>
      <article className="container-page max-w-3xl py-10 sm:py-16">
        {sections.map(([h, p]) => (
          <section className="mb-8 sm:mb-10" key={h}>
            <h2 className="text-xl sm:text-2xl font-black">{h}</h2>
            <p className="mt-2 text-sm sm:text-base leading-7 sm:leading-8 text-muted">{p}</p>
          </section>
        ))}
      </article>
    </PublicShell>
  );
}
