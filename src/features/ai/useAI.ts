import { useMutation } from '@tanstack/react-query';
import {
  aiArchitecture,
  aiExplain,
  aiOnboarding,
  aiSuggestFiles,
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
