import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const STATES_CACHE_PREFIX = 'qr_menu_loc_states_v2_'
const DISTRICTS_CACHE_PREFIX = 'qr_menu_loc_districts_v2_'
const CACHE_TTL_MS = 1000 * 60 * 60 * 24

function readCache(key) {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.at || Date.now() - parsed.at > CACHE_TTL_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

function writeCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }))
  } catch {
    /* ignore */
  }
}

function toSelectOptions(items) {
  return (items || [])
    .flatMap((row) => {
      const name = String(row?.name || '').trim()
      if (!name) return []
      return [{ value: name, label: name, id: row?.id }]
    })
    .sort((a, b) => a.label.localeCompare(b.label))
}

function ensureCurrentOption(options, currentValue, suffix = '(saved)') {
  const value = String(currentValue || '').trim()
  if (!value) return options
  if (options.some((o) => o.value === value)) return options
  return [{ value, label: `${value} ${suffix}`.trim() }, ...options]
}

/**
 * Country → State → District via backend (dr5hn nested catalog).
 */
export function useLocationCascade({ countryName, selectedState, selectedDistrict, selectedLocalLevel }) {
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [statesLoading, setStatesLoading] = useState(false)
  const [districtsLoading, setDistrictsLoading] = useState(false)
  const [statesError, setStatesError] = useState(false)
  const [districtsError, setDistrictsError] = useState(false)

  const country = String(countryName || '').trim()

  useEffect(() => {
    if (!country) {
      setStates([])
      setDistricts([])
      return undefined
    }

    let cancelled = false
    const cacheKey = `${STATES_CACHE_PREFIX}${country}`

    ;(async () => {
      const cached = readCache(cacheKey)
      if (cached) {
        setStates(cached)
        setStatesError(false)
        return
      }
      try {
        setStatesLoading(true)
        setStatesError(false)
        const res = await api.get('/public/locations/states', {
          params: { country },
          skipErrorToast: true,
        })
        const list = res?.data?.data?.states || []
        if (!cancelled) {
          setStates(list)
          writeCache(cacheKey, list)
        }
      } catch {
        if (!cancelled) {
          setStates([])
          setStatesError(true)
        }
      } finally {
        if (!cancelled) setStatesLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [country])

  useEffect(() => {
    if (!country || !selectedState) {
      setDistricts([])
      return undefined
    }

    let cancelled = false
    const cacheKey = `${DISTRICTS_CACHE_PREFIX}${country}::${selectedState}`

    ;(async () => {
      const cached = readCache(cacheKey)
      if (cached) {
        setDistricts(cached)
        setDistrictsError(false)
        return
      }
      try {
        setDistrictsLoading(true)
        setDistrictsError(false)
        const res = await api.get('/public/locations/districts', {
          params: { country, state: selectedState },
          skipErrorToast: true,
        })
        const list = res?.data?.data?.districts || []
        if (!cancelled) {
          setDistricts(list)
          writeCache(cacheKey, list)
        }
      } catch {
        if (!cancelled) {
          setDistricts([])
          setDistrictsError(true)
        }
      } finally {
        if (!cancelled) setDistrictsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [country, selectedState])

  const stateOptions = useMemo(
    () => ensureCurrentOption(toSelectOptions(states), selectedState),
    [states, selectedState],
  )

  const districtOptions = useMemo(
    () => ensureCurrentOption(toSelectOptions(districts), selectedDistrict),
    [districts, selectedDistrict],
  )

  const localLevelOptions = useMemo(() => {
    const districtKey = String(selectedDistrict || '').trim().toLowerCase()
    const pool = districtKey
      ? districts.filter((d) => String(d?.name || '').trim().toLowerCase() !== districtKey)
      : districts
    return ensureCurrentOption(toSelectOptions(pool), selectedLocalLevel)
  }, [districts, selectedDistrict, selectedLocalLevel])

  return {
    statesLoading,
    districtsLoading,
    statesError,
    districtsError,
    stateOptions,
    districtOptions,
    localLevelOptions,
    hasStates: states.length > 0,
    hasDistricts: districts.length > 0,
  }
}
