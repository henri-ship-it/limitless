import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Limitless',
  description: 'The 16-week performance psychology programme from LMNTARY Performance.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  )
}
