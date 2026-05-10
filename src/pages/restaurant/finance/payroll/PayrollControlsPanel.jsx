import React, { useState } from 'react'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import Button from '../../../../components/common/Button'
import Input from '../../../../components/common/Input'
import Select from '../../../../components/common/Select'
import { FinancePanel, money } from '../FinanceUI'

export default function PayrollControlsPanel({
  user,
  statutory,
  setStatutory,
  statutorySaving,
  saveStatutory,
  month,
  year,
  payrollPeriodBs,
  payrollPeriodAdIso,
  onPayrollPeriodDateChange,
  monthCount,
  setMonthCount,
  defaults,
  updateDefault,
  overtimePreview,
  generating,
  onGenerate,
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [statutoryOpen, setStatutoryOpen] = useState(false)

  const toggleBtnClass =
    'flex w-full items-center justify-between gap-3 rounded-xl border border-surface-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-surface-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800'

  return (
    <FinancePanel title="Create bulk salary payroll">
      {user?.role === 'restaurant' && statutory && (
        <div className="mb-4">
          <button
            type="button"
            aria-expanded={statutoryOpen}
            onClick={() => setStatutoryOpen((o) => !o)}
            className={toggleBtnClass}
          >
            <span>TDS &amp; EPF % (defaults)</span>
            {statutoryOpen ? (
              <FiChevronUp className="h-5 w-5 shrink-0 text-gray-500" aria-hidden />
            ) : (
              <FiChevronDown className="h-5 w-5 shrink-0 text-gray-500" aria-hidden />
            )}
          </button>
          {statutoryOpen && (
            <div className="mt-3 rounded-xl border border-surface-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/50">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Input
                  label="Default TDS %"
                  type="number"
                  step="0.01"
                  value={statutory.defaultTdsPercent ?? ''}
                  onChange={(e) => setStatutory((s) => ({ ...s, defaultTdsPercent: e.target.value }))}
                />
                <Input
                  label="Employee EPF %"
                  type="number"
                  step="0.01"
                  value={statutory.defaultEpfPercent ?? ''}
                  onChange={(e) => setStatutory((s) => ({ ...s, defaultEpfPercent: e.target.value }))}
                />
                <Input
                  label="Employer EPF %"
                  type="number"
                  step="0.01"
                  value={statutory.defaultEmployerEpfPercent ?? ''}
                  onChange={(e) => setStatutory((s) => ({ ...s, defaultEmployerEpfPercent: e.target.value }))}
                />
                <label className="flex items-center gap-2 pt-6 text-sm text-gray-700 dark:text-gray-300 lg:col-span-1">
                  <input
                    type="checkbox"
                    checked={Boolean(statutory.enabled)}
                    onChange={(e) => setStatutory((s) => ({ ...s, enabled: e.target.checked }))}
                    className="h-4 w-4 rounded border-surface-300"
                  />
                  TDS enabled
                </label>
                <div className="flex items-end lg:col-span-1">
                  <Button type="button" loading={statutorySaving} onClick={saveStatutory} className="w-full sm:w-auto">
                    Save defaults
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <p className="mb-4 rounded-lg border border-amber-200/70 bg-amber-50/80 px-3 py-1.5 text-xs text-amber-950 dark:border-amber-900/35 dark:bg-amber-950/20 dark:text-amber-100/90">
        Same month can&apos;t be generated twice — delete unpaid rows or use <span className="font-semibold">Edit pay</span>.
      </p>

      <div className="rounded-2xl border border-surface-200 bg-surface-50/50 p-4 dark:border-gray-800 dark:bg-gray-950/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="min-w-0 flex-1 lg:min-w-[280px] lg:max-w-xl">
            <Input
              label="Pay month"
              type="date"
              name="payrollPeriod"
              value={payrollPeriodAdIso}
              onChange={onPayrollPeriodDateChange}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-mono text-gray-700 dark:text-gray-300">{month}/{year}</span>
              {payrollPeriodBs ? (
                <>
                  {' '}
                  · <span className="text-emerald-800 dark:text-emerald-300">{payrollPeriodBs}</span>
                </>
              ) : null}
            </p>
          </div>
          <div className="w-full sm:w-56">
            <Select
              label="Months"
              value={monthCount}
              onValueChange={(v) => setMonthCount(Number(v))}
              title="Consecutive months to generate"
              aria-label="Consecutive months to generate"
              options={[
                { value: 1, label: '1 month' },
                { value: 2, label: '2 months' },
                { value: 3, label: '3 months' },
              ]}
            />
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-end lg:w-auto lg:flex-1 lg:justify-end">
            <Button type="button" loading={generating} onClick={onGenerate} className="w-full sm:w-auto lg:shrink-0">
              {monthCount > 1 ? `Generate ×${monthCount}` : 'Generate'}
            </Button>
          </div>
        </div>

        <div className="mt-4 border-t border-surface-200 pt-4 dark:border-gray-800">
          <button
            type="button"
            aria-expanded={advancedOpen}
            onClick={() => setAdvancedOpen((o) => !o)}
            className={toggleBtnClass}
          >
            <span>Attendance, overtime, bonuses</span>
            {advancedOpen ? (
              <FiChevronUp className="h-5 w-5 shrink-0 text-gray-500" aria-hidden />
            ) : (
              <FiChevronDown className="h-5 w-5 shrink-0 text-gray-500" aria-hidden />
            )}
          </button>

          {advancedOpen && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <Input label="Working days" type="number" value={defaults.workingDays} onChange={(e) => updateDefault('workingDays', e.target.value)} />
                <Input label="Present days" type="number" value={defaults.presentDays} onChange={(e) => updateDefault('presentDays', e.target.value)} />
                <Input label="Absent days" type="number" value={defaults.absentDays} onChange={(e) => updateDefault('absentDays', e.target.value)} />
                <Input label="Late days" type="number" value={defaults.lateDays} onChange={(e) => updateDefault('lateDays', e.target.value)} />
                <Input label="Late penalties" type="number" value={defaults.latePenalty} onChange={(e) => updateDefault('latePenalty', e.target.value)} />
                <Input label="Overtime hours" type="number" value={defaults.overtimeHours} onChange={(e) => updateDefault('overtimeHours', e.target.value)} />
                <Input label="Overtime rate/hr" type="number" value={defaults.overtimeRate} onChange={(e) => updateDefault('overtimeRate', e.target.value)} />
                <Input label="Festival bonus" type="number" value={defaults.festivalBonus} onChange={(e) => updateDefault('festivalBonus', e.target.value)} />
                <Input label="Performance bonus" type="number" value={defaults.performanceBonus} onChange={(e) => updateDefault('performanceBonus', e.target.value)} />
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 md:col-span-4 dark:border-amber-900/40 dark:bg-amber-950/30">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-200/90">OT</p>
                  <p className="mt-1 text-lg font-black text-amber-900 dark:text-amber-100">
                    {defaults.overtimeHours || 0} hrs × {money(defaults.overtimeRate)} = {money(overtimePreview)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </FinancePanel>
  )
}
