export function AdminListPage({
  eyebrow,
  title,
  empty,
  rows,
}: {
  eyebrow: string;
  title: string;
  empty: string;
  rows: Array<Record<string, string>>;
}) {
  const keys = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <div className="mx-auto max-w-7xl">
      <span className="text-xs font-black uppercase tracking-[.16em] text-[#1264d8]">
        {eyebrow}
      </span>
      <h1 className="mt-3 text-3xl font-black sm:text-4xl">{title}</h1>

      {rows.length === 0 ? (
        <div className="mt-7 rounded-xl border border-[#dce2ea] bg-white p-12 text-center">
          <h2 className="font-black">{empty}</h2>
          <p className="mt-2 text-sm text-[#607086]">
            New items will appear here when returned by the API.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card List View (< 640px) */}
          <div className="mt-6 space-y-3 sm:hidden">
            {rows.map((r, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#dce2ea] bg-white p-4 shadow-sm"
              >
                <div className="space-y-2">
                  {keys.map((k) => (
                    <div
                      key={k}
                      className="flex items-start justify-between gap-3 text-xs"
                    >
                      <span className="font-bold uppercase tracking-wider text-[#607086]">
                        {k}
                      </span>
                      <span className="font-medium text-right text-slate-100">
                        {r[k]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop & Tablet Table (>= 640px) */}
          <div className="mt-7 hidden overflow-x-auto rounded-xl border border-[#dce2ea] bg-white table-wrapper sm:block">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-[#f2f5f9]">
                <tr>
                  {keys.map((k) => (
                    <th
                      className="px-5 py-4 text-[10px] uppercase tracking-wider text-[#607086]"
                      key={k}
                    >
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr className="border-t border-[#dce2ea]" key={i}>
                    {keys.map((k) => (
                      <td className="px-5 py-5" key={k}>
                        {r[k]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
