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
  return useMutation({
    mutationFn: ({ owner, repo, branch }: { owner: string; repo: string; branch?: string }) =>
      aiRefactor(owner, repo, branch),
  });
}

export function useHealth() {
  return useMutation({
    mutationFn: ({ owner, repo, branch }: { owner: string; repo: string; branch?: string }) =>
      aiHealth(owner, repo, branch),
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
    mutationFn: ({ owner, repo, branch }: { owner: string; repo: string; branch?: string }) =>
      aiRoast(owner, repo, branch),
  });
}

export function useReadmeEnhance() {
  return useMutation({
    mutationFn: ({ owner, repo, branch }: { owner: string; repo: string; branch?: string }) =>
      aiReadmeEnhance(owner, repo, branch),
  });
}

export function useLearningPath(owner: string, repo: string, branch: string | null = null, enabled = true, goal?: string) {
  return useQuery({
    queryKey: ['learningPath', owner, repo, branch, goal],
    queryFn: () => aiLearningPath(owner, repo, branch || undefined, goal),
    enabled: enabled && !!owner && !!repo,
    staleTime: 1000 * 60 * 30,
  });
}


