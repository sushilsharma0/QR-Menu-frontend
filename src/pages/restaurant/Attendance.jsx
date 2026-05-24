import React, { useEffect, useMemo, useState } from 'react'
import { FiAlertCircle, FiCheckCircle, FiClock, FiLogIn, FiLogOut, FiRefreshCw, FiSearch, FiUsers } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { RestaurantPageLoader } from '../../components/restaurant/RestaurantUI'

const today = () => new Date().toISOString().slice(0, 10)
const toLocalInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
const hoursLabel = (minutes) => {
  const total = Math.max(0, Number(minutes || 0))
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h}h ${m}m`
}

const statusStyles = {
  present: 'bg-emerald-100 text-emerald-800',
  late: 'bg-amber-100 text-amber-800',
  absent: 'bg-red-100 text-red-800',
  half_day: 'bg-sky-100 text-sky-800',
  leave: 'bg-slate-100 text-slate-700',
}

const Attendance = () => {
  const [employees, setEmployees] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [date, setDate] = useState(today())
  const [statusFilter, setStatusFilter] = useState('all')
  const [quickView, setQuickView] = useState('all')
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const [employeeRes, attendanceRes] = await Promise.all([
        api.get('/restaurant/employees'),
        api.get('/restaurant/attendance', { params: { dateFrom: date, dateTo: date, status: statusFilter } }),
      ])
      setEmployees(employeeRes?.data?.data || [])
      setRows(attendanceRes?.data?.data || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [date, statusFilter])

  const rowByEmployee = useMemo(() => {
    const map = new Map()
    rows.forEach((row) => {
      if (row.employee?._id) map.set(String(row.employee._id), row)
    })
    return map
  }, [rows])

  const getWorkState = (row = {}) => {
    if (!row.checkInAt) return 'not_started'
    if (row.checkInAt && !row.checkOutAt) return 'working'
    return 'done'
  }

  const visibleEmployees = employees.filter((employee) => {
    const row = rowByEmployee.get(String(employee._id))
    const q = search.trim().toLowerCase()
    const matchesSearch =
      !q ||
      String(employee.name || '').toLowerCase().includes(q) ||
      String(employee.role || '').toLowerCase().includes(q) ||
      String(employee.username || '').toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || row?.status === statusFilter
    const workState = getWorkState(row)
    const matchesQuickView =
      quickView === 'all' ||
      workState === quickView ||
      (quickView === 'issues' && ['late', 'absent', 'half_day', 'leave'].includes(row?.status))
    return matchesSearch && matchesStatus && matchesQuickView
  })

  const buildPatch = (employee, patch = {}) => {
    const current = rowByEmployee.get(String(employee._id)) || {}
    return {
      employeeId: employee._id,
      shiftDate: date,
      status: patch.status ?? current.status ?? 'present',
      checkInAt: patch.checkInAt ?? toLocalInput(current.checkInAt),
      checkOutAt: patch.checkOutAt ?? toLocalInput(current.checkOutAt),
      breakMinutes: patch.breakMinutes ?? current.breakMinutes ?? 0,
      overtimeMinutes: patch.overtimeMinutes ?? current.overtimeMinutes ?? 0,
      note: patch.note ?? current.note ?? '',
    }
  }

  const metrics = useMemo(() => {
    const present = rows.filter((row) => ['present', 'late'].includes(row.status)).length
    const absent = rows.filter((row) => row.status === 'absent').length
    const working = rows.filter((row) => row.checkInAt && !row.checkOutAt).length
    const minutes = rows.reduce((sum, row) => sum + Number(row.totalMinutes || 0), 0)
    return { present, absent, working, minutes }
  }, [rows])

  const quickViews = [
    { id: 'all', label: 'All', count: employees.length },
    { id: 'not_started', label: 'Not started', count: employees.filter((employee) => !rowByEmployee.get(String(employee._id))?.checkInAt).length },
    { id: 'working', label: 'Working', count: metrics.working },
    { id: 'done', label: 'Done', count: rows.filter((row) => row.checkInAt && row.checkOutAt).length },
    { id: 'issues', label: 'Issues', count: rows.filter((row) => ['late', 'absent', 'half_day', 'leave'].includes(row.status)).length },
  ]

  const saveRow = async (employee, patch = {}) => {
    const current = rowByEmployee.get(String(employee._id)) || {}
    try {
      setSaving(employee._id)
      await api.post('/restaurant/attendance', buildPatch(employee, patch))
      toast.success('Attendance saved')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save attendance')
    } finally {
      setSaving('')
    }
  }

  const quickCheck = async (employee, action) => {
    try {
      setSaving(employee._id)
      await api.post(`/restaurant/attendance/${employee._id}/${action}`, { shiftDate: date })
      toast.success(action === 'check-in' ? 'Checked in' : 'Checked out')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update attendance')
    } finally {
      setSaving('')
    }
  }

  const primaryAction = (row = {}) => {
    if (!row.checkInAt) return { action: 'check-in', label: 'Check in', icon: FiLogIn, className: 'bg-emerald-600 hover:bg-emerald-700' }
    if (!row.checkOutAt) return { action: 'check-out', label: 'Check out', icon: FiLogOut, className: 'bg-slate-900 hover:bg-slate-800' }
    return null
  }

  if (loading) return <RestaurantPageLoader />

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-surface-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary-700">
              <FiClock /> Staff Attendance
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-gray-950">Attendance</h1>
            <p className="mt-1 text-sm text-gray-500">Today’s staff status at a glance, with one-tap check in and check out.</p>
          </div>
          <Button variant="secondary" onClick={fetchData}>
            <FiRefreshCw className="mr-2" /> Refresh
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['Present', metrics.present, FiCheckCircle],
            ['Working now', metrics.working, FiLogIn],
            ['Absent', metrics.absent, FiUsers],
            ['Total hours', hoursLabel(metrics.minutes), FiClock],
          ].map(([label, value, Icon]) => (
            <div key={label} className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-gray-500">{label}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-semibold text-gray-950">{value}</p>
                <Icon className="text-primary-600" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-950">Daily staff board</h2>
            <p className="mt-1 text-sm text-gray-500">Use quick views for the shift. Open Details only when you need to correct a record.</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-[220px_1fr_220px]">
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input icon={FiSearch} label="Search staff" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, role, username" />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500">
                <option value="all">Any status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half day</option>
                <option value="leave">Leave</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickViews.map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => setQuickView(view.id)}
                className={`rounded-full border px-3 py-2 text-sm font-bold transition ${
                  quickView === view.id
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-surface-200 bg-white text-gray-600 hover:border-primary-200 hover:bg-primary-50'
                }`}
              >
                {view.label} <span className="ml-1 opacity-75">{view.count}</span>
              </button>
            ))}
            <span className="ml-auto flex items-center text-sm font-semibold text-gray-500">{visibleEmployees.length} shown</span>
          </div>
        </div>

        <div className="space-y-3">
          {visibleEmployees.map((employee) => {
            const row = rowByEmployee.get(String(employee._id)) || {}
            const isWorking = row.checkInAt && !row.checkOutAt
            const action = primaryAction(row)
            const ActionIcon = action?.icon
            const workState = getWorkState(row)
            return (
              <details key={employee._id} className="group rounded-2xl border border-surface-200 bg-surface-50/60 p-4 open:bg-white open:shadow-sm">
                <summary className="flex cursor-pointer list-none flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                      workState === 'working' ? 'bg-emerald-500' : workState === 'done' ? 'bg-slate-400' : 'bg-amber-400'
                    }`} />
                    <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-gray-950">{employee.name}</p>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold capitalize text-gray-500">{employee.role}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ${statusStyles[row.status || 'present']}`}>
                        {(row.status || 'present').replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-gray-500">
                      <span>In: {row.checkInAt ? new Date(row.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                      <span>Out: {row.checkOutAt ? new Date(row.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                      <span>Hours: {hoursLabel(row.totalMinutes)}</span>
                      {isWorking && <span className="text-emerald-700">Working now</span>}
                    </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {action ? (
                      <button disabled={saving === employee._id} onClick={(e) => { e.preventDefault(); quickCheck(employee, action.action) }} className={`rounded-xl px-4 py-2 text-sm font-bold text-white transition disabled:opacity-50 ${action.className}`}>
                        <ActionIcon className="mr-1 inline" /> {action.label}
                      </button>
                    ) : (
                      <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                        <FiCheckCircle className="mr-1 inline" /> Done
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={saving === employee._id}
                      onClick={(e) => { e.preventDefault(); saveRow(employee, { status: 'absent', checkInAt: '', checkOutAt: '' }) }}
                      className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      <FiAlertCircle className="mr-1 inline" /> Absent
                    </button>
                    <span className="rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs font-bold text-gray-500 group-open:hidden">Details</span>
                  </div>
                </summary>

                <div className="mt-4 grid gap-3 border-t border-surface-200 pt-4 md:grid-cols-2 xl:grid-cols-6">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Status</label>
                    <select value={row.status || 'present'} onChange={(e) => saveRow(employee, { status: e.target.value })} className={`w-full rounded-xl border border-surface-200 px-3 py-2 text-sm font-bold capitalize outline-none ${statusStyles[row.status || 'present']}`}>
                      {Object.keys(statusStyles).map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Check in</label>
                    <input type="datetime-local" value={toLocalInput(row.checkInAt)} onChange={(e) => saveRow(employee, { checkInAt: e.target.value })} className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Check out</label>
                    <input type="datetime-local" value={toLocalInput(row.checkOutAt)} onChange={(e) => saveRow(employee, { checkOutAt: e.target.value })} className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Break min</label>
                    <input type="number" min="0" value={row.breakMinutes || 0} onChange={(e) => saveRow(employee, { breakMinutes: e.target.value })} className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm" />
                  </div>
                  <div className="xl:col-span-2">
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Note</label>
                    <input value={row.note || ''} onChange={(e) => saveRow(employee, { note: e.target.value })} className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm" placeholder="Optional note" />
                  </div>
                </div>
              </details>
            )
          })}
          {visibleEmployees.length === 0 && (
            <div className="rounded-2xl border border-dashed border-surface-300 bg-surface-50 px-5 py-12 text-center">
              <FiUsers className="mx-auto h-9 w-9 text-gray-300" />
              <h3 className="mt-3 text-lg font-semibold text-gray-950">No staff match this view</h3>
              <p className="mt-1 text-sm text-gray-500">Try All, clear search, or choose another status.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Attendance
