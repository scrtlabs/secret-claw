interface InfoRow {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}

interface BasicInfoCardProps {
  title?: string;
  rows: InfoRow[];
  className?: string;
}

export function BasicInfoCard({ title, rows, className }: BasicInfoCardProps) {
  return (
    <div
      className={`rounded-[14px] border p-5 ${className || ""}`}
      style={{ background: "linear-gradient(180deg, #1a1613, #141110)", borderColor: "var(--bronze)" }}
    >
      {title && (
        <h3
          className="mb-4 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
        >
          {title}
        </h3>
      )}
      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1">
            <dt
              className="text-[10px] uppercase tracking-widest"
              style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
            >
              {row.label}
            </dt>
            <dd
              className={`break-all text-sm ${row.mono ? "font-mono" : ""}`}
              style={{ color: "var(--cast)" }}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
