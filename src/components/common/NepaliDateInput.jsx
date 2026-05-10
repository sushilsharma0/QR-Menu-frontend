import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import NepaliDate, { dateConfigMap } from 'nepali-date-converter'

const BS_MONTH_KEYS = [
  'Baisakh',
  'Jestha',
  'Asar',
  'Shrawan',
  'Bhadra',
  'Aswin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
]

function bsDaysInMonth(year, monthIndex) {
  const row = dateConfigMap[String(year)]
  if (!row) return 30
  const key = BS_MONTH_KEYS[monthIndex]
  return row[key] ?? 30
}

function adToIsoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseIsoToNepali(iso) {
  if (!iso || typeof iso !== 'string') return null
  const parts = iso.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null
  const [y, m, day] = parts
  try {
    return NepaliDate.fromAD(new Date(y, m - 1, day))
  } catch {
    return null
  }
}

const WEEK_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const NepaliDateInput = forwardRef(function NepaliDateInput(
  {
    className = '',
    value,
    onChange,
    onBlur,
    name,
    disabled,
    required,
    defaultValue,
    id,
    ...rest
  },
  ref
) {
  const innerRef = useRef(null)
  const wrapRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [adMirror, setAdMirror] = useState(() =>
    value !== undefined ? (value || '') : (defaultValue || '')
  )

  const setRefs = useCallback(
    (el) => {
      innerRef.current = el
      if (typeof ref === 'function') ref(el)
      else if (ref) ref.current = el
    },
    [ref]
  )

  useEffect(() => {
    if (value !== undefined) setAdMirror(value || '')
  }, [value])

  const effectiveAd = value !== undefined ? (value || '') : adMirror

  const viewFromAd = useMemo(() => {
    const nd = parseIsoToNepali(effectiveAd)
    if (nd) return { year: nd.getYear(), month: nd.getMonth() }
    const now = NepaliDate.now()
    return { year: now.getYear(), month: now.getMonth() }
  }, [effectiveAd])

  const [viewYear, setViewYear] = useState(viewFromAd.year)
  const [viewMonth, setViewMonth] = useState(viewFromAd.month)

  useEffect(() => {
    setViewYear(viewFromAd.year)
    setViewMonth(viewFromAd.month)
  }, [viewFromAd.year, viewFromAd.month])

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const commitAd = useCallback(
    (iso) => {
      if (value === undefined) setAdMirror(iso)
      onChange?.({ target: { name, value: iso } })
    },
    [name, onChange, value]
  )

  const handleEnglishChange = useCallback(
    (e) => {
      const v = e.target.value
      if (value === undefined) setAdMirror(v)
      onChange?.(e)
    },
    [onChange, value]
  )

  const monthLabel = useMemo(() => {
    try {
      return new NepaliDate(viewYear, viewMonth, 1).format('MMMM YYYY')
    } catch {
      return `${BS_MONTH_KEYS[viewMonth] || ''} ${viewYear}`
    }
  }, [viewYear, viewMonth])

  const grid = useMemo(() => {
    let first
    try {
      first = new NepaliDate(viewYear, viewMonth, 1)
    } catch {
      return { cells: [], startPad: 0 }
    }
    const startPad = first.getDay()
    const dim = bsDaysInMonth(viewYear, viewMonth)
    const cells = []
    for (let d = 1; d <= dim; d += 1) cells.push(d)
    return { cells, startPad }
  }, [viewYear, viewMonth])

  const bsSummary = useMemo(() => {
    const nd = parseIsoToNepali(effectiveAd)
    if (!nd) return 'BS —'
    try {
      return nd.format('DD MMMM YYYY')
    } catch {
      return 'BS —'
    }
  }, [effectiveAd])

  const goPrevMonth = () => {
    const nd = new NepaliDate(viewYear, viewMonth, 1)
    nd.setMonth(nd.getMonth() - 1)
    setViewYear(nd.getYear())
    setViewMonth(nd.getMonth())
  }

  const goNextMonth = () => {
    const nd = new NepaliDate(viewYear, viewMonth, 1)
    nd.setMonth(nd.getMonth() + 1)
    setViewYear(nd.getYear())
    setViewMonth(nd.getMonth())
  }

  const pickDay = (day) => {
    let nd
    try {
      nd = new NepaliDate(viewYear, viewMonth, day)
    } catch {
      return
    }
    const iso = adToIsoDate(nd.toJsDate())
    commitAd(iso)
    setOpen(false)
  }

  const isSelectedDay = (day) => {
    const nd = parseIsoToNepali(effectiveAd)
    if (!nd) return false
    return nd.getYear() === viewYear && nd.getMonth() === viewMonth && nd.getDate() === day
  }

  return (
    <div ref={wrapRef} className={`relative flex w-full gap-2 ${className}`}>
      <div className="relative shrink-0">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="flex h-[42px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-left text-sm text-gray-800 shadow-sm outline-none transition hover:bg-gray-50 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <FiCalendar className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
          <span className="max-w-[9.5rem] truncate text-xs font-medium sm:max-w-[11rem]" title={bsSummary}>
            {bsSummary}
          </span>
        </button>
        {open && (
          <div
            className="absolute left-0 top-full z-50 mt-1 w-[min(100vw-2rem,20rem)] rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900"
            role="dialog"
            aria-label="Nepali calendar"
          >
            <div className="mb-2 flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={goPrevMonth}
                className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Previous month"
              >
                <FiChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-center text-sm font-semibold text-gray-900 dark:text-gray-100">{monthLabel}</span>
              <button
                type="button"
                onClick={goNextMonth}
                className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Next month"
              >
                <FiChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium uppercase text-gray-500 dark:text-gray-400">
              {WEEK_LABELS.map((w) => (
                <div key={w} className="py-1">
                  {w}
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-0.5">
              {Array.from({ length: grid.startPad }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {grid.cells.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => pickDay(day)}
                  className={`aspect-square rounded-lg text-sm font-medium transition ${
                    isSelectedDay(day)
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-gray-800 hover:bg-primary-50 dark:text-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-gray-500 dark:text-gray-400">Bikram Sambat · syncs to English date</p>
          </div>
        )}
      </div>
      <input
        id={id}
        ref={setRefs}
        type="date"
        name={name}
        disabled={disabled}
        required={required}
        value={value !== undefined ? value || '' : adMirror}
        onChange={handleEnglishChange}
        onBlur={onBlur}
        className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        {...rest}
      />
    </div>
  )
})

NepaliDateInput.displayName = 'NepaliDateInput'

export default NepaliDateInput
