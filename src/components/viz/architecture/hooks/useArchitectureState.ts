import { useEffect, useState } from 'react';
import { useMermaid } from '@/features/ai/useAiTasks';
import type { RepoAnalysis } from '@/types';
import { generateProgrammaticMermaid } from '../mermaid-generator';
import mermaid from '../mermaid-config';

export function useArchitectureState(
  analysis: RepoAnalysis,
  owner: string,
  repo: string,
  resetView: () => void
) {
  const { mutate: generate, data, isPending, isError, error } = useMermaid();
  const [svg, setSvg] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [mode, setMode] = useState<'code' | 'ai'>('code');

  useEffect(() => {
    if (mode === 'ai') {
      generate({ owner, repo });
    }
  }, [mode, owner, repo, generate]);

  useEffect(() => {
    let code = '';
    if (mode === 'code') {
      if (!analysis) return;
      code = generateProgrammaticMermaid(analysis);
    } else {
      if (!data?.diagram) return;
      code = data.diagram.trim();
      if (code.startsWith('```mermaid')) {
        code = code.slice(10);
      } else if (code.startsWith('```')) {
        code = code.slice(3);
      }
      if (code.endsWith('```')) {
        code = code.slice(0, -3);
      }
      code = code.trim();
    }

    if (!code) return;

    let active = true;
    setRenderError(null);
    setSvg('');
    resetView();

    const id = `mermaid-view-svg-${Math.floor(Math.random() * 1000000)}`;

    mermaid.render(id, code)
      .then(({ svg: renderedSvg }) => {
        if (active) {
          let styled = renderedSvg;
          if (renderedSvg.includes('width=')) {
            styled = renderedSvg
              .replace(/width="[^"]+"/, 'width="100%"')
              .replace(/height="[^"]+"/, 'style="max-height: 100%; max-width: 100%; width: 100%; height: auto;"');
          }
          setSvg(styled);
        }
      })
      .catch((err) => {
        console.error('Failed to parse mermaid syntax:', err);
        if (active) {
          setRenderError('Failed to layout flowchart. This can happen with complex circular dependencies.');
        }
        const badEl = document.getElementById(id);
        if (badEl) badEl.remove();
        const badBind = document.getElementById(`d${id}`);
        if (badBind) badBind.remove();
      });

    return () => {
      active = false;
    };
  }, [mode, data, analysis]);

  return {
    generate,
    data,
    isPending,
    isError,
    error,
    svg,
    renderError,
    mode,
    setMode,
  };
}
