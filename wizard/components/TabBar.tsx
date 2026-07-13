interface Tab {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function TabBar({ tabs, active, onChange, className }: TabBarProps) {
  return (
    <div className={`border-b ${className || ""}`} style={{ borderColor: "var(--bronze)" }}>
      <div className="-mb-px flex gap-6">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className="relative px-1 pb-3 text-sm font-medium transition-colors"
              style={{ color: isActive ? "var(--cast)" : "var(--cast-dimmer)" }}
            >
              {tab.label}
              {isActive && (
                <span
                  className="absolute inset-x-0 bottom-0 h-0.5"
                  style={{ background: "linear-gradient(90deg, var(--ember1), var(--ember2))" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
