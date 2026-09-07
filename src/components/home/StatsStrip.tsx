const capabilities = [
  "Dependency maps",
  "AI architecture insights",
  "Semantic code search",
  "Branch comparisons",
];

export function StatsStrip() {
  return (
    <div className="border-y border-border bg-card/40">
      <div className="home-container grid grid-cols-2 gap-5 py-6 md:grid-cols-4">
        {capabilities.map((label, index) => (
          <div
            key={label}
            className="flex items-center gap-3 text-xs text-muted-foreground"
          >
            <span className="font-mono text-accent">0{index + 1}</span>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
