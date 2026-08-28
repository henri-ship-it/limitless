import Link from 'next/link'
import { SITE, socials } from '@/content/site'

export function Footer() {
  return (
    <footer className="border-t border-line px-6 py-8 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <p className="label !text-ink-40">
          {SITE.business} · Limitless
        </p>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.url}
              target="_blank"
              rel="noreferrer"
              className="label hover:!text-ink"
            >
              {social.label}
            </a>
          ))}
          <Link href="/privacy" className="label hover:!text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="label hover:!text-ink">
            Terms
          </Link>
          <a href={`mailto:${SITE.email}`} className="label hover:!text-ink">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  )
}
