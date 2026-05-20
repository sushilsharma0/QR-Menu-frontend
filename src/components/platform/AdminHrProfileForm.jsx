import React from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import Button from '../common/Button'
import Input from '../common/Input'

const emptyHr = {
  name: '',
  designation: '',
  department: 'Operations',
  phone: '',
  joiningDate: '',
  salary: '',
  allowance: '',
  panNumber: '',
  bankName: '',
  bankAccountNumber: '',
  bankBranch: '',
  payrollEligible: true,
}

export function emptyHrProfile() {
  return { ...emptyHr }
}

export function hrProfileFromAdmin(admin = {}) {
  const join = admin.joiningDate ? new Date(admin.joiningDate) : null
  return {
    name: admin.name || '',
    designation: admin.designation || '',
    department: admin.department || 'Operations',
    phone: admin.phone || '',
    joiningDate: join && !Number.isNaN(join.getTime()) ? join.toISOString().slice(0, 10) : '',
    salary: admin.salary != null ? String(admin.salary) : '',
    allowance: admin.allowance != null ? String(admin.allowance) : '',
    panNumber: admin.panNumber || '',
    bankName: admin.bankName || '',
    bankAccountNumber: admin.bankAccountNumber || '',
    bankBranch: admin.bankBranch || '',
    payrollEligible: admin.payrollEligible !== false,
  }
}

export default function AdminHrProfileForm({
  values,
  onChange,
  employeeCode = '',
  onEmployeeCodeChange,
  onRegenerateCode,
  loadingCode = false,
  showName = true,
  nameRegister,
  nameError,
  employeeCodeReadOnly = false,
}) {
  const set = (key, val) => onChange({ ...values, [key]: val })

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Employee ID</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={employeeCode}
            onChange={(e) => onEmployeeCodeChange?.(e.target.value.toUpperCase())}
            readOnly={employeeCodeReadOnly}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 font-mono text-sm disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900"
            placeholder="EMP001"
          />
          {!employeeCodeReadOnly && onRegenerateCode && (
            <Button type="button" variant="secondary" onClick={onRegenerateCode} loading={loadingCode} title="Generate next ID">
              <FiRefreshCw />
            </Button>
          )}
        </div>
      </div>
      {showName && nameRegister ? (
        <Input label="Display name" {...nameRegister} error={nameError} />
      ) : showName ? (
        <Input label="Display name" value={values.name} onChange={(e) => set('name', e.target.value)} required />
      ) : null}
      <Input
        label="Designation"
        value={values.designation}
        onChange={(e) => set('designation', e.target.value)}
        placeholder="e.g. Support Lead"
      />
      <Input
        label="Department"
        value={values.department}
        onChange={(e) => set('department', e.target.value)}
        placeholder="e.g. Operations"
      />
      <Input label="Phone" value={values.phone} onChange={(e) => set('phone', e.target.value)} />
      <Input
        label="Joining date"
        type="date"
        value={values.joiningDate}
        onChange={(e) => set('joiningDate', e.target.value)}
      />
      <Input
        label="Monthly salary (₹)"
        type="number"
        min="0"
        value={values.salary}
        onChange={(e) => set('salary', e.target.value)}
      />
      <Input
        label="Monthly allowance (₹)"
        type="number"
        min="0"
        value={values.allowance}
        onChange={(e) => set('allowance', e.target.value)}
      />
      <Input label="PAN" value={values.panNumber} onChange={(e) => set('panNumber', e.target.value)} />
      <Input label="Bank name" value={values.bankName} onChange={(e) => set('bankName', e.target.value)} />
      <Input
        label="Account number"
        value={values.bankAccountNumber}
        onChange={(e) => set('bankAccountNumber', e.target.value)}
      />
      <Input label="Bank branch" value={values.bankBranch} onChange={(e) => set('bankBranch', e.target.value)} />
      <label className="flex items-center gap-2 sm:col-span-2">
        <input
          type="checkbox"
          checked={Boolean(values.payrollEligible)}
          onChange={(e) => set('payrollEligible', e.target.checked)}
          className="h-4 w-4 rounded"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Include in platform payroll runs</span>
      </label>
    </div>
  )
}
