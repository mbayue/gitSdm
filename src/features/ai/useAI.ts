import { useMutation } from '@tanstack/react-query';
import {
  aiArchitecture,
  aiExplain,
  aiOnboarding,
  aiSuggestFiles,
  aiExplainNew,
  aiRefactor,
  aiHealth,
  aiMermaid,
  aiRoast,
  aiReadmeEnhance,
} from '@/lib/api-client';
import type { AIExplainRequest } from '@/types';

export function useExplain() {
  return useMutation({
    mutationFn: (body: AIExplainRequest) => aiExplain(body),
  });
}

export function useArchitecture() {
  return useMutation({
    mutationFn: ({ owner, repo }: { owner: string; repo: string }) =>
      aiArchitecture(owner, repo),
  });
}

export function useSuggestFiles() {
  return useMutation({
    mutationFn: ({ owner, repo }: { owner: string; repo: string }) =>
      aiSuggestFiles(owner, repo),
  });
}

export function useOnboarding() {
  return useMutation({
    mutationFn: ({ owner, repo }: { owner: string; repo: string }) =>
      aiOnboarding(owner, repo),
  });
}

export function useExplainNew() {
  return useMutation({
    mutationFn: ({ owner, repo }: { owner: string; repo: string }) =>
      aiExplainNew(owner, repo),
  });
}

export function useRefactor() {
  return useMutation({
    mutationFn: ({ owner, repo }: { owner: string; repo: string }) =>
      aiRefactor(owner, repo),
  });
}

export function useHealth() {
  return useMutation({
    mutationFn: ({ owner, repo }: { owner: string; repo: string }) =>
      aiHealth(owner, repo),
  });
}

export function useMermaid() {
  return useMutation({
    mutationFn: ({ owner, repo }: { owner: string; repo: string }) =>
      aiMermaid(owner, repo),
  });
}

export function useRoast() {
  return useMutation({
    mutationFn: ({ owner, repo }: { owner: string; repo: string }) =>
      aiRoast(owner, repo),
  });
}

export function useReadmeEnhance() {
  return useMutation({
    mutationFn: ({ owner, repo }: { owner: string; repo: string }) =>
      aiReadmeEnhance(owner, repo),
  });
}
