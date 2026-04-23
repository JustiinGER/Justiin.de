import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const lastUpdated = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

  return (
    <footer
      className="border-t border-brand-border bg-brand-card/40 backdrop-blur-sm"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 text-sm text-brand-muted">
        <div className="w-full md:flex-1 min-w-0 text-center md:text-left">
          <p className="leading-relaxed break-words">
            <span className="text-brand-text/80">© {currentYear} justiin.de</span>
            <span className="mx-2 opacity-50" aria-hidden="true">
              ·
            </span>
            Built with Next.js and{" "}
            <span className="text-red-500" role="img" aria-label="heart">
              ❤️
            </span>{" "}
            | Last updated {lastUpdated}
          </p>
        </div>
        <nav aria-label="Footer" className="w-full md:w-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link
            href="#main"
            className="font-medium text-brand-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-brand-accent focus-visible:outline-offset-2 rounded"
          >
            Back to top
          </Link>
          <Link
            href="/privacy"
            className="font-medium text-brand-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-brand-accent focus-visible:outline-offset-2 rounded"
          >
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
