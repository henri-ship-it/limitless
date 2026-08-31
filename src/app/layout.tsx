import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { ServiceWorker } from '@/components/ServiceWorker'
import './globals.css'

/**
 * The journal sets its headings and the captions under its diagrams in Blender
 * Pro. Bold for the caption itself, medium for the attribution, both in
 * capitals, matching the printed page.
 */
const blenderPro = localFont({
  src: [
    { path: './fonts/BlenderPro-Medium.otf', weight: '500', style: 'normal' },
    { path: './fonts/BlenderPro-Bold.otf', weight: '700', style: 'normal' },
  ],
  variable: '--font-blender',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Limitless',
  description: 'The 16-week performance psychology programme from LMNTARY Performance.',
  /*
   * Installed on a phone, this is what the platform is called on the home
   * screen and what iOS shows in the switcher. iOS reads these rather than the
   * manifest, so both have to say the same thing.
   */
  appleWebApp: {
    capable: true,
    title: 'Limitless',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  /*
   * Draws behind the notch and the home indicator once installed, which is
   * what the safe area insets around the viewfinder and the dictation sheet
   * are already written for.
   */
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${GeistSans.variable} ${GeistMono.variable} ${blenderPro.variable}`}>
      <body>
        {children}
        <Analytics />
        <ServiceWorker />
      </body>
    </html>
  )
}
