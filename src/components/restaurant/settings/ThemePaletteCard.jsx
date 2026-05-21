import React from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { FiCheck } from 'react-icons/fi'

export default function ThemePaletteCard({ theme, selected, onSelect }) {
  const colors = ['primary', 'secondary', 'accent', 'attention', 'surface']
  return (
    <LazyMotion features={domAnimation}>
    <m.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -4 }}
      className={`group rounded-lg border p-4 text-left transition hover:shadow-md ${
        selected
          ? 'border-primary-500 bg-primary-50 shadow-sm ring-2 ring-primary-100 dark:bg-gray-800 dark:ring-gray-700'
          : 'border-gray-100 bg-white hover:border-primary-200 dark:border-gray-800 dark:bg-gray-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-gray-950 dark:text-gray-100">{theme.name}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {theme.tier === 'default' ? 'Included' : 'Premium ready'}
          </p>
        </div>
        {selected && (
          <span className="rounded-full bg-primary-600 p-1 text-white">
            <FiCheck className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        {colors.map((key) => (
          <span
            key={key}
            className="h-7 w-7 rounded-full border border-white shadow-sm ring-1 ring-black/5"
            style={{ backgroundColor: theme.palette[key] }}
            title={key}
          />
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex">
          <div className="w-12 p-2" style={{ backgroundColor: theme.palette.primary }}>
            <div className="mb-2 h-4 rounded bg-white/25" />
            <div className="h-2 rounded bg-white/50" />
          </div>
          <div className="flex-1 p-2">
            <div className="mb-2 h-2 w-1/2 rounded" style={{ backgroundColor: theme.palette.secondary }} />
            <div className="rounded-md p-2" style={{ backgroundColor: theme.palette.surface }}>
              <span
                className="inline-block rounded px-2 py-1 text-[10px] font-bold text-white"
                style={{ backgroundColor: theme.palette.primary }}
              >
                Sample
              </span>
            </div>
          </div>
        </div>
      </div>
    </m.button>
    </LazyMotion>
  )
}
