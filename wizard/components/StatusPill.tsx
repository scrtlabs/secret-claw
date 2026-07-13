export type StatusKind =
  | "idle"
  | "validating"
  | "valid"
  | "invalid"
  | "submitted"
  | "provisioning"
  | "ready"
  | "failed";

interface StatusPillProps {
  kind: StatusKind;
  label?: string;
  className?: string;
}

const PRESET: Record<StatusKind, { dot: string; bg: string; text: string; label: string; pulse?: boolean }> = {
  idle:         { dot: "var(--cast-dimmer)", bg: "rgba(58,46,38,0.4)",   text: "var(--cast-dim)",   label: "Idle" },
  validating:   { dot: "var(--ember2)",      bg: "rgba(255,176,32,0.1)", text: "var(--ember2)",     label: "Validating…", pulse: true },
  valid:        { dot: "var(--verify)",      bg: "rgba(0,224,138,0.1)",  text: "var(--verify)",     label: "Valid" },
  invalid:      { dot: "#ef4444",            bg: "rgba(239,68,68,0.1)",  text: "#ef4444",           label: "Invalid" },
  submitted:    { dot: "var(--ember2)",      bg: "rgba(255,176,32,0.1)", text: "var(--ember2)",     label: "Submitted" },
  provisioning: { dot: "var(--molten)",      bg: "rgba(255,122,24,0.1)", text: "var(--molten)",     label: "Provisioning", pulse: true },
  ready:        { dot: "var(--verify)",      bg: "rgba(0,224,138,0.1)",  text: "var(--verify)",     label: "Running" },
  failed:       { dot: "#ef4444",            bg: "rgba(239,68,68,0.1)",  text: "#ef4444",           label: "Failed" },
};

export function StatusPill({ kind, label, className }: StatusPillProps) {
  const p = PRESET[kind];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium font-mono tracking-wide ${className || ""}`}
      style={{ background: p.bg, color: p.text }}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${p.pulse ? "animate-pulse" : ""}`}
        style={{ background: p.dot }}
      />
      {label || p.label}
    </span>
  );
}
