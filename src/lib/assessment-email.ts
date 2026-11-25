import type { Mail } from './email'
import type { Profile } from './style-profile'
import { STYLE_COPY } from '@/content/know-thyself-copy'

/**
 * The result email somebody gets after taking Know Thyself.
 *
 * Styled as the platform, not as the newsletter. Same tokens as globals.css:
 * #f9f9f9 behind a white card with a hairline border, #262626 ink, the mono
 * label for eyebrows, #00dfbf used once on the leading bar, and the dark
 * button the rest of the platform uses. Geist cannot be relied on in an inbox,
 * so the stacks fall back to the system faces, which is what the platform
 * falls back to anyway.
 *
 * Images are hosted PNGs rather than inline SVG, which Gmail strips. The four
 * behavioural marks are the ones printed in the journal, so a style reads the
 * same in an inbox as on the page. All of them carry alt text.
 *
 * No em dashes or en dashes anywhere, and British spelling. That rule is the
 * whole house style and it is easy to break without noticing.
 */

const INK = '#262626'
const MUTED = '#2626268f'
const FAINT = '#26262666'
const RULE = '#ededed'
const PANEL = '#0000000a'
const PAPER = '#f9f9f9'
const ACCENT = '#00dfbf'

const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,monospace"

const BODY = `font-family:${SANS};font-size:17px;line-height:28px;color:${INK};`
const EYEBROW = `font-family:${MONO};font-size:12px;line-height:18px;letter-spacing:.06em;text-transform:uppercase;color:${FAINT};`

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
          <td style="padding:0 0 22px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="30" style="vertical-align:middle;padding-right:12px;">
                  ${mark(style.key, 24, "")}
                </td>
                <td style="font-family:${SANS};font-size:16px;line-height:22px;font-weight:${leading ? 600 : 400};color:${leading ? INK : MUTED};">
                  ${escape(style.name)}
                </td>
                <td align="right" style="font-family:${MONO};font-size:14px;line-height:22px;color:${leading ? INK : MUTED};">
                  ${value}%
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:7px;">
              <tr>
                <td style="background:#0000000d;height:8px;line-height:8px;font-size:0;">
                  <table role="presentation" width="${value}%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td style="background:${leading ? ACCENT : '#26262633'};height:8px;line-height:8px;font-size:0;">&nbsp;</td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    })
    .join('')

  /** Three questions read as three questions, not as one run-on line. */
  const lines = (items: string[]) =>
    items
      .map(
        (item) =>
          `<p class="t" style="margin:0 0 7px;${BODY}">${escape(item)}</p>`,
      )
      .join('')

  const row = (icon: string, term: string, detail: string) => {
    const src = img(icon)
    return `
    <tr>
      <td style="padding:0 0 30px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="32" style="vertical-align:top;padding-right:14px;padding-top:4px;">
              ${
                src
                  ? `<img src="${escape(src)}" width="20" height="20" alt="" style="display:block;border:0;width:20px;height:20px;" />`
                  : ''
              }
            </td>
            <td>
              <p class="label" style="margin:0 0 6px;${EYEBROW}">${escape(term)}</p>
              ${detail.startsWith('<p') ? detail : `<p class="t" style="margin:0;${BODY}">${escape(detail)}</p>`}
            </td>
          </tr>
        </table>
      </td>
    </tr>`
  }

  const button = resultUrl
    ? `<a href="${escape(resultUrl)}" style="display:inline-block;background:${INK};color:#ffffff;padding:17px 28px;font-family:${SANS};font-size:16px;line-height:20px;font-weight:500;text-decoration:none;">See your full result</a>`
    : ''

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <!--
    iOS Mail reformats a message it decides is too wide, which shrinks every
    point size on the page at once. That is what "the text is tiny on my
    phone" almost always is, and no amount of raising the font size fixes it,
    because the whole thing is being scaled down after the fact. This turns
    the reformatting off; the two text-size-adjust rules below stop the same
    behaviour in Gmail and Outlook.
  -->
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no" />
  <title>Know Thyself</title>
  <style>
    html, body { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; }
    @media only screen and (max-width:620px) {
      .shell { padding:16px 0 !important; }
      .message-content { padding:28px 18px 10px 18px !important; }
      .foot { padding:12px 18px 26px 18px !important; }
      .lead-name { font-size:28px !important; line-height:34px !important; }
      /* Restated at full size, so a client that has already scaled the
         message down is overridden rather than argued with. */
      .t { font-size:17px !important; line-height:27px !important; }
      .label { font-size:12px !important; line-height:18px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${PAPER};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0;">
    ${escape(preview)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="shell" style="background:${PAPER};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid ${RULE};">
          <tr>
            <td class="message-content" style="padding:40px 36px 12px 36px;">

              <p class="t" style="margin:0 0 22px;${BODY}">${escape(greeting)},</p>

              <p class="label" style="margin:0 0 14px;${EYEBROW}">Know Thyself &nbsp;·&nbsp; Chapter 01</p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
                <tr>
                  <td width="70" style="vertical-align:middle;padding-right:18px;">
                    ${mark(lead.key, 54, "")}
                  </td>
                  <td style="vertical-align:middle;">
                    <h1 class="lead-name" style="margin:0;font-family:${SANS};font-weight:500;font-size:32px;line-height:38px;letter-spacing:-0.022em;color:${INK};">
                      You lead with ${escape(lead.name)}
                    </h1>
                  </td>
                </tr>
              </table>

              <p class="t" style="margin:0 0 22px;${BODY}">${escape(summary)}</p>

              <p class="t" style="margin:0 0 30px;${BODY}">${escape(copy?.definition ?? lead.overview)}</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${bars}
              </table>

              <div style="border-top:1px solid ${RULE};margin:34px 0;"></div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${row('flash', 'Where it wins', lead.differentiator)}
                ${row('alert', 'Be careful', copy?.careful ?? lead.blindspot)}
                ${row('compass', 'Ask yourself', copy ? lines([...copy.counterWeights]) : lead.respondsTo)}
                ${row('chart', `Least like you: ${shadow.name}`, `${shadow.overview} It is the one you reach for last when a situation calls for it.`)}
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0;">
                <tr>
                  <td style="background:${PANEL};padding:22px 22px;">
                    <p class="t" style="margin:0;${BODY}">
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
            <td class="foot" style="padding:14px 36px 36px 36px;text-align:center;font-family:${SANS};font-size:13px;line-height:20px;color:${FAINT};">
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
