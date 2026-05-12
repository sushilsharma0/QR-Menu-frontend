import React, { useEffect, useMemo, useState } from 'react'
import { FiBarChart2, FiEdit2, FiMapPin, FiPlus, FiRefreshCw, FiTrash2, FiUsers } from 'react-icons/fi'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import { useBranch } from '../../context/BranchContext'
import { money } from './finance/FinanceUI'

const MODULE_DEFS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'orders', label: 'Orders' },
  { key: 'menu', label: 'Menu' },
  { key: 'tables', label: 'Tables' },
  { key: 'pos', label: 'POS' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'accounting', label: 'Accounting' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'promotions', label: 'Promotions' },
  { key: 'employees', label: 'Staff' },
]

const emptyForm = {
  name: '',
  branchCode: '',
  branchManagerName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  country: 'Nepal',
  status: 'active',
  taxNumber: '',
  branchUsername: '',
  branchPassword: '',
  autoGeneratePassword: true,
  enabledModules: {},
}

function BranchForm({ initial, onSubmit, onClose, saving }) {
  const [form, setForm] = useState(() => {
    const base = { ...emptyForm, ...(initial || {}) }
    if (initial?.enabledModules && typeof initial.enabledModules === 'object') {
      base.enabledModules = { ...initial.enabledModules }
    }
    return base
  })
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  const toggleModule = (key) => () =>
    setForm((current) => {
      const prev = current.enabledModules?.[key]
      const on = prev === false ? false : true
      return {
        ...current,
        enabledModules: { ...current.enabledModules, [key]: !on },
      }
    })

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(form)
      }}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input label="Branch name" value={form.name} onChange={set('name')} required />
        <Input label="Branch code (optional)" value={form.branchCode} onChange={set('branchCode')} disabled={Boolean(initial?._id)} placeholder="Auto if empty" />
        <Input label="Branch manager name" value={form.branchManagerName || ''} onChange={set('branchManagerName')} />
        {!initial?._id && (
          <>
            <Input label="Branch login username" value={form.branchUsername} onChange={set('branchUsername')} placeholder="e.g. pokhara_admin" />
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={Boolean(form.autoGeneratePassword)}
                onChange={(e) => setForm((c) => ({ ...c, autoGeneratePassword: e.target.checked }))}
              />
              Auto-generate secure password
            </label>
            {!form.autoGeneratePassword && (
              <Input label="Branch password" type="password" value={form.branchPassword} onChange={set('branchPassword')} />
            )}
          </>
        )}
        <Input label="Phone" value={form.phone || ''} onChange={set('phone')} />
        <Input label="Email" type="email" value={form.email || ''} onChange={set('email')} />
        <Input label="City" value={form.city || ''} onChange={set('city')} />
        <Input label="State" value={form.state || ''} onChange={set('state')} />
        <Input label="Country" value={form.country || ''} onChange={set('country')} />
        <Input label="Tax number" value={form.taxNumber || ''} onChange={set('taxNumber')} />
      </div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
        Status
        <select
          value={form.status}
          onChange={set('status')}
          className="mt-1 w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </label>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Enabled modules (branch portal)</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MODULE_DEFS.map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 rounded-xl border border-surface-200 px-3 py-2 text-sm dark:border-gray-700">
              <input
                type="checkbox"
                checked={form.enabledModules?.[key] !== false}
                onChange={toggleModule(key)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
        Address
        <textarea
          value={form.address || ''}
          onChange={set('address')}
          rows={3}
          className="mt-1 w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={saving}>{initial?._id ? 'Save branch' : 'Create branch'}</Button>
      </div>
    </form>
  )
}

