import type { AIProvider } from './provider';
import { createBoundedQueue } from '../utils/bounded-queue';
import { configuredLimit, reserveUsage } from '../utils/usage-limits';
import { AppError } from '../utils/errors';

const queue = createBoundedQueue();
export function protectAI(provider: AIProvider, serverFunded: boolean): AIProvider {
  return {
    complete(messages, options) {
      if (messages.reduce((sum, message) => sum + message.content.length, 0) > 64000)
        return Promise.reject(new AppError(413, 'AI prompt is too large.', 'PROMPT_TOO_LARGE'));
      return queue(async (signal) => {
        if (serverFunded) await reserveUsage('ai-daily', 1, configuredLimit('SERVER_AI_DAILY_CALLS', 500), 86400000);
        if (signal.aborted) throw new AppError(504, 'Provider request timed out.', 'PROVIDER_TIMEOUT', true);
        return provider.complete(messages, { ...options, signal });
      });
    },
  };
}
