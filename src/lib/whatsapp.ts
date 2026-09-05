/**
 * A link that hands a message to the WhatsApp app on this machine.
 *
 * `wa.me` goes to the browser first, and the browser then hands off to whatever
 * the operating system has registered as the default. Where both WhatsApp and
 * WhatsApp Business are installed that is nearly always the personal one, which
 * is the wrong account to be writing to a member from.
 *
 * The `whatsapp://` scheme skips the browser and lets the operating system
 * route it, so a machine with only the Business app installed opens the Business
 * app, and a machine with both is asked rather than assuming. There is no URL
 * that names one of the two outright: WhatsApp does not publish one, and the
 * two apps register the same scheme.
 *
 * The cost of this is that nothing happens at all when WhatsApp is not
 * installed, where `wa.me` would have opened web.whatsapp.com. That is the
 * right way round for a page only Chris and Henri ever open.
 */
export function whatsappHref({ phone, text }: { phone?: string | null; text?: string }): string {
  const params = new URLSearchParams()
  const digits = (phone ?? '').replace(/[^0-9]/g, '')
  if (digits) params.set('phone', digits)
  if (text) params.set('text', text)
  return `whatsapp://send?${params.toString()}`
}
