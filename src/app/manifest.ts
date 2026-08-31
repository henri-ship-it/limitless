import type { MetadataRoute } from 'next'

/**
 * What a phone needs to keep Limitless on the home screen.
 *
 * Installed, it opens without browser chrome and behaves like an app: an icon
 * among the others, its own window, its own place in the app switcher. Nothing
 * about the platform changes, which is the point - one thing to build and one
 * thing to fix.
 *
 * Deliberately not locked to portrait. A journal is written upright and a
 * spread is photographed sideways.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Limitless',
    short_name: 'Limitless',
    description: 'The Limitless programme: your journal, the weekly chapters and the masterclasses.',
    // Straight to the Start Guide, which knows where each member is.
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f9f9f9',
    theme_color: '#ffffff',
    orientation: 'any',
    categories: ['education', 'lifestyle', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      /*
       * Android clips an icon to whatever shape the launcher uses, so this one
       * is the mark scaled down inside a padded tile and never loses its edges.
       */
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
