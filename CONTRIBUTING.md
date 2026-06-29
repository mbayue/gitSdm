# 🤝 Contributing to gitSdm

Thank you for your interest in contributing to **gitSdm**! We welcome contributions of all kinds, including bug fixes, new features, documentation improvements, and UI refinements.

Please review this guide to get started.

---

## 🚀 Quick Setup

### 1. Prerequisites

- **Bun** >= 1.1 (recommended)
- **Node.js** >= 22 (legacy)

### 2. Fork & Clone

1. Fork the [gitSdm repository](https://github.com/mbayue/gitSdm).
2. Clone your fork locally:

   ```bash
   git clone https://github.com/YOUR-USERNAME/gitSdm.git
   cd gitSdm
   ```

### 3. Install Dependencies & Setup Env

```bash
# Install packages
bun install

# Setup environment variables
cp .env.example .env
```

Make sure to add your `GITHUB_TOKEN` and any AI provider API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY`) to the `.env` file for full feature support during development.

---

## 🛠️ Development Workflow

### Starting the Dev Servers

gitSdm runs an Express backend server and a Vite frontend server:

```bash
# Starts both frontend and backend concurrently
bun dev

# Or run them in separate terminals if preferred:
bun run dev:frontend  # Frontend UI on http://localhost:5173
bun run dev:backend   # Express backend on http://localhost:3001
```

### Writing Code

- Follow the existing project structure and modular layout.
- For UI components, use semantic CSS and Tailwind CSS classes consistent with our dark/light theme systems.
- If you modify code structures or add new files, run the graph builder generator to verify AST parser compatibility.

---

## 🧪 Testing & Linting

Before opening a pull request, please make sure your changes pass all tests and linting checks:

```bash
# Run all tests once
bun test

# Run tests in watch mode
bun run test:watch

# Run test coverage
bun run test:coverage

# Run ESLint check
bun run lint
```

---

## 🗺️ Updating the Codebase Graph

This project uses **graphify** to build its interactive directory-topology mapping. If you add new files or modify exports:

```bash
bunx graphify update .
```

---

## 📬 Pull Request Guidelines

1. **Create a Branch**:

   ```bash
   git checkout -b feature/your-awesome-feature
   # or
   git checkout -b bugfix/issue-description
   ```

2. **Commit Messages**: Keep commit messages clear and descriptive (e.g. `feat(ui): center badges in README` or `fix(viz): correct trace highlight state`).
3. **Verify Build**: Ensure `bun run build` runs successfully.
4. **Submit**: Push your branch and open a Pull Request against the `main` branch of the upstream repository.
