import { Link } from 'react-router-dom';
import { InfoPageLayout } from '@/components/layout/InfoPageLayout';

export function TermsPage() {
  return (
    <InfoPageLayout>
      <article className="mx-auto max-w-3xl space-y-6 text-sm leading-7 text-muted-foreground [&_section]:rounded-xl [&_section]:border [&_section]:border-border [&_section]:bg-card [&_section]:p-6 sm:[&_section]:p-8 [&_h2]:text-foreground [&_h2]:tracking-tight">
        <header className="mb-10 border-b border-border pb-8">
          <p className="eyebrow mb-4">Using gitSdm / Terms</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Terms of use</h1>
          <p className="mt-2">Updated September 12, 2026</p>
          <p className="mt-4">
            These terms describe how you may use the gitSdm service at gsdm.site. Questions or permission requests can
            be sent to{' '}
            <a className="text-accent underline" href="mailto:hello@gsdm.site">
              hello@gsdm.site
            </a>
            .
          </p>
        </header>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Free access and commercial use</h2>
          <p>
            gitSdm is free to use for personal and commercial projects. If you supply your own API key, your provider
            may charge you under its own pricing and terms. Permission to use gitSdm does not change the licenses or
            permissions attached to repositories you explore.
          </p>
          <p>
            These rules apply to the hosted service. The gitSdm source code remains governed by its software license;
            self-hosted installations may have different operating policies.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Repository content and credentials</h2>
          <p>
            Only access repositories and submit content you have permission to use. Before using AI or semantic search
            with private code, make sure you are allowed to send it to the configured providers. You retain your rights
            in your content.
          </p>
          <p>
            Keep your keys and tokens secure and revoke them with their provider if exposed. Read the{' '}
            <Link className="text-accent underline" to="/privacy">
              Privacy policy
            </Link>{' '}
            for details about credentials, repository content, and storage.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Automation and service limits</h2>
          <p>
            Contact us for permission before running automated bulk requests against the hosted service, including
            large-scale repository indexing or repeated API jobs. Normal use of the app, including the indexing it
            performs for you, does not require separate permission.
          </p>
          <p>
            Do not bypass rate limits, rotate credentials or network addresses to evade restrictions, attempt
            unauthorized access, or deliberately disrupt the service. Bringing your own API key does not exempt you from
            these rules.
          </p>
          <p>
            Requests may be queued, paused, or refused when capacity or usage limits are reached. We may restrict access
            to address abuse or protect availability. If you believe a restriction is a mistake, contact us.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Check results before relying on them</h2>
          <p>
            Dependency maps, search results, and AI answers can be incomplete, outdated, or wrong. Check the source code
            before making changes or decisions. Partial search results cover only the files indexed so far.
          </p>
          <p>
            gitSdm depends on GitHub, hosting services, and AI providers. Features may be unavailable during outages,
            maintenance, or provider limits. Search indexes and cached results are temporary; keep your own copies of
            anything you need.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Changes and questions</h2>
          <p>
            We will update this page and its date when these terms change. Changes apply going forward. Nothing in these
            terms removes rights that applicable law does not allow to be excluded.
          </p>
          <p>
            For questions about these terms or use of the service, email{' '}
            <a className="text-accent underline" href="mailto:hello@gsdm.site">
              hello@gsdm.site
            </a>
            . Do not include API keys, tokens, or private code.
          </p>
        </section>
      </article>
    </InfoPageLayout>
  );
}
