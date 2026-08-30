# Member emails

House style: British English, no em dashes, no semicolons, no rhetorical
questions. Sign off as Chris.

## Magic link

Supabase → Authentication → Email templates → Magic Link.

Subject: `Your Limitless sign-in link`

```html
<p>Hi {{ .Data.first_name }},</p>

<p>Here is your link to sign in to Limitless. It keeps you signed in for 30 days
on this device.</p>

<p><a href="{{ .ConfirmationURL }}">Sign in to Limitless</a></p>

<p>If you did not request this, you can ignore it.</p>

<p>Chris</p>
```

`{{ .Data.first_name }}` reads from the user's metadata. Set it when importing
members, or drop the name and open with "Hi,".

## Digest emails

The Sunday weekly send for Core and Pro is in
[emails-weekly-digest.md](emails-weekly-digest.md). The monthly Elite send is in
[emails-monthly-elite.md](emails-monthly-elite.md).
