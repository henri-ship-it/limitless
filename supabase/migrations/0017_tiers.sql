-- The five products: Elevate and 365 join Core, Pro and Elite.

/*
 * Two more values on `member_tier`, and nothing else.
 *
 * Both read the year long journal, which is the same three hundred and thirty
 * six entries Elite reads, so neither brings content or tables with it. What
 * they bring is a different wrapper around the same book: Elevate without the
 * one to one, 365 for alumni with coaching bought a call at a time. All of that
 * lives in `TIERS` in src/content/programme.ts, because it decides what is
 * drawn rather than what is stored.
 *
 * `if not exists` so this is safe to run twice. Worth knowing before it runs
 * once: Postgres can add a value to an enum and cannot take one away again.
 * Removing either of these later means rewriting the type and every column
 * that uses it, so they are added when the products are real rather than kept
 * here in advance.
 *
 * No member is moved onto either. Checkout writes a tier and there is no
 * checkout for these yet, so every existing row stays exactly as it is.
 */
alter type member_tier add value if not exists 'elevate';
alter type member_tier add value if not exists 'threesixtyfive';
