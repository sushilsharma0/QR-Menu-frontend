import React from 'react'
import { FiX } from 'react-icons/fi'
import Button from '../../../../components/common/Button'
import Input from '../../../../components/common/Input'
import { money } from '../FinanceUI'
import { monthName } from './payrollUtils'

export default function PayrollEditModal({
  payrollModal,
  setPayrollModal,
  modalProfile,
  modalLoading,
  modalForm,
  setModalForm,
  month,
  year,
  payrollPeriodBs,
  savingModal,
  onSave,
}) {
  if (!payrollModal) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payroll-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 id="payroll-modal-title" className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {modalProfile?.name || 'Employee'} — {monthName(month)} {year}
              {payrollPeriodBs ? (
                <span className="mt-1 block text-sm font-normal text-emerald-800 dark:text-emerald-200">
                  {payrollPeriodBs} (BS)
                </span>
              ) : null}
            </h2>
            {modalLoading && <p className="text-sm text-gray-500">Loading…</p>}
            {!modalLoading && modalProfile && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Basic {money(modalProfile.salary)} · Allowance {money(modalProfile.allowance)}
                {modalProfile.department ? ` · ${modalProfile.department}` : ''}
              </p>
            )}
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setPayrollModal(null)}
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        {payrollModal.row?.paymentStatus === 'paid' && (
          <p className="mb-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
            This period is <strong>paid</strong> — slip and PDF only. You cannot edit, delete, or change payment status after paying.
          </p>
        )}
        {modalForm && !modalLoading && (
          <>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Enter attendance and variable pay for this month only. Basic and allowance stay on the employee profile unless you change them under Employees.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Working days" type="number" value={modalForm.workingDays} onChange={(e) => setModalForm((s) => ({ ...s, workingDays: Number(e.target.value || 0) }))} />
              <Input label="Present days" type="number" value={modalForm.presentDays} onChange={(e) => setModalForm((s) => ({ ...s, presentDays: Number(e.target.value || 0) }))} />
              <Input label="Absent / leave days" type="number" value={modalForm.absentDays} onChange={(e) => setModalForm((s) => ({ ...s, absentDays: Number(e.target.value || 0) }))} />
              <Input label="Late days" type="number" value={modalForm.lateDays} onChange={(e) => setModalForm((s) => ({ ...s, lateDays: Number(e.target.value || 0) }))} />
              <Input label="Late penalty (amount)" type="number" value={modalForm.latePenalty} onChange={(e) => setModalForm((s) => ({ ...s, latePenalty: Number(e.target.value || 0) }))} />
              <Input label="Overtime hours" type="number" value={modalForm.overtimeHours} onChange={(e) => setModalForm((s) => ({ ...s, overtimeHours: Number(e.target.value || 0) }))} />
              <Input label="Overtime rate / hr" type="number" value={modalForm.overtimeRate} onChange={(e) => setModalForm((s) => ({ ...s, overtimeRate: Number(e.target.value || 0) }))} />
              <Input label="Festival bonus" type="number" value={modalForm.festivalBonus} onChange={(e) => setModalForm((s) => ({ ...s, festivalBonus: Number(e.target.value || 0) }))} />
              <Input label="Performance bonus" type="number" value={modalForm.performanceBonus} onChange={(e) => setModalForm((s) => ({ ...s, performanceBonus: Number(e.target.value || 0) }))} />
              <Input label="Other deductions" type="number" value={modalForm.deductions} onChange={(e) => setModalForm((s) => ({ ...s, deductions: Number(e.target.value || 0) }))} />
              <Input label="Advance salary" type="number" value={modalForm.advanceSalary} onChange={(e) => setModalForm((s) => ({ ...s, advanceSalary: Number(e.target.value || 0) }))} />
              <Input label="Incentive" type="number" value={modalForm.incentive} onChange={(e) => setModalForm((s) => ({ ...s, incentive: Number(e.target.value || 0) }))} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                loading={savingModal}
                disabled={payrollModal.row?.paymentStatus === 'paid'}
                onClick={onSave}
              >
                Calculate &amp; save
              </Button>
              <Button type="button" variant="secondary" onClick={() => setPayrollModal(null)}>Cancel</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
