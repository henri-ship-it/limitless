'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Sign in, by link or by code.
 *
 * The link is the pleasant way in and works for most people. It cannot be the
 * only way in: a corporate mail filter opens every link it delivers to check
 * where it goes, and a sign-in link works exactly once, so the filter spends it
 * on the way past and the member is handed a dead link through no fault of
 * their own. Outlook and Hotmail do this as standard.
 *
 * A code cannot be spent by a machine reading the email, because nothing is
 * spent until somebody types it in here. So the same email carries both, and
 * anybody the link fails for has a way through that does not depend on us
 * guessing which mail provider they are on.
 */
export function SignInForm() {
  const params = useSearchParams()
  const next = params.get('next') ?? '/'
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [codeProblem, setCodeProblem] = useState('')

  /*
   * A link that did not work sent people back here to an ordinary empty form,
   * which reads as the site having forgotten them rather than as the link
   * having failed - so they try the same dead link again. Say what happened.
   */
  const failed = params.get('error') === 'link'

  async function send(event: React.FormEvent) {
    event.preventDefault()
    setState('sending')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        shouldCreateUser: false,
      },
    })

    if (!error) {
      setState('sent')
      return
    }

    /*
     * Asking for a second link too quickly is the common case, and telling
     * someone to check their spelling then is worse than useless: it sends
     * them looking for a problem that is not there.
     */
    const wait = /after (\d+) seconds?/.exec(error.message)
    if (wait || error.status === 429) {
      setMessage(
        wait
          ? `A link is already on its way. Check your inbox, or ask again in ${wait[1]} seconds.`
          : 'A link is already on its way. Check your inbox, including spam.',
      )
    } else {
      setMessage(
        'We could not send a link to that address. Check the spelling, or reply to any email from Chris and he will sort it out.',
      )
    }
    setState('error')
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault()
    setChecking(true)
    setCodeProblem('')

    const supabase = createClient()
    const address = email.trim()

    /*
     * Which type a code verifies under depends on how the email was sent, and
     * that is not worth reasoning about from here. Try both; only one of them
     * can be right, and being wrong costs a round trip rather than the code.
     */
    let error = (await supabase.auth.verifyOtp({ email: address, token: code, type: 'email' })).error
    if (error) {
      const second = await supabase.auth.verifyOtp({
        email: address,
        token: code,
        type: 'magiclink',
      })
      if (!second.error) error = null
    }

    if (!error) {
      // A full load rather than a client route, so the server sees the cookie.
      window.location.assign(next)
      return
    }

    setChecking(false)
    setCodeProblem(
      'That code did not work. Check you have the newest email, and that all six digits are in.',
    )
  }

  if (state === 'sent') {
    return (
      <div className="mt-6 border-t border-line pt-6">
        <p className="!mb-0 text-[0.9375rem] leading-relaxed">
          Check your inbox. Open the link and you are in, signed in for thirty days on this device.
        </p>

        <form onSubmit={verify} className="mt-6 border-t border-line pt-6">
          <label htmlFor="code" className="label">
            Or type the code from the email
          </label>
          <p className="mt-2 !mb-0 text-[0.8125rem] leading-relaxed text-ink-56">
            Some mail apps open the link to check it before you do, which uses it up. The code
            always works.
          </p>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="mt-3 w-full border border-line bg-surface px-3 py-2.5 text-[1.125rem] tracking-[0.3em] outline-none focus:border-ink"
          />
          <button
            type="submit"
            disabled={code.length < 6 || checking}
            className="label !text-white mt-4 w-full bg-ink px-4 py-3 hover:bg-ink-72 disabled:opacity-40"
          >
            {checking ? 'Checking' : 'Sign me in'}
          </button>
          {codeProblem ? (
            <p className="mt-4 !mb-0 text-[0.8125rem] leading-relaxed text-ink-56">{codeProblem}</p>
          ) : null}
        </form>

        <button
          type="button"
          onClick={() => {
            setState('idle')
            setCode('')
            setCodeProblem('')
          }}
          className="label mt-6 !text-ink-56 hover:!text-ink"
        >
          Use a different address
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={send} className="mt-6 border-t border-line pt-6">
      {failed ? (
        <p className="!mb-5 border border-line bg-ink-3 p-4 text-[0.875rem] leading-relaxed text-ink">
          That link has already been used, or it has expired. Some mail apps open links to check
          them before you do, which uses them up. Ask for a fresh one below, then type in the six
          digit code from the email rather than opening the link.
        </p>
      ) : null}
      <label htmlFor="email" className="label">
        Email address
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-2 w-full border border-line bg-surface px-3 py-2.5 text-[0.9375rem] outline-none focus:border-ink"
      />
      <button
        type="submit"
        disabled={state === 'sending'}
        className="label !text-white mt-4 w-full bg-ink px-4 py-3 hover:bg-ink-72 disabled:opacity-60"
      >
        {state === 'sending' ? 'Sending' : 'Send my link'}
      </button>
      {state === 'error' ? (
        <p className="mt-4 text-[0.8125rem] leading-relaxed text-ink-56">{message}</p>
      ) : null}
    </form>
  )
}
