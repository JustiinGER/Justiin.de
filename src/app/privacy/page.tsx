import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Justin",
  description: "How this website processes personal data (GDPR / UK GDPR oriented).",
};

export default function PrivacyPage() {
  return (
    <main className="flex flex-col min-h-[60vh] pt-28 pb-16 px-6 lg:px-8">
      <article className="max-w-3xl mx-auto w-full">
        <p className="text-sm text-brand-muted mb-2">
          <Link
            href="/"
            className="text-brand-accent hover:underline underline-offset-4"
          >
            Home
          </Link>
          <span aria-hidden="true" className="mx-2">
            /
          </span>
          <span className="text-brand-text">Privacy Policy</span>
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-6">
          Privacy Policy
        </h1>
        <p className="text-brand-muted text-sm mb-10">
          Last updated: 23 April 2026. This information is provided in English for visitors and is
          intended to reflect common requirements under the EU General Data Protection Regulation
          (GDPR) and, where relevant, the UK GDPR. It does not constitute legal advice.
        </p>

        <div className="space-y-10 text-brand-text leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">1. Who is responsible?</h2>
            <p>
              This website (<strong>justiin.de</strong>) is operated as a personal online presence by
              a private individual. You can contact the operator via the details provided in the
              <strong> Connect</strong> section of this website.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              2. What data is processed when you visit the site?
            </h2>
            <p>
              When you use the website, the hosting environment and any reverse proxy in front of
              it may automatically process technical data needed to deliver the service, including
              for example IP address, date and time of the request, requested resource, HTTP status,
              transferred data volume, referrer, and user agent. Processing serves the purposes of
              providing the website, ensuring stability and security, and troubleshooting.
            </p>
            <p>
              <strong>Legal basis (GDPR):</strong> Art. 6(1)(f) GDPR (legitimate interests in
              operating and securing the website). Where logs are strictly necessary to make the
              service available, Art. 6(1)(b) GDPR may also apply.
            </p>
            <p>
              <strong>Retention:</strong> Server logs are kept only as long as necessary for the
              purposes above, in line with the technical configuration of the self-hosted
              environment (typical rotation/deletion periods apply).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              3. Local storage in your browser (no analytics cookies)
            </h2>
            <p>
              The site stores certain preferences locally in your browser using{" "}
              <code className="text-sm font-mono bg-brand-card px-1.5 py-0.5 rounded border border-brand-border">
                localStorage
              </code>
              , not on the server:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Theme:</strong> a manual theme override flag (
                <code className="text-sm font-mono">theme-manual</code>) and theme state managed by{" "}
                <code className="text-sm font-mono">next-themes</code> (typically under a key such as{" "}
                <code className="text-sm font-mono">theme</code>).
              </li>
              <li>
                <strong>Reduced motion:</strong> whether animations should be reduced (
                <code className="text-sm font-mono">motion-reduced</code>).
              </li>
            </ul>
            <p>
              You can delete these entries at any time via your browser settings. This processing
              occurs only on your device.
            </p>
            <p>
              <strong>Analytics / marketing:</strong> This project does not integrate third-party
              analytics or advertising trackers as part of the application code. If that changes,
              this policy will be updated and, where required, consent will be obtained before
              non-essential tracking begins.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              4. API routes and third-party services
            </h2>
            <p>
              The site loads dynamic information through server-side API routes. Your browser calls
              these routes on this origin; the server then contacts configured backends to retrieve
              status and statistics for display. These endpoints are used to provide live widgets and
              do not collect user profiles or store user-submitted personal data through the API
              route payloads.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Self-hosted endpoints:</strong> The server retrieves aggregated or
                statistical data from self-hosted services (for example ADS-B/aircraft statistics,
                BirdNET-Go analytics summaries, and Uptime Kuma public status APIs). Only summarized
                fields intended for display are sent to the browser.
              </li>
              <li>
                <strong>Steam Web API:</strong> The server requests recently played games from
                Valve&apos;s Steam Web API using a server-side API key and Steam ID. Valve processes
                requests according to its own terms and privacy information. The site forwards limited
                game metadata to the browser (for example game title and recent playtime).
              </li>
              <li>
                <strong>Reachability probe:</strong>{" "}
                <code className="text-sm font-mono">/api/ping</code> checks whether predefined
                internal hosts respond on certain ports when you view the lab section. The browser
                sends only an allowlisted server identifier; internal addresses are resolved on the
                server.
              </li>
            </ul>
            <p>
              <strong>Legal basis (GDPR):</strong> Art. 6(1)(f) GDPR (displaying site content you
              request and operating the personal page). Where Steam or other third parties process
              personal data on their own behalf, their policies apply in addition.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              5. External links
            </h2>
            <p>
              The &quot;Connect&quot; section links to third-party platforms (for example Discord,
              Telegram, Steam, GitHub). If you follow a link, that provider may process personal data
              (such as IP address, device information, and account-related data if you are logged
              in). This processing is governed solely by the respective provider&apos;s privacy
              policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              6. Fonts and static assets
            </h2>
            <p>
              Fonts are loaded via <code className="text-sm font-mono">next/font</code> (bundled
              with the application). No additional runtime font requests to third parties are
              introduced by the app code for that purpose.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              7. Your rights
            </h2>
            <p>
              If GDPR applies, you may have the right to access, rectification, erasure, restriction
              of processing, objection, and data portability, as well as the right to withdraw
              consent where processing is based on consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              8. Security
            </h2>
            <p>
              Appropriate technical and organizational measures are applied in line with the
              self-hosted setup, including keeping secrets (such as API keys) on the server and not
              exposing internal network addresses to the client beyond what is necessary for the
              described features.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              9. Changes
            </h2>
            <p>
              This policy may be updated when the website or its processing activities change. The
              &quot;Last updated&quot; date at the top will be revised accordingly.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
