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
    mutationKey: ['refactor', revision],
    mutationFn: async ({ owner, repo, branch, sha }: { owner: string; repo: string; branch?: string; sha?: string }) => ({
      ...(await runRefactor(getToolKey('refactor', owner, repo, revision, branch, sha), () => aiRefactor(owner, repo, branch))),
      revision,
    }),
  });
}

export function useHealth() {
  const { revision } = useChatConfigRevision();
  return useMutation({
    mutationKey: ['health', revision],
    mutationFn: async ({ owner, repo, branch, sha }: { owner: string; repo: string; branch?: string; sha?: string }) => ({
      ...(await runHealth(getToolKey('health', owner, repo, revision, branch, sha), () => aiHealth(owner, repo, branch))),
      revision,
    }),
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
    mutationKey: ['roast', revision],
    mutationFn: async ({ owner, repo, branch, sha }: { owner: string; repo: string; branch?: string; sha?: string }) => ({
      ...(await runRoast(getToolKey('roast', owner, repo, revision, branch, sha), () => aiRoast(owner, repo, branch))),
      revision,
    }),
  });
}

export function useReadmeEnhance() {
  const { revision } = useChatConfigRevision();
  return useMutation({
    mutationKey: ['readme-enhance', revision],
    mutationFn: async ({ owner, repo, branch, sha }: { owner: string; repo: string; branch?: string; sha?: string }) => ({
      ...(await runReadmeEnhance(getToolKey('readme-enhance', owner, repo, revision, branch, sha), () => aiReadmeEnhance(owner, repo, branch))),
      revision,
    }),
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
