/** Days in a given English calendar month (month 1–12). */
export function currentMonthDays(year, month) {
  return new Date(Number(year), Number(month), 0).getDate()
}

export function monthName(month) {
  return new Date(2026, Number(month || 1) - 1, 1).toLocaleString('en-US', { month: 'long' }).toUpperCase()
}

/** e.g. "Jan 2026" for payroll period labels */
export function formatEnglishPeriod(month, year) {
  const d = new Date(Number(year), Number(month) - 1, 1)
  return `${d.toLocaleString('en-US', { month: 'short' })} ${year}`
}

/** Preset id → [monthFrom, monthTo] inclusive (English months 1–12). */
export const PAYROLL_SUMMARY_MONTH_PRESETS = {
  full: [1, 12],
  h1: [1, 6],
  h2: [7, 12],
  q1: [1, 3],
  q2: [4, 6],
  q3: [7, 9],
  q4: [10, 12],
}

const smallNumbers = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
]
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

export function numberToWords(value) {
  const n = Math.floor(Number(value || 0))
  if (n === 0) return 'Zero'
  if (n < 20) return smallNumbers[n]
  if (n < 100) return `${tens[Math.floor(n / 10)]} ${smallNumbers[n % 10]}`.trim()
  if (n < 1000) return `${smallNumbers[Math.floor(n / 100)]} Hundred ${numberToWords(n % 100)}`.trim()
  if (n < 100000) return `${numberToWords(Math.floor(n / 1000))} Thousand ${numberToWords(n % 1000)}`.trim()
  return `${numberToWords(Math.floor(n / 100000))} Lakh ${numberToWords(n % 100000)}`.trim()
}
