import { Suspense } from 'react'
import { SignInForm } from './SignInForm'

export const metadata = { title: 'Sign in · Limitless' }

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm border border-line bg-surface p-8">
        <p className="label !tracking-[0.18em] !text-ink">Limitless</p>
        <h1 className="mt-6 text-[1.625rem] leading-tight font-medium tracking-[-0.022em]">
          Sign in
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-56">
          Enter the email address you used to join. We will send you a link, and a code you can
          type in instead. No password to remember.
        </p>
        <Suspense>
          <SignInForm />
        </Suspense>
      </div>
    </main>
  )
}
