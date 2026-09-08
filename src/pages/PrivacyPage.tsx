import { InfoPageLayout } from '@/components/layout/InfoPageLayout';

export function PrivacyPage() {
  return (
    <InfoPageLayout>
      <article className="mx-auto max-w-3xl space-y-6 text-sm leading-7 text-muted-foreground [&_section]:rounded-xl [&_section]:border [&_section]:border-border [&_section]:bg-card [&_section]:p-6 sm:[&_section]:p-8 [&_h2]:text-foreground [&_h2]:tracking-tight">
        <header className="mb-10 border-b border-border pb-8">
          <p className="eyebrow mb-4">Your data / Privacy</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Privacy policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Updated September 8, 2026</p>
          <p className="mt-4">gitSdm saves your settings in your browser and sends data to its server, GitHub, and the services used by its AI features. This page explains what is stored and shared. If you use a self-hosted installation, its hosting and provider settings may differ.</p>
        </header>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">What your browser saves</h2>
          <p>Your browser saves GitHub tokens and AI API keys in localStorage on this device. It also remembers your workspace preferences and the last repository you opened. These stay saved after you close the browser. Use Clear in Settings to remove saved keys, or clear this site's browser data to remove all local settings. Avoid saving keys on a shared device.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">What gitSdm sends to other services</h2>
          <p>When you request a repository, your browser sends its owner and name to the gitSdm server, along with relevant saved credentials in request headers. The server uses your GitHub credentials to fetch repository details and files from GitHub. Saved credentials therefore also leave your device when used for these requests.</p>
          <p>AI features may send your prompts, questions, and relevant repository content to the configured AI provider. That content can include private code accessed with your GitHub token. To build a semantic search index, gitSdm sends sections of code to the configured embedding provider. The Ask feature can send code found by the search to an AI provider to answer your question.</p>
          <p>The provider may be Google Gemini, OpenAI, Anthropic, EdgeOne, or another compatible service. Each provider has its own rules for privacy and data retention. If you have not added your own API key, the installation may use a key supplied by its operator. Only submit code you have permission to share with those services.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Server storage and logs</h2>
          <p>The server keeps repository analysis and AI results in memory so it can reuse them. These caches have size limits and expire after a set time. Semantic search indexes are also kept in memory, but have no fixed expiry. Clearing your browser data does not delete server caches, search indexes, or records held by providers.</p>
          <p>Application logs record request routes, timing, repository identifiers, and errors. Provider error messages may contain information you submitted. Hosting and network providers may also process connection details, such as your IP address. How long logs are kept depends on who operates the installation; there is no single retention period across deployments.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Other services and your choices</h2>
          <p>gitSdm loads fonts from Google Fonts and may show images hosted by GitHub or other services. Your browser shares connection details with those services when it loads these files. The app itself does not include a dedicated advertising or analytics tracker.</p>
          <p>You can try the mock demos without adding any credentials. To remove saved keys, use Settings. To revoke a key or token, use the service that issued it. For privacy questions, see the contact information on the <a className="text-accent underline" href="https://github.com/mbayue">maintainer's profile</a>, or contact your operator if you use a self-hosted installation. Do not post tokens, private code, or personal information in public issues.</p>
        </section>
      </article>
    </InfoPageLayout>
  );
}
