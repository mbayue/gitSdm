const steps = [
  {
    title: "Bring a repository",
    description:
      "Paste a GitHub URL or choose an example. Start with a public repository, or add a token for private access.",
  },
  {
    title: "Connect the dots",
    description:
      "gitSdm reads the file tree, parses dependencies, and builds a map of the relationships in your code.",
  },
  {
    title: "Find your way in",
    description:
      "Explore the graph, inspect a file, or ask a question. Follow the connections wherever they take you.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="home-container home-section scroll-mt-20 border-t border-border"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow mb-3">A shorter path to context</p>
          <h2>One URL. A whole new view.</h2>
        </div>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        {steps.map((step, index) => (
          <article key={step.title}>
            <div className="mb-6 flex items-center gap-4">
              <span className="font-mono text-sm text-accent">
                0{index + 1}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <h3 className="mb-3 text-lg font-medium">{step.title}</h3>
            <p className="text-base leading-7 text-muted-foreground">
              {step.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
