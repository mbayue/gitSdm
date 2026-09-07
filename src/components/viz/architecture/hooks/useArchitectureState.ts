import { useEffect, useRef, useState } from 'react';
import { useMermaid } from '@/features/ai/useAiTasks';
import type { RepoAnalysis } from '@/types';
import { generateProgrammaticMermaid } from '../mermaid-generator';
import { ensureMermaidConfigured } from '../mermaid-config';
import { stripMermaidFences } from '../stripMermaidFences';
import { useVizStore } from '@/stores/vizStore';

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
  const theme = useVizStore((s) => s.theme);
  // Monotonic render sequence: only the latest effect's async render may
  // publish state or toast. A superseded render that rejects (e.g. its
  // config was replaced mid-flight) must not surface a misleading
  // "Failed to render diagram" toast.
  const renderSeqRef = useRef(0);

  useEffect(() => {
    if (mode === 'ai') {
      generate({ owner, repo });
    }
  }, [mode, owner, repo, generate]);

  useEffect(() => {
    if (mode === 'code' && !analysis) return;
    if (mode === 'ai' && !data?.diagram) {
      setSvg('');
      setRenderError(null);
      return;
    }
    const code = mode === 'code'
      ? generateProgrammaticMermaid(analysis)
      : stripMermaidFences(data?.diagram ?? '');

    if (!code) return;

    let active = true;
    const seq = ++renderSeqRef.current;
    const isLatest = () => active && seq === renderSeqRef.current;
    setRenderError(null);
    setSvg('');
    resetView();

    const id = `mermaid-view-svg-${seq}-${Math.floor(Math.random() * 1000000)}`;

    ensureMermaidConfigured(theme).render(id, code)
      .then(({ svg: renderedSvg }) => {
        if (isLatest()) {
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
        // Always clean up this attempt's DOM nodes, but only the latest
        // attempt may report an error to the user.
        const badEl = document.getElementById(id);
        if (badEl) badEl.remove();
        const badBind = document.getElementById(`d${id}`);
        if (badBind) badBind.remove();
        if (isLatest()) {
          const setToastMessage = useVizStore.getState().setToastMessage;
          setToastMessage('Failed to render diagram: ' + (err instanceof Error ? err.message : String(err)));
          setRenderError('Failed to layout flowchart. This can happen with complex circular dependencies.');
        }
      });

    return () => {
      active = false;
    };
  }, [mode, data, analysis, resetView, theme]);

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
