import React, { useMemo } from 'react'
import { FiCheck, FiX } from 'react-icons/fi'

const PLAN_PRESETS = {
  starter: {
    label: 'Starter',
    description: 'Core operations only',
    enable: ['dashboard', 'menu', 'orders', 'customerOrders', 'tables', 'accountSettings', 'supportTickets'],
  },
  growth: {
    label: 'Growth',
    description: 'Operations + staff + basic finance',
    enable: [
      'dashboard',
      'salesReports',
      'menu',
      'orders',
      'customerOrders',
      'tables',
      'promotions',
      'employees',
      'expenses',
      'financeOverview',
      'accountSettings',
      'supportTickets',
    ],
  },
  full: {
    label: 'Full platform',
    description: 'Enable every module',
    enable: null,
  },
}

const EMPTY_OPTIONS = []
const EMPTY_GROUPS = []
const EMPTY_FLAGS = {}

export default function PlanFeatureSelector({
  options = EMPTY_OPTIONS,
  groups = EMPTY_GROUPS,
  flags = EMPTY_FLAGS,
  onChange,
  disabled = false,
}) {
  const sections = useMemo(() => {
    if (groups.length) {
      return groups.map((g) => ({
        ...g,
        items: options.filter((o) => o.group === g.id),
      }))
    }
    return [{ id: 'all', label: 'Modules', description: '', items: options }]
  }, [groups, options])

  const enabledCount = useMemo(
    () => options.filter((o) => flags[o.key] !== false).length,
    [options, flags],
  )

  const setFlag = (key, value) => {
    onChange?.({ ...flags, [key]: value })
  }

  const setAll = (value) => {
    const next = { ...flags }
    options.forEach((o) => {
      next[o.key] = value
    })
    onChange?.(next)
  }

  const setGroup = (groupId, value) => {
    const next = { ...flags }
    for (const option of options) {
      if (option.group === groupId) {
        next[option.key] = value
      }
    }
    onChange?.(next)
  }

  const applyPreset = (presetKey) => {
    const preset = PLAN_PRESETS[presetKey]
    if (!preset) return
    if (preset.enable === null) {
      setAll(true)
      return
    }
    const next = {}
    options.forEach((o) => {
      next[o.key] = preset.enable.includes(o.key)
    })
    onChange?.(next)
  }

  if (!options.length) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading feature modules…</p>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Restaurant modules
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {enabledCount} of {options.length} enabled; unchecked modules are hidden in the restaurant sidebar and blocked on the API.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PLAN_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => applyPreset(key)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-primary-600"
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setAll(true)}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          >
            Enable all
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setAll(false)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-400"
          >
            Clear all
          </button>
        </div>
      </div>

      {sections.map((section) => {
        if (!section.items.length) return null
        const groupEnabled = section.items.filter((o) => flags[o.key] !== false).length

        return (
          <div
            key={section.id}
            className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-900/50"
          >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{section.label}</h4>
                {section.description ? (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{section.description}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium tabular-nums text-gray-500 dark:text-gray-400">
                  {groupEnabled}/{section.items.length}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setGroup(section.id, true)}
                  className="text-[11px] font-semibold text-primary-600 hover:underline dark:text-primary-400"
                >
                  All
                </button>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setGroup(section.id, false)}
                  className="text-[11px] font-semibold text-gray-500 hover:underline dark:text-gray-400"
                >
                  None
                </button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((opt) => {
                const enabled = flags[opt.key] !== false
                return (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={disabled}
                    onClick={() => setFlag(opt.key, !enabled)}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      enabled
                        ? 'border-primary-500 bg-white shadow-sm ring-1 ring-primary-100 dark:border-primary-600 dark:bg-gray-950 dark:ring-primary-900/50'
                        : 'border-gray-200 bg-white/60 opacity-75 dark:border-gray-700 dark:bg-gray-950/40'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {enabled ? (
                        <FiCheck className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                      ) : (
                        <FiX className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      )}
                      {opt.label}
                    </span>
                    {opt.description ? (
                      <span className="mt-1 block text-xs font-normal leading-snug text-gray-500 dark:text-gray-400">
                        {opt.description}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
