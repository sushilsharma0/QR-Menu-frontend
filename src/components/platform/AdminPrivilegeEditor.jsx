import React, { useMemo, useState } from 'react'
import { FiCheck, FiCheckCircle, FiChevronDown, FiLayers, FiZap } from 'react-icons/fi'
import clsx from 'clsx'
import { nestPermissionsForUi, PLATFORM_PERMISSION_DEFS } from '../../constants/platformPermissions'

export default function AdminPrivilegeEditor({ value, onChange, disabled = false }) {
  const nested = useMemo(() => nestPermissionsForUi(PLATFORM_PERMISSION_DEFS), [])
  const [open, setOpen] = useState(() => Object.fromEntries(nested.map((d) => [d.domainId, true])))

  const toggleDomain = (id) => {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggle = (key) => {
    if (disabled) return
    onChange({ ...value, [key]: !value[key] })
  }

  const setKeys = (keys, enabled) => {
    if (disabled || !keys.length) return
    const next = { ...value }
    keys.forEach((key) => {
      next[key] = enabled
    })
    onChange(next)
  }

  const domainStats = useMemo(() => {
    const out = {}
    nested.forEach(({ domainId, sections }) => {
      const keys = sections.flatMap((s) => s.defs.map((d) => d.key))
      const on = keys.filter((k) => value[k]).length
      out[domainId] = { on, total: keys.length, keys }
    })
    return out
  }, [nested, value])

  const allCatalogKeys = useMemo(() => PLATFORM_PERMISSION_DEFS.map((d) => d.key), [])

  return (
    <div className="space-y-5">
      {!disabled && (
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200/90 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm dark:border-gray-800 dark:from-gray-950 dark:to-gray-900 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950/80 dark:text-primary-300">
              <FiZap className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Bulk actions</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Turn every privilege on or reset the form</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setKeys(allCatalogKeys, true)}
              className="rounded-xl border border-transparent bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Enable all
            </button>
            <button
              type="button"
              onClick={() => setKeys(allCatalogKeys, false)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {nested.map(({ domainId, meta, sections }) => {
          const stats = domainStats[domainId]
          const allOn = stats.total > 0 && stats.on === stats.total
          const someOn = stats.on > 0 && !allOn
          const isOpen = open[domainId]

          return (
            <section
              key={domainId}
              className={clsx(
                'overflow-hidden rounded-2xl border transition-shadow',
                isOpen
                  ? 'border-gray-200/95 bg-white shadow-md dark:border-gray-800 dark:bg-gray-950'
                  : 'border-gray-200/70 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950',
              )}
            >
              <div
                className={clsx(
                  'flex items-stretch gap-0',
                  isOpen && 'border-b border-gray-100 dark:border-gray-800/80',
                )}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleDomain(domainId)}
                  className="flex min-w-0 flex-1 items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-900/50 sm:px-5 sm:py-4"
                >
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-900">
                    {allOn ? (
                      <FiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    ) : (
                      <FiLayers
                        className={clsx(
                          'h-5 w-5',
                          someOn ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500',
                        )}
                        aria-hidden
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 pt-0.5">
                    <span className="flex flex-wrap items-center gap-2.5">
                      <span className="text-base font-bold tracking-tight text-gray-950 dark:text-gray-50">
                        {meta.title}
                      </span>
                      <span
                        className={clsx(
                          'rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums',
                          allOn && 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
                          !allOn && someOn && 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
                          stats.on === 0 && 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
                        )}
                      >
                        {stats.on}/{stats.total}
                      </span>
                    </span>
                    {meta.hint ? (
                      <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">{meta.hint}</p>
                    ) : null}
                  </span>
                  <span className="flex flex-shrink-0 items-center self-center pr-1">
                    <span
                      className={clsx(
                        'flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-transform dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400',
                        isOpen && 'rotate-180',
                      )}
                      aria-hidden
                    >
                      <FiChevronDown className="h-5 w-5" />
                    </span>
                  </span>
                </button>

                {!disabled && stats.total > 0 ? (
                  <div className="hidden items-center border-l border-gray-100 pr-4 dark:border-gray-800 sm:flex sm:pr-5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setKeys(stats.keys, !allOn)
                      }}
                      className={clsx(
                        'whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold ring-1 transition',
                        allOn
                          ? 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-800'
                          : 'bg-primary-50 text-primary-800 ring-primary-200/80 hover:bg-primary-100 dark:bg-primary-950/60 dark:text-primary-200 dark:ring-primary-900',
                      )}
                    >
                      {allOn ? 'Revoke domain' : 'Grant all in domain'}
                    </button>
                  </div>
                ) : null}
              </div>

              {!disabled && stats.total > 0 && isOpen ? (
                <div className="flex border-t border-gray-100 px-4 py-2 dark:border-gray-800 sm:hidden">
                  <button
                    type="button"
                    onClick={() => setKeys(stats.keys, !allOn)}
                    className={clsx(
                      'w-full rounded-lg py-2 text-center text-xs font-semibold',
                      allOn
                        ? 'text-gray-600 dark:text-gray-400'
                        : 'text-primary-700 dark:text-primary-400',
                    )}
                  >
                    {allOn ? 'Revoke all in domain' : 'Grant all in domain'}
                  </button>
                </div>
              ) : null}

              {isOpen && (
                <div className="space-y-4 bg-gray-50/80 px-4 py-4 dark:bg-gray-950 sm:px-5 sm:py-5">
                  {sections.map(({ sectionLabel, defs }) => (
                    <div key={`${domainId}:${sectionLabel ?? '__root'}`} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800/90 dark:bg-gray-950 sm:p-5">
                      {sectionLabel ? (
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-gray-200/80 pb-3 dark:border-gray-800">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                              {sectionLabel}
                            </p>
                            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-500">{defs.length} option(s)</p>
                          </div>
                          {!disabled && defs.length > 1 && (
                            <button
                              type="button"
                              className="text-xs font-semibold text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                              onClick={() => {
                                const keys = defs.map((d) => d.key)
                                const subsectionAllOn = keys.every((k) => value[k])
                                setKeys(keys, !subsectionAllOn)
                              }}
                            >
                              {defs.every((d) => value[d.key]) ? 'Deselect section' : 'Select section'}
                            </button>
                          )}
                        </div>
                      ) : (
                        defs.length > 1 && !disabled ? (
                          <div className="mb-3 flex justify-end border-b border-gray-200/80 pb-3 dark:border-gray-800">
                            <button
                              type="button"
                              className="text-xs font-semibold text-primary-700 hover:text-primary-800 dark:text-primary-400"
                              onClick={() => {
                                const keys = defs.map((d) => d.key)
                                const subsectionAllOn = keys.every((k) => value[k])
                                setKeys(keys, !subsectionAllOn)
                              }}
                            >
                              {defs.every((d) => value[d.key]) ? 'Deselect all' : 'Select all'}
                            </button>
                          </div>
                        ) : null
                      )}

                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:gap-3">
                        {defs.map((def) => (
                          <label
                            key={def.key}
                            aria-label={`${def.label} privilege`}
                            className={clsx(
                              'group relative flex cursor-pointer gap-3 rounded-xl border p-3.5 shadow-sm transition-all sm:p-4',
                              value[def.key]
                                ? 'border-primary-300/90 bg-white ring-1 ring-primary-200/50 dark:border-primary-800 dark:bg-gray-950 dark:ring-primary-900/40'
                                : 'border-gray-200/90 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950/80 dark:hover:border-gray-700',
                              disabled && 'cursor-not-allowed opacity-55',
                            )}
                          >
                            <span className="relative mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center">
                              <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={Boolean(value[def.key])}
                                disabled={disabled}
                                onChange={() => toggle(def.key)}
                              />
                              <span
                                className={clsx(
                                  'flex h-5 w-5 items-center justify-center rounded-md border-2 transition',
                                  value[def.key]
                                    ? 'border-primary-600 bg-primary-600 text-white dark:border-primary-500 dark:bg-primary-600'
                                    : 'border-gray-300 bg-white group-hover:border-gray-400 dark:border-gray-600 dark:bg-gray-900',
                                )}
                                aria-hidden
                              >
                                {value[def.key] ? <FiCheck className="h-3 w-3 stroke-[3]" /> : null}
                              </span>
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">
                                {def.label}
                              </span>
                              <span className="mt-1 block text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                                {def.description}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
