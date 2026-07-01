import { z } from 'zod';

export const analyzeBodySchema = z.object({
  url: z.string().optional(),
  owner: z.string().min(1).max(39).regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/).optional(),
  repo: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-._]+$/).optional(),
  branch: z.string().optional(),
});

export const aiExplainSchema = z
  .object({
    owner: z.string().min(1).max(39).regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/),
    repo: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-._]+$/),
    branch: z.string().optional(),
    sha: z.string().optional(),
    scope: z.enum(['repo', 'node', 'file']).default('repo'),
    nodeId: z.string().optional(),
    filePath: z.string().optional(),
    fileSnippet: z.string().optional(),
    context: z.string().max(10000).optional(),
    eli5: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.scope === 'node') return !!data.nodeId;
      if (data.scope === 'file') return !!data.filePath;
      return true;
    },
    {
      message: 'nodeId is required when scope is "node", filePath is required when scope is "file"',
    }
  );

export const repoQuerySchema = z.object({
  owner: z.string().min(1).max(39).regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/),
  repo: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-._]+$/),
  branch: z.string().optional(),
  goal: z.string().min(1).max(500).optional(),
});

export const fileQuerySchema = repoQuerySchema.extend({
  path: z.string().min(1).max(500),
});

export const searchBodySchema = z.object({
  query: z.string().min(3).max(500),
  owner: z.string().min(1).max(39).regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/),
  repo: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-._]+$/),
  branch: z.string().optional(),
});

export const askBodySchema = z.object({
  question: z.string().min(3).max(500),
  owner: z.string().min(1).max(39).regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/),
  repo: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-._]+$/),
  branch: z.string().optional(),
});

export const indexBodySchema = z.object({
  owner: z.string().min(1).max(39).regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/),
  repo: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-._]+$/),
  branch: z.string().optional(),
});
