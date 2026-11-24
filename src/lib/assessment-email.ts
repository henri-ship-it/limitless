import type { Mail } from './email'
import type { Profile } from './style-profile'
import { STYLE_COPY } from '@/content/know-thyself-copy'

/**
 * The result email somebody gets after taking Know Thyself.
 *
 * Styled from the actual newsletter template, `lmntary-editorial.html` in the
 * newsletter folder, rather than from the brand tokens or the Kit web archive,
 * both of which say something different. Its values, verbatim:
 *
 *   shell      554px, white, centred
 *   body       Georgia, 16.5px / 29px, #111111, paragraphs 22px apart
 *   headings   system sans, 700. h1 29/36 #000000, h2 22/30, h3 18/26
 *   eyebrow    the h6 rule: sans, 11/18, 400, .08em, uppercase, #8a8a8a
 *   links      #111111 with a 2px #04dfbf bottom border, never underlined
 *   button     #04dfbf on #06201d text, 13px 22px, 4px radius, sans 700 15px
 *   rule       1px #e4e4e4, 34px clear
 *   panel      #f1f1f1, 8px radius, 26px 24px
 *   footer     sans 12/18, #656565
 *
 * No banner. The template carries one and this does not, because the result is
 * the point and a header image pushes it under the fold.
 *
 * Images are hosted PNGs rather than inline SVG, which Gmail strips. The four
 * behavioural marks are the ones printed in the journal, so a style reads the
 * same in an inbox as on the page. All of them carry alt text.
 *
 * No em dashes or en dashes anywhere, and British spelling. That rule is the
 * whole house style and it is easy to break without noticing.
 */

const INK = '#111111'
const BLACK = '#000000'
const MUTED = '#656565'
const FAINT = '#8a8a8a'
const RULE = '#e4e4e4'
const PANEL = '#f1f1f1'
const ACCENT = '#04dfbf'
const ACCENT_INK = '#06201d'

const SERIF = "Georgia,'Times New Roman',serif"
const SANS = "-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif"

const BODY = `font-family:${SERIF};font-size:16.5px;line-height:29px;color:${INK};`
const EYEBROW = `font-family:${SANS};font-size:11px;line-height:18px;font-weight:400;letter-spacing:.08em;text-transform:uppercase;color:${FAINT};`

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
          <td style="padding:0 0 17px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="26" style="vertical-align:middle;padding-right:11px;">
                  ${mark(style.key, 22, style.name)}
                </td>
                <td style="font-family:${SANS};font-size:15px;line-height:20px;font-weight:${leading ? 700 : 400};color:${leading ? INK : MUTED};">
                  ${escape(style.name)}
                </td>
                <td align="right" style="font-family:${SANS};font-size:15px;line-height:20px;font-weight:700;color:${leading ? INK : MUTED};">
                  ${value}%
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:7px;">
              <tr>
                <td style="background:${PANEL};height:6px;line-height:6px;font-size:0;">
                  <table role="presentation" width="${value}%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td style="background:${leading ? ACCENT : '#c9c9c9'};height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>
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
      <td style="padding:0 0 26px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="30" style="vertical-align:top;padding-right:13px;padding-top:3px;">
              ${
                src
                  ? `<img src="${escape(src)}" width="18" height="18" alt="" style="display:block;border:0;width:18px;height:18px;" />`
                  : ''
              }
            </td>
            <td>
              <p style="margin:0 0 6px;${EYEBROW}">${escape(term)}</p>
              <p style="margin:0;${BODY}">${escape(detail)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
  }

  const button = resultUrl
    ? `<a href="${escape(resultUrl)}" style="display:inline-block;border:none;background-color:${ACCENT};color:${ACCENT_INK};padding:13px 22px;border-radius:4px;font-family:${SANS};font-size:15px;line-height:20px;font-weight:700;text-decoration:none;">See your full result</a>`
    : ''

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>Know Thyself</title>
  <style>
    @media only screen and (max-width:600px) {
      .message-content { padding-left:22px !important; padding-right:22px !important; }
      .lead-name { font-size:27px !important; line-height:34px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0;">
    ${escape(preview)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
    <tr>
      <td align="center">
        <table role="presentation" width="554" cellpadding="0" cellspacing="0" border="0" style="max-width:554px;background:#ffffff;">
          <tr>
            <td class="message-content" style="padding:38px 22px 8px 22px;">

              <p style="margin:0 0 22px;${BODY}">${escape(greeting)},</p>

              <p style="margin:0 0 14px;${EYEBROW}">Know Thyself &nbsp;·&nbsp; Chapter 01</p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
                <tr>
                  <td width="58" style="vertical-align:middle;padding-right:16px;">
                    ${mark(lead.key, 46, lead.name)}
                  </td>
                  <td style="vertical-align:middle;">
                    <h1 class="lead-name" style="margin:0;font-family:${SANS};font-weight:700;font-size:29px;line-height:36px;color:${BLACK};">
                      You lead with ${escape(lead.name)}
                    </h1>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 22px;${BODY}">${escape(summary)}</p>

              <p style="margin:0 0 30px;${BODY}">${escape(copy?.definition ?? lead.overview)}</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${bars}
              </table>

              <div style="border-top:1px solid ${RULE};margin:34px 0;"></div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${row('flash', 'Where it wins', lead.differentiator)}
                ${row('alert', 'Be careful', copy?.careful ?? lead.blindspot)}
                ${row('compass', 'Ask yourself', (copy?.counterWeights ?? []).join('  ·  ') || lead.respondsTo)}
                ${row('chart', `Least like you: ${shadow.name}`, `${shadow.overview} It is the one you reach for last when a situation calls for it.`)}
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0;">
                <tr>
                  <td style="background:${PANEL};border-radius:8px;padding:26px 24px;">
                    <p style="margin:0;${BODY}">
                      These are tendencies, not fixed positions. Where you sit moves with the room,
                      the pressure and the day, and ${escape(support.name)} will show up as readily
                      as ${escape(lead.name)} in the right conditions.
                    </p>
                  </td>
                </tr>
              </table>

              ${button ? `<p style="margin:0 0 30px;">${button}</p>` : ''}

            </td>
          </tr>
          <tr>
            <td style="padding:10px 22px 32px 22px;text-align:center;font-family:${SANS};font-size:12px;line-height:18px;color:${MUTED};">
              Sent because you took the Know Thyself assessment.<br />LMNTARY Performance
            </td>
          </tr>
        </table>
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
    'Sent because you took the Know Thyself assessment. LMNTARY Performance',
  ].join('\n')

  return {
    to,
    subject: `You lead with ${lead.name}`,
    html,
    text,
  }
}
