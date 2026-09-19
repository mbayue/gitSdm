import type { QAEngine, QAOptions, QAResponse, Citation } from './types';
import type { SearchCoverage } from '../../src/types';
import { DEFAULT_MIN_SCORE } from './constants';
import { getSearchEngine } from './search-engine';
import { getAIProvider } from '../ai/provider';

const QA_TOP_K = 5;
const NOT_AVAILABLE_MESSAGE =
  'I could not find relevant information in the indexed codebase to answer this question. Try indexing the repository first or rephrasing your question.';

// Local copy of the coverage notice formatter: runtime code cannot be shared
// across the server/frontend boundary (only src/types is in both tsconfigs),
// so this intentionally mirrors coverageMessage in src/lib/search-coverage.ts.
function coverageMessage(coverage: SearchCoverage): string {
  if (coverage.kind === 'previous')
    return `Showing results from the previous index (${coverage.commitSha.slice(0, 7)}).`;
  if (coverage.kind === 'partial')
    return `Partial results — ${coverage.indexedFiles} of ${coverage.totalFiles} files indexed.`;
  return 'Showing results from the complete index.';
}

export function createQAEngine(): QAEngine {
  const searchEngine = getSearchEngine();

  return {
    async ask(options: QAOptions): Promise<QAResponse> {
      const { question, owner, repo, commitSha, apiKey } = options;

      // Retrieve top 5 chunks via semantic search
      const searchResponse = await searchEngine.search({
        query: question,
        owner,
        repo,
        commitSha,
        gitHubToken: options.gitHubToken,
        includePaths: options.includePaths,
        excludePaths: options.excludePaths,
        topK: QA_TOP_K,
        minScore: DEFAULT_MIN_SCORE,
      });

      const relevantResults = searchResponse.results.filter((r) => r.score >= DEFAULT_MIN_SCORE);

      if (relevantResults.length < 1) {
        return {
          answer: NOT_AVAILABLE_MESSAGE,
          citations: [],
          cached: searchResponse.cached,
          coverage: searchResponse.coverage,
        };
      }

      // Build context from retrieved chunks
      const contextParts = relevantResults.map((r, i) => {
        const header = `--- Source ${i + 1}: ${r.chunk.filePath} (lines ${r.chunk.startLine}-${r.chunk.endLine}) ---`;
        return `${header}\n\`\`\`${r.chunk.language}\n${r.chunk.content}\n\`\`\``;
      });

      const prompt = buildQAPrompt(question, contextParts.join('\n\n'));

      // Generate answer using the configured AI provider
      const aiProvider = await getAIProvider(apiKey);
      const coverage = searchResponse.coverage;
      const notice = coverage ? coverageMessage(coverage) : '';
      const answer = await aiProvider.complete([
        {
          role: 'system',
          content:
            SYSTEM_PROMPT +
            '\n' +
            notice +
            '\nAnswers cover only indexed files. Never infer repository-wide absence or completeness from the retrieved excerpts.',
        },
        { role: 'user', content: prompt },
      ]);

      // Extract citations from the relevant results
      const citations: Citation[] = relevantResults.map((r) => ({
        filePath: r.chunk.filePath,
        startLine: r.chunk.startLine,
        endLine: r.chunk.endLine,
      }));

      return {
        answer: coverage && coverage.kind !== 'complete' ? notice + '\n\n' + answer : answer,
        coverage,
        citations,
        cached: searchResponse.cached,
      };
    },
  };
}

const SYSTEM_PROMPT = `You are a codebase analysis assistant. Answer questions about the codebase using ONLY the provided code context.

Structure your answer using EXACTLY these Markdown headers:
### Summary
A direct, 1-2 sentence high-level answer.

### How it works
A concise explanation. Use numbered steps for processes. Use short paragraphs.
Visually distinguish code references by using \`inline code\` for variables, functions, or file names.
Do not write giant walls of text. Keep it scannable.

### Related files
A bulleted list of the relevant files discussed.

Rules:
- Only reference files and code present in the context
- If the context lacks sufficient information, state that clearly under Summary and skip the other sections
- Do not add a Sources section (citations are handled by the UI)`;

function buildQAPrompt(question: string, context: string): string {
  return `## Question
${question}

## Code Context
${context}

## Instructions
Answer the question above using ONLY the code context provided. Include citations with file paths and line ranges.`;
}

// ── Singleton ──────────────────────────────────────────────────────────

let globalQA: QAEngine | null = null;

export function getQAEngine(): QAEngine {
  if (!globalQA) {
    globalQA = createQAEngine();
  }
  return globalQA;
}
