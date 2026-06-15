import type { RepoAnalysis } from '../../src/types';

export { explainRepo, explainArchitecture } from './tasks/explain';
export { suggestFiles, generateOnboarding, explainRepoELI5 } from './tasks/onboarding';
export { generateRefactorSuggestions, generateHealthReport } from './tasks/refactor';
export { generateMermaidDiagram } from './tasks/diagram';
export { generateRepoRoast, generateReadmeEnhancement, generateLearningPath } from './tasks/playground';

export type { RepoAnalysis };
