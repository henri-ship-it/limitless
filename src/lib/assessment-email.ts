import type { Mail } from './email'
import type { Profile } from './style-profile'
import { STYLE_COPY } from '@/content/know-thyself-copy'

/**
 * The result email somebody gets after taking Know Thyself.
 *
 * ScoreApp sent one of these and taking the assessment in house took it away,
 * so this puts it back. It is written to Chris's rules rather than as a
 * personal note from him: it is plainly an automated result, and pretending
 * otherwise would be worse than not sending one.
 *
 * Styled to match the Kit newsletter rather than the platform: Urbanist,
 * generous spacing, the accent used sparingly. No banner, because the result
 * is the point and a header image only pushes it below the fold.
 *
 * Images are hosted PNGs rather than inline SVG, which Gmail strips. They are
 * the behavioural style marks printed in the journal, so a style reads the
 * same in an inbox as it does on the page. Every one has alt text, because a
 * good number of people will never load them.
 *
 * Note for anyone editing the copy: no em dashes or en dashes, anywhere, and
 * British spelling throughout. That rule is the whole house style and it is
 * easy to break without noticing.
 */

/*
 * The Kit newsletter template, read off its own configuration rather than
 * guessed at. Anton for headings, Inter for body, and note the accent is
 * #00dfbf, which is not the #04dfbf the platform uses.
 */
const INK = '#1c1c1c'
const HEADING = '#3c3c3c'
const MUTED = '#1c1c1c8f'
const FAINT = '#1c1c1c66'
const LINE = '#e4e8ec'
const ACCENT = '#00dfbf'
const PAPER = '#f3f6f9'

