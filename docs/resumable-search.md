# Search progress and recovery

Successful embedding batches are checkpointed separately from published indexes. Resume targets the same commit, credential scope, embedding configuration, and include/exclude paths, and skips embeddings already saved. Only fully embedded files are searchable in partial builds. A compatible previous complete index takes precedence, with its commit identified in the response.

Provider cooldowns use their retry time; local usage limits return the actual window reset. The search page resumes automatically at that time while open. Temporary failures without a known retry time require Resume. Cancel discards the unfinished build after any outstanding work settles, preserving published indexes.

Build IDs let Cancel reach requests still resolving repository metadata. Cancellations that arrive before their Start are remembered for two minutes in a separate 256-entry buffer; the oldest records are evicted if it fills. These records do not consume active or paused build capacity. Cancellation of a registered build remains effective until its outstanding work settles.

Search and AI responses carry coverage metadata. Partial responses are not cached. AI prompts and answer labels restrict claims to the indexed context. New semantic queries still require a query embedding, so an upstream outage or exhausted embedding budget can also temporarily prevent new searches.

Checkpoints use bounded process memory: at most 16 builds, 32 MiB and 4,000 chunks per build, and 128 MiB in total under the default search limits. They expire after 25 hours. Published indexes retain their existing cache expiry and eviction rules. Restarting the server clears both; deployments with multiple instances need shared durable storage before they can resume across instances. Credentials are not retained for automatic background retries.
