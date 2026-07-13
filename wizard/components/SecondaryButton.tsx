export function SecondaryButton({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`}
      style={{
        borderColor: "var(--bronze)",
        background: "linear-gradient(180deg, #1a1613, #141110)",
        color: "var(--cast-dim)",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--cast)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--cast-dim)"; }}
      {...rest}
    >
      {children}
    </button>
  );
}
