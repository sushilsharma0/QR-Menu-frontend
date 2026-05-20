import { useEffect, useMemo, useState } from 'react'
import { COUNTRY_OPTIONS, currencyForCountry } from '../components/restaurant/settings/settingsConstants'

const CATALOG_URL =
  'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries.json'
const CACHE_KEY = 'qr_menu_countries_catalog_v1'
const CACHE_TTL_MS = 1000 * 60 * 60 * 24

function flagEmoji(iso2) {
  const code = String(iso2 || '').toUpperCase()
  if (code.length !== 2) return ''
  return code.replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}

function currencySymbol(code, apiSymbol) {
  const sym = String(apiSymbol || '').trim()
  if (sym && sym.length <= 8) return sym
  try {
    const parts = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0)
    return parts.find((p) => p.type === 'currency')?.value || code
  } catch {
    return code
  }
}

function buildRowsFromApi(data) {
  if (!Array.isArray(data)) return []
  return data
    .map((row) => {
      const country = String(row?.name || '').trim()
      if (!country) return null
      const cca2 = String(row?.iso2 || '').trim().toUpperCase()
      const currencyCode = String(row?.currency || '').trim().toUpperCase()
      const zones = (row?.timezones || [])
        .map((tz) => String(tz?.zoneName || tz || '').trim())
        .filter(Boolean)
      const currency = currencySymbol(currencyCode, row?.currency_symbol)
      const timezone = zones[0] || 'UTC'
      const flag = String(row?.emoji || '').trim() || flagEmoji(cca2)
      return {
        country,
        cca2,
        currencyCode,
        currency,
        timezone,
        timezones: zones.length ? zones : [timezone],
        flag,
        label: `${flag ? `${flag} ` : ''}${country}`,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.country.localeCompare(b.country))
}

function buildRowsFromFallback() {
  return COUNTRY_OPTIONS.map((o) => ({
    country: o.country,
    cca2: o.code,
    currencyCode: o.code,
    currency: o.currency,
    timezone: o.timezone,
    timezones: [o.timezone],
    flag: flagEmoji(o.code),
    label: `${flagEmoji(o.code)} ${o.country}`.trim(),
  }))
}

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.at || Date.now() - parsed.at > CACHE_TTL_MS) return null
    return parsed.rows
  } catch {
    return null
  }
}

function writeCache(rows) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), rows }))
  } catch {
    /* ignore quota */
  }
}

export function useCountriesCatalog() {
  const [rows, setRows] = useState(() => readCache() || buildRowsFromFallback())
  const [loading, setLoading] = useState(!readCache())
  const [source, setSource] = useState(readCache() ? 'cache' : 'fallback')

  useEffect(() => {
    let cancelled = false
    const cached = readCache()
    if (cached?.length) {
      setRows(cached)
      setLoading(false)
      setSource('cache')
      return undefined
    }

    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(CATALOG_URL)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const built = buildRowsFromApi(data)
        if (!built.length) throw new Error('Empty catalog')
        if (!cancelled) {
          setRows(built)
          setSource('api')
          writeCache(built)
        }
      } catch {
        if (!cancelled) {
          setRows(buildRowsFromFallback())
          setSource('fallback')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const countriesWithCurrent = useMemo(() => {
    return rows
  }, [rows])

  const resolveRow = (countryName) => {
    const name = String(countryName || '').trim()
    if (!name) return null
    return (
      countriesWithCurrent.find((r) => r.country === name)
      || countriesWithCurrent.find((r) => r.country.toLowerCase() === name.toLowerCase())
      || currencyForCountry(name)
    )
  }

  const countryOptions = useMemo(
    () => countriesWithCurrent.map((r) => ({ value: r.country, label: r.label || r.country })),
    [countriesWithCurrent],
  )

  const currencyOptions = useMemo(() => {
    const seen = new Set()
    const opts = []
    countriesWithCurrent.forEach((r) => {
      const key = `${r.currencyCode}|${r.currency}`
      if (seen.has(key)) return
      seen.add(key)
      opts.push({
        value: r.currency,
        label: `${r.currencyCode} — ${r.currency}`,
      })
    })
    return opts.sort((a, b) => a.label.localeCompare(b.label))
  }, [countriesWithCurrent])

  const timezoneOptionsFor = (countryName) => {
    const row = resolveRow(countryName)
    const zones = row?.timezones?.length ? row.timezones : [row?.timezone || 'UTC']
    return zones.map((z) => ({
      value: z,
      label: z.replace(/_/g, ' '),
    }))
  }

  const ensureSavedLocale = (restaurant) => {
    if (!restaurant?.country) return countriesWithCurrent
    if (countriesWithCurrent.some((r) => r.country === restaurant.country)) {
      return countriesWithCurrent
    }
    const saved = {
      country: restaurant.country,
      cca2: '',
      currencyCode: '',
      currency: restaurant.settings?.currency || '—',
      timezone: restaurant.settings?.timezone || 'UTC',
      timezones: [restaurant.settings?.timezone || 'UTC'],
      flag: '🌍',
      label: `🌍 ${restaurant.country}`,
    }
    return [saved, ...countriesWithCurrent]
  }

  return {
    rows: countriesWithCurrent,
    loading,
    source,
    countryOptions,
    currencyOptions,
    resolveRow,
    timezoneOptionsFor,
    ensureSavedLocale,
  }
}
