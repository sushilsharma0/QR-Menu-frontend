import React from 'react'
import { FiMail, FiUser } from 'react-icons/fi'
import { USER_ROLES } from '../../utils/constants'

const roleLabel = (role) => USER_ROLES[role] || role || '—'

export default function AdminEmployeeDetailsPreview({
  employeeCode,
  name,
  email,
  role = 'admin',
  designation,
  department,
  title = 'Employee record',
}) {
  const rows = [
    { label: 'Employee ID', value: employeeCode || '—' },
    { label: 'Display name', value: name || '—' },
    { label: 'Gmail / login email', value: email || '—', icon: FiMail },
    { label: 'Console role', value: roleLabel(role) },
    { label: 'Designation', value: designation || '—' },
    { label: 'Department', value: department || '—' },
  ]

  return (
    <div className="rounded-2xl border border-surface-200 bg-surface-50/80 p-4 dark:border-gray-800 dark:bg-gray-900/60">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
          <FiUser className="h-4 w-4" />
        </div>
        <p className="text-sm font-black text-gray-900 dark:text-gray-100">{title}</p>
      </div>
      <dl className="grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-white/80 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-950/40">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{row.label}</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
              {row.icon && <row.icon className="h-3.5 w-3.5 shrink-0 text-primary-600 dark:text-primary-400" />}
              <span className="break-all">{row.value}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
