import { useEffect, useState } from 'react';
import { useMermaid } from '@/features/ai/useAiTasks';
import type { RepoAnalysis } from '@/types';
import { generateProgrammaticMermaid } from '../mermaid-generator';
import mermaid from '../mermaid-config';
import { stripMermaidFences } from '../stripMermaidFences';

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
      if (!data?.diagram) {
        setSvg('');
        setRenderError(null);
        return;
      }
      code = stripMermaidFences(data.diagram);
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
              .replace(/height="[^"]+"/, 'height="100%"')
              .replace(/style="[^"]*"/, '')
              .replace(/<svg/, '<svg style="max-width: 100%; max-height: 100%;"');
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
