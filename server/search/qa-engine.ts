import type { QAEngine, QAOptions, QAResponse, Citation } from './types';
import { DEFAULT_MIN_SCORE } from './constants';
import { getSearchEngine } from './search-engine';
import { getAIProvider } from '../ai/provider';

const QA_TOP_K = 5;
const NOT_AVAILABLE_MESSAGE =
  'I could not find relevant information in the indexed codebase to answer this question. Try indexing the repository first or rephrasing your question.';

export function createQAEngine(): QAEngine {
  const searchEngine = getSearchEngine();

  return {
    async ask(options: QAOptions): Promise<QAResponse> {
      const { question, owner, repo, commitSha, apiKey } = options;

      // Retrieve top 5 chunks via semantic search
      let searchResponse;
      try {
        searchResponse = await searchEngine.search({
          query: question,
          owner,
          repo,
          commitSha,
          topK: QA_TOP_K,
          minScore: DEFAULT_MIN_SCORE,
        });
      } catch {
        // If search fails (no index, etc.) return not-available
        return { answer: NOT_AVAILABLE_MESSAGE, citations: [], cached: false };
      }

      const relevantResults = searchResponse.results.filter(
        (r) => r.score >= DEFAULT_MIN_SCORE,
      );

      if (relevantResults.length < 1) {
        return { answer: NOT_AVAILABLE_MESSAGE, citations: [], cached: searchResponse.cached };
      }

      // Build context from retrieved chunks
      const contextParts = relevantResults.map((r, i) => {
        const header = `--- Source ${i + 1}: ${r.chunk.filePath} (lines ${r.chunk.startLine}-${r.chunk.endLine}) ---`;
        return `${header}\n\`\`\`${r.chunk.language}\n${r.chunk.content}\n\`\`\``;
      });

      const prompt = buildQAPrompt(question, contextParts.join('\n\n'));

      // Generate answer using the configured AI provider
      const aiProvider = await getAIProvider(apiKey);
      const answer = await aiProvider.complete([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ]);

      // Extract citations from the relevant results
      const citations: Citation[] = relevantResults.map((r) => ({
        filePath: r.chunk.filePath,
        startLine: r.chunk.startLine,
        endLine: r.chunk.endLine,
      }));

      return {
        answer,
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
