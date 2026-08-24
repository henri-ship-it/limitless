import { modules, weeks } from '@/content/programme'
import { formatWeekStart } from '@/lib/cohort'
import { workshops } from '@/content/assets'

/**
 * One button per module workshop. Each links to a calendar file when the date
 * is confirmed, and states the deload week it falls in until then.
 */
export function Workshops() {
  return (
    <ul className="!list-none !pl-0 grid gap-3 sm:grid-cols-2">
      {modules.map((m) => {
        const deload = m.weeks[m.weeks.length - 1]
        const week = weeks.find((w) => w.number === deload)!
        const workshop = workshops[m.number]
        return (
          <li key={m.number}>
            <div className="flex h-full flex-col justify-between gap-4 border border-line p-4">
              <div>
                <p className="label mb-1.5">Module {String(m.number).padStart(2, '0')}</p>
                <p className="text-[0.9375rem] font-medium">{m.name} workshop</p>
                <p className="mt-1 text-[0.8125rem] text-ink-56">
                  {workshop?.date
                    ? workshop.date
                    : `Deload week, from ${formatWeekStart(deload)}`}
                </p>
              </div>
              {workshop?.calendarUrl ? (
                <a
                  href={workshop.calendarUrl}
                  className="label !no-underline border border-line px-3 py-2 text-center hover:!text-ink hover:bg-ink-3"
                >
                  Add to calendar
                </a>
              ) : (
                <span className="label border border-line bg-ink-3 px-3 py-2 text-center !text-ink-40">
                  Date to be confirmed
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
