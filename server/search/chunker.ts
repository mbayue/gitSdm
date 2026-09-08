import type { Chunk, Chunker } from './types';
import { AppError } from '../utils/errors';
import { MAX_CHUNK_TOKENS, AST_SUPPORTED_LANGUAGES } from './constants';

const MAX_CHUNK_CHARS = MAX_CHUNK_TOKENS * 4; // ~4 chars per token

export function createChunker(): Chunker {
  return {
    chunkFile(content, filePath, language, budget): Chunk[] {
      if (!content || content.trim().length === 0) return [];
      const chunks: Chunk[] = [];
      let bytes = 0;
      const emit = (chunk: RawChunk) => {
        const nextBytes = bytes + chunk.content.length * 2 + (budget?.bytesPerChunk ?? 512);
        if (budget && (chunks.length >= budget.maxChunks || nextBytes > budget.maxBytes)) {
          throw new AppError(413, 'Repository exceeds the search chunk or memory limit.', 'INDEX_TOO_LARGE');
        }
        bytes = nextBytes;
        chunks.push({ ...chunk, chunkIndex: chunks.length, language, filePath });
      };
      if (AST_SUPPORTED_LANGUAGES.has(language)) astAwareChunk(content, language, emit);
      else slidingWindowChunk(content, emit);
      return chunks;
    },
  };
}

// ── Sliding Window ─────────────────────────────────────────────────────

interface RawChunk {
  content: string;
  startLine: number;
  endLine: number;
}

function slidingWindowChunk(content: string, emit: (chunk: RawChunk) => void): void {
  const lines = content.split('\n');
  let current = '';
  let startLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const test = current ? current + '\n' + line : line;

    if (test.length > MAX_CHUNK_CHARS && current.length > 0) {
      // Try to break at blank line boundary
      const breakAt = findLastBlankLineBreak(current);
      if (breakAt > 0) {
        const before = current.slice(0, breakAt);
        const after = current.slice(breakAt + 1);
        const beforeLines = before.split('\n');
        emit({
          content: before,
          startLine: startLine,
          endLine: startLine + beforeLines.length - 1,
        });
        current = after + '\n' + line;
        startLine = startLine + beforeLines.length;
      } else {
        // Hard split
        const currentLines = current.split('\n');
        emit({
          content: current,
          startLine: startLine,
          endLine: startLine + currentLines.length - 1,
        });
        current = line;
        startLine = startLine + currentLines.length;
      }
    } else {
      current = test;
    }
  }

  if (current.length > 0) {
    const currentLines = current.split('\n');
    emit({
      content: current,
      startLine,
      endLine: startLine + currentLines.length - 1,
    });
  }
}

function findLastBlankLineBreak(text: string): number {
  // Find last blank line (line with only whitespace) in the text
  const lines = text.split('\n');
  let lastBlank = -1;
  let charPos = 0;

  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].trim() === '') {
      lastBlank = charPos + lines[i].length;
    }
    charPos += lines[i].length + 1; // +1 for \n
  }
  return lastBlank;
}

// ── AST-Aware Chunking ─────────────────────────────────────────────────

/**
 * Lightweight regex-based chunking that splits at function/class boundaries
 * for TypeScript, JavaScript, and Python files.
 */
function astAwareChunk(content: string, language: string, emit: (chunk: RawChunk) => void): void {
  const lines = content.split('\n');
  const boundaries = findBoundaries(lines, language);

  if (boundaries.length === 0) {
    slidingWindowChunk(content, emit);
    return;
  }

  let prevEnd = 0;

  for (const boundary of boundaries) {
    // If there's content before this boundary, add it
    if (boundary.startLine > prevEnd) {
      const before = lines.slice(prevEnd, boundary.startLine).join('\n');
      if (before.trim().length > 0) {
        addSizedChunks(emit, before, prevEnd + 1);
      }
    }

    // Add the boundary block (function/class)
    const block = lines.slice(boundary.startLine, boundary.endLine + 1).join('\n');
    if (block.length <= MAX_CHUNK_CHARS) {
      emit({
        content: block,
        startLine: boundary.startLine + 1,
        endLine: boundary.endLine + 1,
      });
    } else {
      // Sub-split large blocks
      addSizedChunks(emit, block, boundary.startLine + 1);
    }

    prevEnd = boundary.endLine + 1;
  }

  // Remaining content after last boundary
  if (prevEnd < lines.length) {
    const remaining = lines.slice(prevEnd).join('\n');
    if (remaining.trim().length > 0) {
      addSizedChunks(emit, remaining, prevEnd + 1);
    }
  }
}

interface Boundary {
  startLine: number;
  endLine: number;
}

function findBoundaries(lines: string[], language: string): Boundary[] {
  const boundaries: Boundary[] = [];
  const patterns = getPatterns(language);

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    for (const pattern of patterns) {
      if (pattern.test(trimmed)) {
        const end = findBlockEnd(lines, i, language);
        boundaries.push({ startLine: i, endLine: end });
        i = end; // Nested blocks are already included in the outer block.
        break;
      }
    }
  }

  return boundaries;
}

const JS_PATTERNS: RegExp[] = [
  /^(export\s+)?(async\s+)?function\s+/,
  /^(export\s+)?(default\s+)?class\s+/,
  /^(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s+)?(\([^)]*\)|[a-zA-Z_$]\w*)\s*=>/,
  /^(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s+)?function/,
  /^interface\s+/,
  /^type\s+\w+\s*=/,
  /^enum\s+/,
  /^(export\s+)?abstract\s+class\s+/,
];

const PY_PATTERNS: RegExp[] = [/^(async\s+)?def\s+/, /^class\s+/];

const PATTERN_MAP: Record<string, RegExp[]> = {
  typescript: JS_PATTERNS,
  tsx: JS_PATTERNS,
  javascript: JS_PATTERNS,
  jsx: JS_PATTERNS,
  python: PY_PATTERNS,
};

function getPatterns(language: string): RegExp[] {
  return PATTERN_MAP[language] ?? [];
}

function findBlockEnd(lines: string[], startLine: number, language: string): number {
  if (language === 'python') {
    return findPythonBlockEnd(lines, startLine);
  }
  return findBraceBlockEnd(lines, startLine);
}

function findBraceBlockEnd(lines: string[], startLine: number): number {
  let depth = 0;
  let foundOpen = false;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === '{') {
        depth++;
        foundOpen = true;
      } else if (ch === '}') {
        depth--;
        if (foundOpen && depth === 0) return i;
      }
    }
  }
  return Math.min(startLine + 50, lines.length - 1);
}

function findPythonBlockEnd(lines: string[], startLine: number): number {
  // Find the indentation of the def/class line
  const baseIndent = lines[startLine].search(/\S/);
  let end = startLine;

  for (let i = startLine + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      end = i;
      continue;
    }
    const indent = line.search(/\S/);
    if (indent <= baseIndent) break;
    end = i;
  }
  return end;
}

function addSizedChunks(emit: (chunk: RawChunk) => void, content: string, baseLine: number): void {
  const lines = content.split('\n');
  let current = '';
  let startLine = baseLine;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const test = current ? current + '\n' + line : line;

    if (test.length > MAX_CHUNK_CHARS && current.length > 0) {
      const currentLines = current.split('\n');
      emit({
        content: current,
        startLine,
        endLine: startLine + currentLines.length - 1,
      });
      current = line;
      startLine = startLine + currentLines.length;
    } else {
      current = test;
    }
  }

  if (current.length > 0) {
    const currentLines = current.split('\n');
    emit({
      content: current,
      startLine,
      endLine: startLine + currentLines.length - 1,
    });
  }
}