const BODY_FONT = "'Inter', Helvetica, Arial, sans-serif"
const HEADING_FONT = "'Anton', 'Inter', Helvetica, Arial, sans-serif"

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function resultEmail(options: {
  to: string
  firstName: string | null
  profile: Profile
  resultUrl: string | null
  /** Where the images live. Without it the email goes out as text and rules. */
  site: string | null
}): Mail {
  const { to, firstName, profile, resultUrl, site } = options
  const { lead, support, shadow, ranked, summary } = profile
  const copy = STYLE_COPY[lead.key]

  const greeting = firstName ? `Hi ${firstName}` : 'Hi'
  const img = (name: string) => (site ? `${site.replace(/\/$/, '')}/email/${name}.png` : null)

  /*
   * The preview text, which decides whether any of the rest gets read. It
   * names the style, because that is the one thing somebody is waiting to
   * know, and then points at the part they are not expecting.
   */
  const preview = `${lead.name} leads. The part worth reading is the one you reach for last.`

  const mark = (styleKey: string, size: number, alt: string) => {
    const src = img(styleKey)
    return src
      ? `<img src="${escape(src)}" width="${size}" height="${size}" alt="${escape(alt)}" style="display:block;border:0;width:${size}px;height:${size}px;" />`
      : ''
  }

  const bars = ranked
    .map(({ style, value }) => {
      const leading = style.key === lead.key
      return `
        <tr>
          <td style="padding:0 0 18px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="28" style="vertical-align:middle;padding-right:12px;">
                  ${mark(style.key, 24, style.name)}
                </td>
                <td style="font:${leading ? 600 : 400} 16px/1.4 ${BODY_FONT};color:${leading ? INK : MUTED};">
                  ${escape(style.name)}
                </td>
                <td align="right" style="font:600 15px/1.4 ${BODY_FONT};color:${leading ? INK : MUTED};">
                  ${value}%
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
              <tr>
                <td style="background:#0000000d;height:6px;line-height:6px;font-size:0;">
                  <table role="presentation" width="${value}%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td style="background:${leading ? ACCENT : '#26262633'};height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    })
    .join('')

  const row = (icon: string, term: string, detail: string) => {
    const src = img(icon)
    return `
    <tr>
      <td style="padding:0 0 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="32" style="vertical-align:top;padding-right:14px;padding-top:2px;">
              ${
                src
                  ? `<img src="${escape(src)}" width="20" height="20" alt="" style="display:block;border:0;width:20px;height:20px;" />`
                  : ''
              }
            </td>
            <td>
              <p style="margin:0 0 5px;font:600 12px/1.4 ${BODY_FONT};letter-spacing:0.14em;text-transform:uppercase;color:${FAINT};">
                ${escape(term)}
              </p>
              <p style="margin:0;font:400 18px/1.7 ${BODY_FONT};color:${INK};">
                ${escape(detail)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
  }

  const button = resultUrl
    ? `
    <tr>
      <td style="padding:10px 0 0;">
        <a href="${escape(resultUrl)}" style="display:inline-block;background:${ACCENT};color:#000000;text-decoration:none;font:400 16px/1 ${HEADING_FONT};text-transform:uppercase;letter-spacing:0.04em;padding:17px 28px;">
          See your full result
        </a>
      </td>
    </tr>`
    : ''

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <title>Know Thyself</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0;">
    ${escape(preview)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAPER};padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};">
          <tr>
            <td style="padding:44px 40px;">
              <p style="margin:0;font:400 18px/1.7 ${BODY_FONT};color:${INK};">
                ${escape(greeting)},
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0;">
                <tr>
                  <td width="60" style="vertical-align:middle;padding-right:18px;">
                    ${mark(lead.key, 52, lead.name)}
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font:400 15px/1.3 ${BODY_FONT};color:${MUTED};">You lead with</p>
                    <p style="margin:3px 0 0;font:400 36px/1.05 ${HEADING_FONT};text-transform:uppercase;letter-spacing:0.01em;color:${HEADING};">
                      ${escape(lead.name)}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font:400 18px/1.7 ${BODY_FONT};color:${INK};">
                ${escape(summary)}
              </p>

              <p style="margin:14px 0 0;font:400 18px/1.7 ${BODY_FONT};color:${MUTED};">
                ${escape(copy?.definition ?? lead.overview)}
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:34px 0 0;">
                ${bars}
              </table>

              <div style="height:1px;background:${LINE};margin:14px 0 30px;"></div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${row('flash', 'Where it wins', lead.differentiator)}
                ${row('alert', 'Be careful', copy?.careful ?? lead.blindspot)}
                ${row('compass', 'Ask yourself', (copy?.counterWeights ?? []).join('  ·  ') || lead.respondsTo)}
                ${row('chart', `Least like you: ${shadow.name}`, `${shadow.overview} It is the one you reach for last when a situation calls for it.`)}
              </table>

              <p style="margin:6px 0 28px;font:400 18px/1.7 ${BODY_FONT};color:${MUTED};">
                These are tendencies, not fixed positions. Where you sit moves with the room, the
                pressure and the day, and ${escape(support.name)} will show up as readily as
                ${escape(lead.name)} in the right conditions.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                ${button}
              </table>
            </td>
          </tr>
        </table>

        <p style="margin:22px 0 0;font:400 13px/1.6 ${BODY_FONT};color:${FAINT};max-width:560px;">
          Sent because you took the Know Thyself assessment. LMNTARY Performance.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = [
    preview,
    '',
    `${greeting},`,
    '',
    `You lead with ${lead.name}.`,
    '',
    summary,
    '',
    copy?.definition ?? lead.overview,
    '',
    ...ranked.map(({ style, value }) => `${style.name}: ${value}%`),
    '',
    `Where it wins: ${lead.differentiator}`,
    `Be careful: ${copy?.careful ?? lead.blindspot}`,
    ...(copy ? ['', 'Ask yourself:', ...copy.counterWeights.map((q) => `  ${q}`)] : []),
    '',
    `Least like you: ${shadow.name}. ${shadow.overview} It is the one you reach for last when a situation calls for it.`,
    '',
    `These are tendencies, not fixed positions. Where you sit moves with the room, the pressure and the day, and ${support.name} will show up as readily as ${lead.name} in the right conditions.`,
    ...(resultUrl ? ['', `See your full result: ${resultUrl}`] : []),
    '',
    'Sent because you took the Know Thyself assessment. LMNTARY Performance.',
  ].join('\n')

  return {
    to,
    subject: `You lead with ${lead.name}`,
    html,
    text,
  }
}
