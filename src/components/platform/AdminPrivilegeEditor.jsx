import React from 'react'
import { groupPermissionDefs, PLATFORM_PERMISSION_DEFS } from '../../constants/platformPermissions'

export default function AdminPrivilegeEditor({ value, onChange, disabled = false }) {
  const groups = groupPermissionDefs(PLATFORM_PERMISSION_DEFS)

  const toggle = (key) => {
    if (disabled) return
    onChange({ ...value, [key]: !value[key] })
  }

  const setGroup = (keys, enabled) => {
    if (disabled) return
    const next = { ...value }
    keys.forEach((key) => {
      next[key] = enabled
    })
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([groupName, defs]) => {
        const keys = defs.map((d) => d.key)
        const allOn = keys.every((k) => value[k])

        return (
          <div
            key={groupName}
            className="rounded-2xl border border-gray-100 bg-surface-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/40"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {groupName}
              </p>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => setGroup(keys, !allOn)}
                  className="text-xs font-semibold text-primary-700 hover:underline dark:text-primary-400"
                >
                  {allOn ? 'Clear group' : 'Select all'}
                </button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {defs.map((def) => (
                <label
                  key={def.key}
                  className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 transition ${
                    value[def.key]
                      ? 'border-primary-200 bg-white shadow-sm dark:border-primary-900 dark:bg-gray-900'
                      : 'border-transparent bg-white/80 dark:bg-gray-900/60'
                  } ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-primary-100'}`}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Boolean(value[def.key])}
                    disabled={disabled}
                    onChange={() => toggle(def.key)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {def.label}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">{def.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
