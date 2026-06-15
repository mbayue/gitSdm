import { z } from 'zod';

export const analyzeBodySchema = z.object({
  url: z.string().optional(),
  owner: z.string().optional(),
  repo: z.string().optional(),
  branch: z.string().optional(),
});

export const aiExplainSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  branch: z.string().optional(),
  sha: z.string().optional(),
  scope: z.enum(['repo', 'node', 'file']).default('repo'),
  nodeId: z.string().optional(),
  filePath: z.string().optional(),
  fileSnippet: z.string().optional(),
  context: z.string().optional(),
  eli5: z.boolean().optional(),
});

export const repoQuerySchema = z.object({
  owner: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-._]+$/),
  repo: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-._]+$/),
  branch: z.string().optional(),
});

export const fileQuerySchema = repoQuerySchema.extend({
  path: z.string().min(1).max(500),
});

export const searchBodySchema = z.object({
  query: z.string().min(3).max(500),
  owner: z.string(),
  repo: z.string(),
  branch: z.string().optional(),
});

export const askBodySchema = z.object({
  question: z.string().min(3).max(500),
  owner: z.string(),
  repo: z.string(),
  branch: z.string().optional(),
});

export const indexBodySchema = z.object({
  owner: z.string(),
  repo: z.string(),
  branch: z.string().optional(),
});