const Branches = () => {
  const { branches, reloadBranches, selectedBranchId, setSelectedBranchId } = useBranch()
  const [modalBranch, setModalBranch] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analytics, setAnalytics] = useState({})
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [credentials, setCredentials] = useState(null)
  const [activity, setActivity] = useState([])
  const [loadingActivity, setLoadingActivity] = useState(false)

  const selectedBranch = branches.find((branch) => String(branch._id) === String(selectedBranchId)) || branches[0]
  const trendData = useMemo(() => analytics.trends || [], [analytics])

  const loadAnalytics = async (branchId = selectedBranch?._id) => {
    if (!branchId) return
    try {
      setLoadingAnalytics(true)
      const res = await api.get(`/restaurant/branches/${branchId}/analytics`, { skipBranchHeader: true })
      setAnalytics(res.data?.data || {})
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load branch analytics')
    } finally {
      setLoadingAnalytics(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [selectedBranch?._id])

  const loadActivity = async (branchId = selectedBranch?._id) => {
    if (!branchId) return
    try {
      setLoadingActivity(true)
      const res = await api.get(`/restaurant/branches/${branchId}/activity`, { skipBranchHeader: true })
      setActivity(res.data?.data?.items || [])
    } catch {
      setActivity([])
    } finally {
      setLoadingActivity(false)
    }
  }

  useEffect(() => {
    loadActivity()
  }, [selectedBranch?._id])

  const saveBranch = async (form) => {
    try {
      setSaving(true)
      if (modalBranch?._id) {
        const { branchUsername, branchPassword, autoGeneratePassword, ...patchBody } = form
        await api.patch(`/restaurant/branches/${modalBranch._id}`, patchBody, { skipBranchHeader: true })
        toast.success('Branch updated')
      } else {
        const payload = {
          ...form,
          enabledModules: MODULE_DEFS.reduce((acc, { key }) => {
            acc[key] = form.enabledModules?.[key] !== false
            return acc
          }, {}),
        }
        const res = await api.post('/restaurant/branches', payload, { skipBranchHeader: true })
        const cred = res.data?.data?.credentials
        if (cred) setCredentials(cred)
        toast.success('Branch created')
      }
      setModalOpen(false)
      setModalBranch(null)
      await reloadBranches()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save branch')
    } finally {
      setSaving(false)
    }
  }

  const deleteBranch = async (branch) => {
    if (!window.confirm(`Delete ${branch.name}?`)) return
    try {
      await api.delete(`/restaurant/branches/${branch._id}`, { skipBranchHeader: true })
      toast.success('Branch deleted')
      await reloadBranches()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete branch')
    }
  }

  const summary = analytics.summary || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-primary-700 dark:text-primary-300">Enterprise</p>
          <h1 className="mt-1 text-3xl font-black text-gray-950 dark:text-gray-100">Branch Management</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Create, switch, monitor, and protect independent branch operations.</p>
        </div>
        <Button onClick={() => { setModalBranch(null); setModalOpen(true) }}>
          <FiPlus className="mr-2 h-4 w-4" /> Add branch
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric icon={FiMapPin} label="Branches" value={branches.length} />
        <Metric icon={FiBarChart2} label="Revenue" value={money(summary.revenue)} />
        <Metric icon={FiUsers} label="Employees" value={summary.employees || 0} />
        <Metric icon={FiRefreshCw} label="Inventory value" value={money(summary.inventoryValue)} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.2fr]">
        <section className="rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-surface-100 px-5 py-4 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-950 dark:text-gray-100">Branch list</h2>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-gray-800">
            {branches.map((branch) => (
              <div
                role="button"
                tabIndex={0}
                key={branch._id}
                onClick={() => setSelectedBranchId(branch._id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedBranchId(branch._id)
                  }
                }}
                className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-surface-50 dark:hover:bg-gray-800 ${
                  String(selectedBranchId) === String(branch._id) ? 'bg-primary-50/70 dark:bg-gray-800' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-black text-gray-950 dark:text-gray-100">{branch.name}</p>
                  <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{branch.city || branch.address || branch.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${branch.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {branch.status}
                  </span>
                  {!branch.isDefault && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setModalBranch(branch); setModalOpen(true) }} className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-primary-700 dark:hover:bg-gray-900">
                      <FiEdit2 />
                    </button>
                  )}
                  {!branch.isDefault && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); deleteBranch(branch) }} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30">
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-950 dark:text-gray-100">{selectedBranch?.name || 'Branch'} analytics</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenue and order trend for selected branch.</p>
            </div>
            {loadingAnalytics && <span className="text-xs font-bold text-gray-400">Loading</span>}
          </div>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="revenue" name="Revenue" fill="#8f2800" radius={[10, 10, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-950 dark:text-gray-100">Branch activity</h2>
          {loadingActivity && <span className="text-xs font-bold text-gray-400">Loading</span>}
        </div>
        <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto text-sm">
          {activity.length === 0 && <li className="text-gray-500">No recent audit events.</li>}
          {activity.map((row) => (
            <li key={`${row._id || row.timestamp}`} className="rounded-xl border border-surface-100 px-3 py-2 dark:border-gray-800">
              <span className="font-bold text-gray-900 dark:text-gray-100">{row.action}</span>
              <span className="text-gray-500 dark:text-gray-400"> · {row.timestamp ? new Date(row.timestamp).toLocaleString() : ''}</span>
              {row.ipAddress && <span className="block text-xs text-gray-400">{row.ipAddress}</span>}
            </li>
          ))}
        </ul>
      </section>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalBranch?._id ? 'Edit branch' : 'Create branch'} size="lg">
        <div className="p-6">
          <BranchForm initial={modalBranch} saving={saving} onClose={() => setModalOpen(false)} onSubmit={saveBranch} />
        </div>
      </Modal>

      <Modal isOpen={Boolean(credentials)} onClose={() => setCredentials(null)} title="Branch login credentials" size="md">
        <div className="space-y-3 p-6 text-sm">
          <p className="text-gray-600 dark:text-gray-300">Share these credentials with the branch manager. The password is shown only once.</p>
          {credentials && (
            <div className="rounded-xl bg-surface-50 p-4 font-mono text-xs dark:bg-gray-800">
              <p><span className="font-sans font-bold">Restaurant id:</span> {credentials.restaurantId}</p>
              <p><span className="font-sans font-bold">Branch security key:</span> {credentials.branchPortalKey}</p>
              <p><span className="font-sans font-bold">Public ID:</span> {credentials.publicBranchId}</p>
              <p><span className="font-sans font-bold">Branch slug:</span> {credentials.branchSlug}</p>
              <p><span className="font-sans font-bold">Username:</span> {credentials.username}</p>
              <p><span className="font-sans font-bold">Password:</span> {credentials.password}</p>
              <p className="mt-2 break-all font-sans text-gray-500">
                Sign-in URL:{' '}
                <span className="font-mono text-gray-700 dark:text-gray-300">
                  {typeof window !== 'undefined' && credentials.loginPath
                    ? `${window.location.origin}${credentials.loginPath}`
                    : credentials.loginPath || ''}
                </span>
              </p>
              <p className="font-sans text-xs text-gray-400">Share this link only with branch staff. It includes your outlet id and a secret key.</p>
            </div>
          )}
          <Button variant="outline" className="w-full" onClick={() => setCredentials(null)}>Close</Button>
        </div>
      </Modal>
    </div>
  )
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-2 truncate text-2xl font-black text-gray-950 dark:text-gray-100">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-700 text-white">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export default Branches
