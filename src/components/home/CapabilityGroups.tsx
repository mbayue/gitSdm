import { GitCompareArrows, Network, Search, Sparkles } from "lucide-react";

const groups = [
  {
    icon: Network,
    title: "Follow every connection.",
    description:
      "Explore files, imports, and packages in an interactive dependency graph. Find the entry points and see what depends on what.",
    tag: "MAP & EXPLORE",
  },
  {
    icon: Sparkles,
    title: "Get your bearings faster.",
    description:
      "Ask AI to explain a module, sketch the architecture, or suggest a reading path through an unfamiliar repository.",
    tag: "UNDERSTAND",
  },
  {
    icon: Search,
    title: "Search for the idea.",
    description:
      "Find code by what it does. Ask questions in plain language and follow source citations back to the implementation.",
    tag: "SEARCH & ASK",
  },
  {
    icon: GitCompareArrows,
    title: "See what changed.",
    description:
      "Compare branches, inspect commit history, and understand how the structure of a project evolves over time.",
    tag: "COMPARE",
  },
];

export function CapabilityGroups() {
  return (
    <section id="features" className="home-container home-section scroll-mt-20">
      <div className="section-heading">
        <div>
          <p className="eyebrow mb-3">Built for the curious</p>
          <h2>
            Less searching.
            <br />
            More understanding.
          </h2>
        </div>
        <p>
          From your first look at a repository
          <br className="hidden sm:block" /> to your next architectural
          decision.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <article key={group.title} className="feature-card">
            <div className="mb-8 flex items-center justify-between">
              <group.icon className="h-6 w-6 text-accent" />
              <span className="font-mono text-xs tracking-wider text-muted-foreground">
                {group.tag}
              </span>
            </div>
            <h3 className="mb-3 text-xl font-medium tracking-tight">
              {group.title}
            </h3>
            <p className="max-w-md text-base leading-7 text-muted-foreground">
              {group.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
