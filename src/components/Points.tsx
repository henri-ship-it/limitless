'use client'

/**
 * The seven point scale.
 *
 * Seven circles rather than a slider, largest at the ends and smallest at the
 * middle, so the strength of an answer is in the size of the target as well as
 * its position. It is easier to hit on a phone than a slider handle and it
 * cannot be nudged by a stray drag.
 *
 * Agree sits on the left, which is the way round the design asks for and the
 * opposite of the usual. The stored value does not care: the left end is 100
 * either way, so a result from this reads the same as one from the slider.
 *
 * Colour runs from the accent on the agree side to its opposite on the
 * disagree side, with the midpoint neutral.
 */

const ACCENT = '#00dfbf'
const INVERTED = '#ff391f'
const NEUTRAL = '#26262640'

/** Left to right, so the first is full agreement. */
const STEPS = [100, 83, 67, 50, 33, 17, 0]
const SIZES = [48, 40, 32, 25, 32, 40, 48]

function colourAt(index: number): string {
  if (index < 3) return ACCENT
  if (index > 3) return INVERTED
  return NEUTRAL
}

export function Points({
  value,
  onChange,
  low,
  high,
  label,
}: {
  /** The answer so far, or null when the question has not been touched. */
  value: number | null
  onChange: (value: number) => void
  /** The disagree end. */
  low: string
  /** The agree end. */
  high: string
  label: string
}) {
  return (
    <div className="mt-10">
      {/*
        * The ends are named underneath, at every width.
        *
        * They used to sit either side of the circles on anything wider than a
        * phone, and at that size the row came to more than the card is wide,
        * so the disagree end hung off the edge. Underneath it fits whatever
        * the card is, and the circles get the full width to breathe in.
        */}
      <div
        role="radiogroup"
        aria-label={label}
        className="flex items-center justify-between gap-1.5 sm:gap-2.5"
      >

        {STEPS.map((step, index) => {
          const size = SIZES[index]
          const colour = colourAt(index)
          const picked = value === step
          return (
            <button
              key={step}
              type="button"
              role="radio"
              aria-checked={picked}
              aria-label={`${step === 100 ? high : step === 0 ? low : `${step} towards ${step > 50 ? high : low}`}`}
              onClick={() => onChange(step)}
              className="flex shrink-0 items-center justify-center rounded-full transition-transform duration-150 active:scale-95"
              style={{ width: size, height: size }}
            >
              <span
                className="block rounded-full transition-all duration-150"
                style={{
                  width: size,
                  height: size,
                  border: `2px solid ${colour}`,
                  background: picked ? colour : 'transparent',
                  boxShadow: picked ? `0 0 0 4px ${colour}22` : 'none',
                }}
              />
            </button>
          )
        })}

      </div>

      <div className="mt-3.5 flex justify-between text-[0.8125rem] font-medium">
        <span style={{ color: ACCENT }}>{high}</span>
        <span style={{ color: INVERTED }}>{low}</span>
      </div>
    </div>
  )
}
