import { runHealth, runRefactor, runRoast, runReadmeEnhance, getToolKey } from './tool-cache';
import { useChatConfigRevision } from '@/stores/chatConfigStore';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  aiRefactor,
  aiHealth,
  aiMermaid,
  aiRoast,
  aiReadmeEnhance,
  aiLearningPath,
} from '@/lib/apiClient';

export function useRefactor() {
  const { revision } = useChatConfigRevision();
  return useMutation({
    mutationFn: ({ owner, repo, branch }: { owner: string; repo: string; branch?: string }) =>
      runRefactor(getToolKey('refactor', owner, repo, revision, branch), () => aiRefactor(owner, repo, branch)),
  });
}

export function useHealth() {
  const { revision } = useChatConfigRevision();
  return useMutation({
    mutationFn: ({ owner, repo, branch }: { owner: string; repo: string; branch?: string }) =>
      runHealth(getToolKey('health', owner, repo, revision, branch), () => aiHealth(owner, repo, branch)),
  });
}

export function useMermaid() {
  const { revision } = useChatConfigRevision();
  return useMutation({
    mutationKey: ['mermaid', revision],
    mutationFn: async ({ owner, repo }: { owner: string; repo: string }) =>
      ({ ...await aiMermaid(owner, repo), revision }),
  });
}

export function useRoast() {
  const { revision } = useChatConfigRevision();
  return useMutation({
    mutationFn: ({ owner, repo, branch }: { owner: string; repo: string; branch?: string }) =>
      runRoast(getToolKey('roast', owner, repo, revision, branch), () => aiRoast(owner, repo, branch)),
  });
}

export function useReadmeEnhance() {
  const { revision } = useChatConfigRevision();
  return useMutation({
    mutationFn: ({ owner, repo, branch }: { owner: string; repo: string; branch?: string }) =>
      runReadmeEnhance(getToolKey('readme-enhance', owner, repo, revision, branch), () => aiReadmeEnhance(owner, repo, branch)),
  });
}

export function useLearningPath(owner: string, repo: string, branch: string | null = null, enabled = true, goal?: string) {
  const { revision } = useChatConfigRevision();
  return useQuery({
    queryKey: ['learningPath', owner, repo, branch, goal, revision],
    queryFn: () => aiLearningPath(owner, repo, branch || undefined, goal),
    enabled: enabled && !!owner && !!repo,
    staleTime: 1000 * 60 * 30,
  });
}
