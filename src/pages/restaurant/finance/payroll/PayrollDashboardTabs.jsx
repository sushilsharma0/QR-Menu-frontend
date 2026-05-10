import React from 'react'
import { FiBarChart2, FiLayers } from 'react-icons/fi'

const tabs = [
  { id: 'run', label: 'Run payroll', short: 'Run', icon: FiLayers },
  { id: 'insights', label: 'Employee insights', short: 'Insights', icon: FiBarChart2 },
]

export default function PayrollDashboardTabs({ active, onChange }) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-1.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Payroll sections">
        {tabs.map(({ id, label, short, icon: Icon }) => {
          const isOn = active === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isOn}
              onClick={() => onChange(id)}
              className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition sm:flex-initial sm:justify-start ${
                isOn
                  ? 'bg-primary-700 text-white shadow-md dark:bg-primary-600'
                  : 'text-gray-600 hover:bg-surface-50 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{short}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
