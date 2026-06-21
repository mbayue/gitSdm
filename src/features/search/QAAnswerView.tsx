import { BookOpen, ExternalLink } from 'lucide-react';
import { useSearchStore } from './searchStore';

interface QAAnswerViewProps {
  onSelectFile?: (filePath: string, startLine: number, action?: 'open' | 'inspect') => void;
}

export function QAAnswerView({ onSelectFile }: QAAnswerViewProps) {
  const { answer } = useSearchStore();

  if (!answer) return null;

  return (
    <div className="space-y-4">
      {/* Answer content */}
      <div className="rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-[#8b949e] uppercase tracking-widest">
          <BookOpen className="h-3.5 w-3.5" />
          Codebase Answer
        </div>
        <div
          className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed text-[#e6edf3]
                     prose-headings:text-[#e6edf3] prose-headings:font-semibold prose-headings:border-b prose-headings:border-[rgba(240,246,252,0.1)] prose-headings:pb-1 prose-headings:mb-3 prose-headings:mt-6 first:prose-headings:mt-0
                     prose-code:rounded-sm prose-code:bg-[rgba(240,246,252,0.1)] prose-code:border prose-code:border-[rgba(240,246,252,0.1)]
                     prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[#e6edf3] prose-code:font-mono prose-code:text-xs
                     prose-pre:rounded-md prose-pre:bg-[#161b22] prose-pre:border prose-pre:border-[rgba(240,246,252,0.1)] prose-pre:p-3
                     prose-p:mb-4 prose-ul:mb-4 prose-ol:mb-4 prose-li:mb-1"
        >
          <MarkdownContent content={answer.answer} />
        </div>
      </div>

      {/* Citations */}
      {answer.citations.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#8b949e]">
            Sources
          </div>
          <div className="flex flex-wrap gap-2">
            {answer.citations.map((c, i) => (
              <button
                key={`${c.filePath}-${c.startLine}-${i}`}
                onClick={() => onSelectFile?.(c.filePath, c.startLine, 'open')}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-[rgba(240,246,252,0.1)] bg-[#161b22] px-2 py-1 text-[10px] text-[#e6edf3] transition-all duration-200 hover:border-[#58a6ff] hover:bg-[#58a6ff]/10 hover:text-[#58a6ff]"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="max-w-[200px] truncate font-mono">{c.filePath}</span>
                <span className="text-[#8b949e] font-mono">:{c.startLine}-{c.endLine}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Simple markdown renderer – handles code blocks, bold, inline code, and paragraphs. */
function MarkdownContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
          const lang = match?.[1] ?? '';
          const code = match?.[2] ?? part.slice(3, -3);
          return (
            <pre key={i} className="my-3 overflow-x-auto rounded-md bg-[#161b22] border border-[rgba(240,246,252,0.1)] p-3 shadow-sm">
              <code className="text-[11px] font-mono text-[#e6edf3]">{code}</code>
              {lang && (
                <div className="mt-2 text-right text-[9px] text-[#8b949e] uppercase font-semibold">{lang}</div>
              )}
            </pre>
          );
        }

        // Basic inline formatting
        const lines = part.split('\n').filter(Boolean);
        return (
          <div key={i} className="space-y-1">
            {lines.map((line, j) => {
              // Headers
              if (line.startsWith('### '))
                return <h3 key={j} className="mt-2 text-sm font-bold text-zinc-100">{formatInline(line.slice(4))}</h3>;
              if (line.startsWith('## '))
                return <h2 key={j} className="mt-2 text-base font-bold text-zinc-100">{formatInline(line.slice(3))}</h2>;
              if (line.startsWith('# '))
                return <h1 key={j} className="mt-2 text-lg font-bold text-zinc-100">{formatInline(line.slice(2))}</h1>;
              // List items
              if (line.match(/^[-*]\s/))
                return <li key={j} className="ml-4 list-disc text-zinc-300">{formatInline(line.slice(2))}</li>;
              if (line.match(/^\d+\.\s/))
                return <li key={j} className="ml-4 list-decimal text-zinc-300">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>;

              return <p key={j} className="text-zinc-300">{formatInline(line)}</p>;
            })}
          </div>
        );
      })}
    </>
  );
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-[#e6edf3]">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="rounded-sm bg-[rgba(240,246,252,0.1)] border border-[rgba(240,246,252,0.1)] px-1.5 py-0.5 text-[11px] font-mono text-[#e6edf3]">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
