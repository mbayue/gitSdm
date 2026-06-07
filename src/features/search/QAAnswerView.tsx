import { BookOpen, ExternalLink } from 'lucide-react';
import { useSearchStore } from './search-store';

interface QAAnswerViewProps {
  onSelectFile?: (filePath: string, startLine: number) => void;
}

export function QAAnswerView({ onSelectFile }: QAAnswerViewProps) {
  const { answer } = useSearchStore();

  if (!answer) return null;

  return (
    <div className="space-y-3">
      {/* Answer content */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-400">
          <BookOpen className="h-3.5 w-3.5" />
          AI Answer
        </div>
        <div
          className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed text-zinc-300
                     prose-headings:text-zinc-100 prose-code:rounded prose-code:bg-white/[0.06]
                     prose-code:px-1 prose-code:py-0.5 prose-code:text-violet-300
                     prose-pre:rounded-lg prose-pre:bg-black/40 prose-pre:p-3"
        >
          <MarkdownContent content={answer.answer} />
        </div>
      </div>

      {/* Citations */}
      {answer.citations.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Sources
          </div>
          <div className="flex flex-wrap gap-1.5">
            {answer.citations.map((c, i) => (
              <button
                key={`${c.filePath}-${c.startLine}-${i}`}
                onClick={() => onSelectFile?.(c.filePath, c.startLine)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[10px] text-zinc-400 transition-all duration-200 hover:border-violet-500/20 hover:text-zinc-200"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                <span className="max-w-[200px] truncate">{c.filePath}</span>
                <span className="text-zinc-600">:{c.startLine}-{c.endLine}</span>
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
            <pre key={i} className="my-2 overflow-x-auto rounded-lg bg-black/40 p-3">
              <code className="text-xs font-mono text-zinc-300">{code}</code>
              {lang && (
                <div className="mt-1 text-right text-[9px] text-zinc-600">{lang}</div>
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

/** Very basic inline formatting: **bold**, `code` */
function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-zinc-100">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="rounded bg-white/[0.06] px-1 py-0.5 text-xs text-violet-300">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
