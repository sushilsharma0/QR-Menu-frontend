import React from 'react'
import { BRANCH_MODULE_SECTIONS } from '../../config/branchModuleConfig'

export default function BranchModulesField({ enabledModules, onToggle }) {
  return (
    <div className="max-h-[min(52vh,26rem)] space-y-4 overflow-y-auto pr-1">
      {BRANCH_MODULE_SECTIONS.map((section) => (
        <div key={section.id}>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
            {section.label}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {section.items.map(({ key, label }) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-surface-200 px-3 py-2 text-sm dark:border-gray-700"
              >
                <input
                  type="checkbox"
                  checked={enabledModules?.[key] !== false}
                  onChange={onToggle(key)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
