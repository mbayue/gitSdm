import { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { generateProgrammaticMermaid } from '../mermaid-generator';
import type { RepoAnalysis } from '@/types';
import { stripMermaidFences } from '../stripMermaidFences';
import { copyToClipboard } from '@/lib/clipboard';
import { useVizStore } from '@/stores/vizStore';

export function useArchitectureExport(
  analysis: RepoAnalysis,
  repo: string,
  mode: 'code' | 'ai',
  data: { diagram: string } | undefined,
  svgContainerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [copied, setCopied] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const copiedSvgTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const setToastMessage = useVizStore((s) => s.setToastMessage);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      if (copiedSvgTimerRef.current) clearTimeout(copiedSvgTimerRef.current);
    };
  }, []);

  const handleCopyCode = async () => {
    let rawCode = mode === 'ai' ? data?.diagram : generateProgrammaticMermaid(analysis);
    if (!rawCode) return;

    rawCode = stripMermaidFences(rawCode);

    try {
      await copyToClipboard(rawCode);
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setToastMessage('Failed to copy code: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleCopySvg = async () => {
    if (!svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector('svg');
    if (!svgEl) return;
    try {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      await copyToClipboard(svgData);
      setCopiedSvg(true);
      if (copiedSvgTimerRef.current) clearTimeout(copiedSvgTimerRef.current);
      copiedSvgTimerRef.current = setTimeout(() => setCopiedSvg(false), 2000);
    } catch (err) {
      setToastMessage('Failed to copy SVG: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDownloadSvg = () => {
    if (!svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector('svg');
    if (!svgEl) return;
    try {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.href = svgUrl;
      link.download = `${repo}_architecture.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(svgUrl), 100);
    } catch (err) {
      setToastMessage('Download failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDownloadPng = async () => {
    if (!svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector('svg');
    if (!svgEl) return;
    try {
      const dataUrl = await toPng(svgEl as unknown as HTMLElement, {
        backgroundColor: '#09090b',
        quality: 0.95,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${repo}_architecture.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setToastMessage('Download PNG failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return {
    copied,
    copiedSvg,
    handleCopyCode,
    handleCopySvg,
    handleDownloadSvg,
    handleDownloadPng,
  };
}
