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

const SYSTEM_PROMPT = `You are a code analysis assistant. Answer questions about a codebase using ONLY the provided code context. Rules:
- Only reference files and code present in the provided context
- Include file paths and line numbers when citing specific code
- Format your answer in Markdown with code blocks where appropriate
- If the context does not contain enough information, say so clearly
- Be concise but thorough`;

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
