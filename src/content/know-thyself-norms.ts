/**
 * What everybody else scored on Know Thyself.
 *
 * Computed on 24 November 2026 from every finished sitting ScoreApp held, 274
 * of them, by reading each result's category scores through the Open API. Not
 * estimated, not rounded from a sample.
 *
 * The marker on the result uses the **median**, not the mean. Both are in the
 * table below and they sit within three points of each other, but the range
 * runs the full 0 to 100 and a handful of sittings are plainly incomplete, so
 * the median is the honest middle.
 *
 * Worth knowing when reading somebody's result: these four are not centred on
 * fifty. Caretaker runs high and Energiser runs low across the whole group, so
 * a Caretaker score of 60 is below average while an Energiser 60 is above it.
 * That is exactly why the marker is there.
 *
 * | Style     | n   | mean | median | p25 | p75 |
 * |-----------|-----|------|--------|-----|-----|
 * | Dynamo    | 269 | 66.4 | 67     | 56  | 78  |
 * | Analyst   | 270 | 64.5 | 67     | 54  | 79  |
 * | Caretaker | 268 | 68.3 | 70     | 60  | 80  |
 * | Energiser | 268 | 59.9 | 61     | 46  | 75  |
 *
 * Recompute when the platform has enough sittings of its own to beat this, and
 * keep the raw figures in the export beside this file's source.
 */

/** The middle score for each style, as a percentage. */
export const NORMS: Record<string, number> = {
  Dynamo: 67,
  Analyst: 67,
  Caretaker: 70,
  Energiser: 61,
}

/** The middle half of the group, for anything that wants to draw a band. */
export const NORM_RANGE: Record<string, { p25: number; p75: number }> = {
  Dynamo: { p25: 56, p75: 78 },
  Analyst: { p25: 54, p75: 79 },
  Caretaker: { p25: 60, p75: 80 },
  Energiser: { p25: 46, p75: 75 },
}

/**
 * Finished sittings behind the figures. Each style was scored on between 268
 * and 270 of them; the handful missing a category are sittings that did not
 * answer all nine of its statements.
 */
export const NORM_BASE = 274
