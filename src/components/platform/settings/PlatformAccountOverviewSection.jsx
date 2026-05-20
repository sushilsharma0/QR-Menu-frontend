import React, { useEffect, useState } from 'react'
import toast from '@utils/toast'
import api from '../../../services/api'
import Card from '../../common/Card'
import Button from '../../common/Button'
import { FiClock, FiCopy, FiShield } from 'react-icons/fi'

function formatDt(value) {
  if (value == null) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function PlatformAccountOverviewSection() {
  const [loading, setLoading] = useState(true)
  const [row, setRow] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const res = await api.get('/platform/auth/profile')
        const data = res.data?.data
        if (!cancelled && data) setRow(data)
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load account overview')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const copyId = async () => {
    if (!row?.id) return
    try {
      await navigator.clipboard.writeText(String(row.id))
      toast.success('Platform user ID copied')
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!row) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Nothing to show.</p>
  }

  const items = [
    { label: 'Platform user ID', value: String(row.id), mono: true, action: copyId },
    { label: 'Employee ID', value: row.employeeCode ? String(row.employeeCode) : '—', mono: true },
    { label: 'Account status', value: row.isActive ? 'Active' : 'Inactive' },
    { label: 'Member since', value: formatDt(row.createdAt) },
    { label: 'Last sign-in', value: formatDt(row.lastLogin) },
    { label: 'Profile last updated', value: formatDt(row.updatedAt) },
  ]

  return (
    <Card title="Account overview" icon={FiShield}>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Read-only identifiers and session metadata. Share the platform user ID with support when reporting an issue.
      </p>
      <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              {item.label === 'Last sign-in' && <FiClock className="h-3.5 w-3.5" aria-hidden />}
              {item.label}
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:max-w-[70%]">
              <span
                className={`break-all text-right text-sm font-semibold text-gray-900 dark:text-gray-100 ${item.mono ? 'font-mono text-xs sm:text-sm' : ''}`}
              >
                {item.value}
              </span>
              {item.action && (
                <Button type="button" variant="outline" size="sm" onClick={item.action} title="Copy platform user ID">
                  <FiCopy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
