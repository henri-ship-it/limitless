import type { Mail } from './email'
import type { Profile } from './style-profile'

/**
 * The result email somebody gets after taking Know Thyself.
 *
 * ScoreApp sent one of these and taking the assessment in house took it away,
 * so this puts it back. It is written to Chris's rules rather than as a
 * personal note from him: it is plainly an automated result, and pretending
 * otherwise would be worse than not sending one.
 *
 * Note for anyone editing the copy: no em dashes or en dashes, anywhere, and
 * British spelling throughout. That rule is the whole house style and it is
 * easy to break without noticing.
 */

const INK = '#262626'
const MUTED = '#2626268f'
const LINE = '#ededed'
const ACCENT = '#04dfbf'

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
}): Mail {
  const { to, firstName, profile, resultUrl } = options
  const { lead, support, shadow, ranked, summary } = profile

  const greeting = firstName ? `Hi ${firstName}` : 'Hi'

  const bars = ranked
    .map(({ style, value }) => {
      const leading = style.key === lead.key
      return `
        <tr>
          <td style="padding:0 0 14px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font:500 15px/1.4 -apple-system,system-ui,sans-serif;color:${leading ? INK : MUTED};">
                  ${escape(style.name)}
                </td>
                <td align="right" style="font:400 13px/1.4 ui-monospace,Menlo,monospace;color:${MUTED};">
                  ${value}%
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:7px;">
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

  const row = (term: string, detail: string) => `
    <tr>
      <td style="padding:0 0 18px;">
        <p style="margin:0 0 4px;font:500 11px/1.4 -apple-system,system-ui,sans-serif;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};">
          ${escape(term)}
        </p>
        <p style="margin:0;font:400 15px/1.6 -apple-system,system-ui,sans-serif;color:${INK};">
          ${escape(detail)}
        </p>
      </td>
    </tr>`

  const button = resultUrl
    ? `
    <tr>
      <td style="padding:8px 0 0;">
        <a href="${escape(resultUrl)}" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;font:500 15px/1 -apple-system,system-ui,sans-serif;padding:14px 22px;">
          Take it again
        </a>
      </td>
    </tr>`
    : ''

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#f9f9f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9f9f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#ffffff;border:1px solid ${LINE};">
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0;font:500 11px/1.4 -apple-system,system-ui,sans-serif;letter-spacing:0.18em;text-transform:uppercase;color:${INK};">
                Know Thyself
              </p>

              <p style="margin:26px 0 0;font:400 16px/1.6 -apple-system,system-ui,sans-serif;color:${INK};">
                ${escape(greeting)},
              </p>

              <h1 style="margin:18px 0 0;font:500 26px/1.25 -apple-system,system-ui,sans-serif;letter-spacing:-0.02em;color:${INK};">
                You lead with ${escape(lead.name)}
              </h1>

              <p style="margin:12px 0 0;font:400 15px/1.6 -apple-system,system-ui,sans-serif;color:${INK};">
                ${escape(lead.overview)} ${escape(summary)}
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0 0;">
                ${bars}
              </table>

              <hr style="border:0;border-top:1px solid ${LINE};margin:26px 0;">

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${row('Reads as', lead.reads)}
                ${row('Responds to', lead.respondsTo)}
                ${row('Where it wins', lead.differentiator)}
                ${row('Blindspot', lead.blindspot)}
                ${row('Bottleneck', lead.bottleneck)}
                ${row(`Least like you: ${shadow.name}`, `${shadow.overview} Worth knowing, because it is the one you will reach for last when a situation calls for it.`)}
              </table>

              <p style="margin:6px 0 24px;font:400 15px/1.6 -apple-system,system-ui,sans-serif;color:${INK};">
                None of this is a box. It is a starting point, and the useful part is noticing
                where ${escape(support.name)} shows up instead.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                ${button}
              </table>
            </td>
          </tr>
        </table>

        <p style="margin:20px 0 0;font:400 12px/1.6 -apple-system,system-ui,sans-serif;color:${MUTED};max-width:520px;">
          Sent because you took the Know Thyself assessment. LMNTARY Performance.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = [
    `${greeting},`,
    '',
    `You lead with ${lead.name}.`,
    '',
    `${lead.overview} ${summary}`,
    '',
    ...ranked.map(({ style, value }) => `${style.name}: ${value}%`),
    '',
    `Reads as: ${lead.reads}`,
    `Responds to: ${lead.respondsTo}`,
    `Where it wins: ${lead.differentiator}`,
    `Blindspot: ${lead.blindspot}`,
    `Bottleneck: ${lead.bottleneck}`,
    '',
    `Least like you: ${shadow.name}. ${shadow.overview} Worth knowing, because it is the one you will reach for last when a situation calls for it.`,
    '',
    `None of this is a box. It is a starting point, and the useful part is noticing where ${support.name} shows up instead.`,
    ...(resultUrl ? ['', `Take it again: ${resultUrl}`] : []),
    '',
    'Sent because you took the Know Thyself assessment. LMNTARY Performance.',
  ].join('\n')

  return {
    to,
    subject: `Your Know Thyself result: ${lead.name}`,
    html,
    text,
  }
}
