'use client'

import { useEffect, useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react'

/**
 * A box that grows to fit what is written in it.
 *
 * A journal answer is however long it is, and scrolling inside a four line
 * window to reread your own paragraph is a poor way to think. This keeps the
 * whole answer in view, which matters more on a phone than anywhere.
 *
 * Resized on the value rather than on typing, so text arriving from anywhere
 * else - a dictation, a photographed page, the entry loading - sizes the box
 * too. Layout effect so it happens before the frame is painted and the box
 * never visibly jumps.
 */
export function Grow({
  value,
  minRows = 3,
  className = '',
  ...rest
}: { value: string; minRows?: number } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const box = useRef<HTMLTextAreaElement>(null)

  const fit = () => {
    const el = box.current
    if (!el) return
    // Collapse first: scrollHeight only ever grows while a height is set.
    el.style.height = 'auto'
    /*
     * scrollHeight measures the content, and the box is sized border to border,
     * so a height taken straight from it comes up short by the borders and the
     * last line clips - which is the whole thing this was meant to stop.
     */
    const frame = el.offsetHeight - el.clientHeight
    el.style.height = `${el.scrollHeight + frame}px`
  }

  useLayoutEffect(fit, [value])

  // A narrower window rewraps the text, which changes the height it needs.
  useEffect(() => {
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <textarea
      ref={box}
      rows={minRows}
      value={value}
      // Growing and scrolling at once would fight each other.
      className={`resize-none overflow-hidden ${className}`}
      {...rest}
    />
  )
}
