export const IMAGE_MAX_BYTES = 1 * 1024 * 1024
export const IMAGE_SIZE_HINT = 'Max 1 MB'

export const COUNTRY_OPTIONS = [
  { country: 'Nepal', currency: 'Rs.', code: 'NPR', timezone: 'Asia/Kathmandu', label: 'Nepal - Nepali Rupee (Rs.)' },
  { country: 'India', currency: '₹', code: 'INR', timezone: 'Asia/Kolkata', label: 'India - Indian Rupee (₹)' },
  { country: 'United States', currency: '$', code: 'USD', timezone: 'America/New_York', label: 'United States - US Dollar ($)' },
  { country: 'United Kingdom', currency: '£', code: 'GBP', timezone: 'Europe/London', label: 'United Kingdom - Pound (£)' },
  { country: 'Australia', currency: 'A$', code: 'AUD', timezone: 'Australia/Sydney', label: 'Australia - Australian Dollar (A$)' },
  { country: 'Canada', currency: 'C$', code: 'CAD', timezone: 'America/Toronto', label: 'Canada - Canadian Dollar (C$)' },
  { country: 'United Arab Emirates', currency: 'د.إ', code: 'AED', timezone: 'Asia/Dubai', label: 'UAE - Dirham (د.إ)' },
  { country: 'Japan', currency: '¥', code: 'JPY', timezone: 'Asia/Tokyo', label: 'Japan - Yen (¥)' },
]

export const currencyForCountry = (country) =>
  COUNTRY_OPTIONS.find((option) => option.country === country) || COUNTRY_OPTIONS[0]

export const DEFAULT_BACKUP_SECTIONS = [
  'menu',
  'tables',
  'inventory',
  'employees',
  'accounting',
  'payroll',
  'settings',
]
