import NepaliDate from 'nepali-date-converter'

/** Full BS date label, e.g. "15 Magh 2082" */
export function formatBsFromAd(dateInput) {
  if (dateInput == null) return ''
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (Number.isNaN(d.getTime())) return ''
  try {
    return new NepaliDate(d).format('DD MMMM YYYY')
  } catch {
    return ''
  }
}

/**
 * BS month + year for an English payroll period (month 1–12, year AD).
 * Uses the 15th of that AD month as a stable midpoint for the mapping.
 */
export function adPayrollMonthYearToBs(month, year) {
  const m = Number(month)
  const y = Number(year)
  if (!m || !y || m < 1 || m > 12) return ''
  try {
    return new NepaliDate(new Date(y, m - 1, 15)).format('MMMM YYYY')
  } catch {
    return ''
  }
}
