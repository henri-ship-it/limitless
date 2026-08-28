'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignInForm() {
  const params = useSearchParams()
  const next = params.get('next') ?? '/'
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submit(event: React.FormEvent) {
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

  if (state === 'sent') {
    return (
      <p className="mt-6 border-t border-line pt-6 text-[0.9375rem] leading-relaxed">
        Check your inbox. The link keeps you signed in for thirty days on this device.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="mt-6 border-t border-line pt-6">
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
