import React, { useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiBarChart2, FiEdit2, FiMapPin, FiPlus, FiRefreshCw, FiTrash2, FiUsers } from 'react-icons/fi'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import toast from '@utils/toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import { useBranch } from '../../context/BranchContext'
import { money } from './finance/FinanceUI'

const OTP_RESEND_COOLDOWN_SEC = 60

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
  address: '',
  city: '',
  state: '',
  country: 'Nepal',
  status: 'active',
  taxNumber: '',
  branchUsername: '',
  branchPassword: '',
  autoGeneratePassword: true,
  ownerEmail: '',
  ownerOtp: '',
  enabledModules: {},
}

function BranchEditForm({ initial, onSubmit, onClose, saving }) {
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
        <Input label="Branch code (optional)" value={form.branchCode} onChange={set('branchCode')} disabled placeholder="Auto if empty" />
        <Input label="Branch manager name" value={form.branchManagerName || ''} onChange={set('branchManagerName')} />
        <Input label="Phone" value={form.phone || ''} onChange={set('phone')} />
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
        <Button type="submit" loading={saving}>Save branch</Button>
      </div>
    </form>
  )
}

function CreateBranchWizard({
  form,
  setForm,
  step,
  onStepBack,
  saving,
  otpSending,
  verifySending,
  resendCooldown,
  devOtpHint,
  otpExpiresMinutes,
  onRequestOwnerOtp,
  onVerifyOtp,
  onSubmitCreate,
  onClose,
}) {
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

  if (step === 1) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 via-white to-amber-50 px-4 py-4 shadow-sm dark:border-primary-900/50 dark:from-primary-950/30 dark:via-gray-900 dark:to-gray-900">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-sm font-black text-white shadow-md shadow-primary-900/20">1</span>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-primary-800 dark:text-primary-200">Step 1 / 2 - Verify owner</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">Branch basics and Gmail verification</p>
            </div>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            Enter branch basics and the owner&apos;s Gmail. We send a one-time code to that inbox (check spam). After you verify the code, step 2 opens for portal login, address, and modules.
          </p>
        </div>
        {devOtpHint ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
            <strong>Development only:</strong> SMTP is not configured on the server. Your verification code is{' '}
            <span className="font-mono text-lg font-black tracking-widest">{devOtpHint}</span>
            . In production, configure <span className="font-mono">SMTP_USER</span> and <span className="font-mono">SMTP_PASS</span>.
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Branch name" value={form.name} onChange={set('name')} required />
          <Input label="Branch code (optional)" value={form.branchCode} onChange={set('branchCode')} placeholder="Auto if empty" />
          <div className="md:col-span-2">
            <Input label="Branch manager name" value={form.branchManagerName || ''} onChange={set('branchManagerName')} />
          </div>
          <div className="md:col-span-2">
            <Input
              label="Branch owner Gmail (@gmail.com)"
              type="email"
              value={form.ownerEmail || ''}
              onChange={set('ownerEmail')}
              placeholder="owner@gmail.com"
              required
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Input
              label="Verification code from Gmail"
              value={form.ownerOtp || ''}
              onChange={set('ownerOtp')}
              placeholder="6-digit code"
              autoComplete="one-time-code"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            loading={otpSending}
            disabled={resendCooldown > 0 && !otpSending}
            onClick={() => onRequestOwnerOtp(form.ownerEmail)}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Send code'}
          </Button>
          <Button
            type="button"
            className="shrink-0"
            loading={verifySending}
            onClick={onVerifyOtp}
          >
            Verify code
          </Button>
        </div>
        {otpExpiresMinutes != null && otpExpiresMinutes > 0 && !devOtpHint ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Each code is valid for about {otpExpiresMinutes} minutes. You can resend after the timer on the button.
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmitCreate()
      }}
    >
      <div className="rounded-2xl border border-surface-200 bg-gradient-to-br from-white to-surface-50 p-4 text-sm shadow-sm dark:border-gray-700 dark:from-gray-900 dark:to-gray-800/50">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-sm font-black text-white shadow-md shadow-primary-900/20">2</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-primary-700 dark:text-primary-300">Step 2 / 2 - Branch details</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Owner Gmail is already verified. Finish portal access, contact info, and modules below.</p>
          </div>
        </div>
        <p className="mt-3 font-bold text-gray-900 dark:text-gray-100">Summary from step 1</p>
        <ul className="mt-2 space-y-1 text-gray-600 dark:text-gray-300">
          <li><span className="font-semibold">Branch:</span> {form.name || '—'}</li>
          {form.branchCode && <li><span className="font-semibold">Code:</span> {form.branchCode}</li>}
          {form.branchManagerName && <li><span className="font-semibold">Manager:</span> {form.branchManagerName}</li>}
          <li><span className="font-semibold">Owner Gmail:</span> {form.ownerEmail || '—'}</li>
        </ul>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onStepBack}>
          <FiArrowLeft className="mr-1 inline h-4 w-4" />
          Back to step 1
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input label="Custom branch username" value={form.branchUsername} onChange={set('branchUsername')} placeholder="e.g. pokhara (becomes …@branch.com)" />
        <label className="flex items-center gap-2 self-end text-sm font-semibold text-gray-700 dark:text-gray-200 md:pb-2">
          <input
            type="checkbox"
            checked={Boolean(form.autoGeneratePassword)}
            onChange={(e) => setForm((c) => ({ ...c, autoGeneratePassword: e.target.checked }))}
          />
          Auto-generate secure password
        </label>
        {!form.autoGeneratePassword && (
          <div className="md:col-span-2">
            <Input label="Branch password" type="password" value={form.branchPassword} onChange={set('branchPassword')} />
          </div>
        )}
        <Input label="Phone" value={form.phone || ''} onChange={set('phone')} />
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
        <Button type="submit" loading={saving}>Create branch</Button>
      </div>
    </form>
  )
}

const Branches = () => {
  const { branches, reloadBranches, selectedBranch: currentBranch } = useBranch()
  const [reportBranchId, setReportBranchId] = useState('')
  const [modalBranch, setModalBranch] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analytics, setAnalytics] = useState({})
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [credentials, setCredentials] = useState(null)
  const [activity, setActivity] = useState([])
  const [loadingActivity, setLoadingActivity] = useState(false)

  const [otpSending, setOtpSending] = useState(false)
  const [verifySending, setVerifySending] = useState(false)
  const [createStep, setCreateStep] = useState(1)
  const [ownerVerifyToken, setOwnerVerifyToken] = useState('')
  const [createForm, setCreateForm] = useState(() => ({ ...emptyForm }))
  const [resendCooldown, setResendCooldown] = useState(0)
  const [devOtpBanner, setDevOtpBanner] = useState(null)
  const [otpExpiryMinutesHint, setOtpExpiryMinutesHint] = useState(null)

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const id = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [resendCooldown > 0])

  const resetCreateWizard = () => {
    setCreateStep(1)
    setOwnerVerifyToken('')
    setCreateForm({ ...emptyForm })
    setResendCooldown(0)
    setDevOtpBanner(null)
    setOtpExpiryMinutesHint(null)
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalBranch(null)
    resetCreateWizard()
  }

  const openCreateModal = () => {
    setModalBranch(null)
    resetCreateWizard()
    setModalOpen(true)
  }

  useEffect(() => {
    if (!branches.length) return
    const defaultBranch = branches.find((branch) => branch.isDefault) || branches[0]
    setReportBranchId((current) =>
      current && branches.some((branch) => String(branch._id) === String(current))
        ? current
        : String(defaultBranch._id),
    )
  }, [branches])

  const selectedBranch =
    branches.find((branch) => String(branch._id) === String(reportBranchId)) ||
    branches.find((branch) => branch.isDefault) ||
    branches[0]
  const trendData = useMemo(() => analytics.trends || [], [analytics])
  const canManageBranches = !currentBranch || currentBranch.isDefault
  const enabledModuleList = MODULE_DEFS
    .filter(({ key }) => selectedBranch?.isDefault || selectedBranch?.enabledModules?.[key] !== false)
    .map(({ label }) => label)

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

  const requestOwnerOtp = async (ownerEmail) => {
    const e = String(ownerEmail || '').trim().toLowerCase()
    if (!e) {
      toast.error('Enter the branch owner Gmail first.')
      return
    }
    if (!e.endsWith('@gmail.com') && !e.endsWith('@googlemail.com')) {
      toast.error('Branch owner email must be a Gmail address (@gmail.com).')
      return
    }
    try {
      setOtpSending(true)
      const res = await api.post('/restaurant/branches/owner-email/request-otp', { ownerEmail: e }, { skipBranchHeader: true })
      const data = res.data?.data || {}
      setResendCooldown(OTP_RESEND_COOLDOWN_SEC)
      setOtpExpiryMinutesHint(typeof data.expiresInMinutes === 'number' ? data.expiresInMinutes : 10)
      if (data.devOtp) {
        setDevOtpBanner(String(data.devOtp))
        toast.success('Development mode: SMTP is off — use the code shown in the yellow box.', { duration: 8000 })
      } else {
        setDevOtpBanner(null)
        toast.success(
          `Verification code sent to ${e}. Check inbox and spam. Valid for about ${data.expiresInMinutes ?? 10} minutes.`,
          { duration: 6000 },
        )
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send code')
    } finally {
      setOtpSending(false)
    }
  }

  const verifyOwnerOtp = async () => {
    const ownerEmail = String(createForm.ownerEmail || '').trim().toLowerCase()
    const ownerOtp = String(createForm.ownerOtp || '').trim()
    if (!ownerEmail) {
      toast.error('Enter the branch owner Gmail first.')
      return
    }
    if (!ownerOtp) {
      toast.error('Enter the verification code from Gmail.')
      return
    }
    if (!ownerEmail.endsWith('@gmail.com') && !ownerEmail.endsWith('@googlemail.com')) {
      toast.error('Branch owner email must be a Gmail address (@gmail.com).')
      return
    }
    try {
      setVerifySending(true)
      const res = await api.post(
        '/restaurant/branches/owner-email/verify-otp',
        { ownerEmail, ownerOtp },
        { skipBranchHeader: true },
      )
      const tok = res.data?.data?.ownerVerifyToken
      if (!tok) throw new Error('Missing token')
      setOwnerVerifyToken(tok)
      setCreateStep(2)
      setDevOtpBanner(null)
      toast.success('Gmail verified. Continue with branch details.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code')
    } finally {
      setVerifySending(false)
    }
  }

  const saveBranchEdit = async (form) => {
    try {
      setSaving(true)
      const { branchUsername, branchPassword, autoGeneratePassword, ownerEmail, ownerOtp, ...patchBody } = form
      await api.patch(`/restaurant/branches/${modalBranch._id}`, patchBody, { skipBranchHeader: true })
      toast.success('Branch updated')
      closeModal()
      await reloadBranches()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save branch')
    } finally {
      setSaving(false)
    }
  }

  const submitCreateBranch = async () => {
    if (!ownerVerifyToken) {
      toast.error('Verify your Gmail on step 1 first.')
      return
    }
    if (!String(createForm.name || '').trim()) {
      toast.error('Branch name is missing. Go back to step 1.')
      return
    }
    try {
      setSaving(true)
      const ownerEmail = String(createForm.ownerEmail || '').trim().toLowerCase()
      const payload = {
        name: createForm.name,
        branchCode: createForm.branchCode,
        branchManagerName: createForm.branchManagerName,
        ownerEmail,
        ownerVerifyToken,
        phone: createForm.phone,
        address: createForm.address,
        city: createForm.city,
        state: createForm.state,
        country: createForm.country,
        taxNumber: createForm.taxNumber,
        status: createForm.status,
        branchUsername: createForm.branchUsername,
        branchPassword: createForm.branchPassword,
        autoGeneratePassword: createForm.autoGeneratePassword,
        enabledModules: MODULE_DEFS.reduce((acc, { key }) => {
          acc[key] = createForm.enabledModules?.[key] !== false
          return acc
        }, {}),
      }
      const res = await api.post('/restaurant/branches', payload, { skipBranchHeader: true })
      const cred = res.data?.data?.credentials
      if (cred) setCredentials(cred)
      toast.success('Branch created')
      closeModal()
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
        {canManageBranches ? (
          <Button onClick={openCreateModal}>
            <FiPlus className="mr-2 h-4 w-4" /> Add branch
          </Button>
        ) : (
          <span className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
            Main branch permission required
          </span>
        )}
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
                onClick={() => setReportBranchId(String(branch._id))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setReportBranchId(String(branch._id))
                  }
                }}
                className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-surface-50 dark:hover:bg-gray-800 ${
                  String(reportBranchId) === String(branch._id) ? 'bg-primary-50/70 dark:bg-gray-800' : ''
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
                  {canManageBranches && !branch.isDefault && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setModalBranch(branch); setModalOpen(true) }} className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-primary-700 dark:hover:bg-gray-900">
                      <FiEdit2 />
                    </button>
                  )}
                  {canManageBranches && !branch.isDefault && (
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
        <div className="flex flex-col gap-2 border-b border-surface-100 pb-4 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-primary-700 dark:text-primary-300">Report section</p>
            <h2 className="mt-1 text-xl font-black text-gray-950 dark:text-gray-100">{selectedBranch?.name || 'Branch'} report</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Selecting a branch here only changes this report. It does not switch your whole system branch.
            </p>
          </div>
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold capitalize ${selectedBranch?.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {selectedBranch?.status || 'unknown'}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-surface-50 p-4 dark:bg-gray-800/50">
            <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">Branch details</p>
            <dl className="mt-3 space-y-2 text-sm">
              <ReportRow label="Public ID" value={selectedBranch?.publicBranchId || selectedBranch?._id} />
              <ReportRow label="Slug" value={selectedBranch?.slug} />
              <ReportRow label="Manager" value={selectedBranch?.branchManagerName} />
              <ReportRow label="Phone" value={selectedBranch?.phone} />
              <ReportRow label="Tax number" value={selectedBranch?.taxNumber} />
            </dl>
          </div>

          <div className="rounded-2xl bg-surface-50 p-4 dark:bg-gray-800/50">
            <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">Location</p>
            <dl className="mt-3 space-y-2 text-sm">
              <ReportRow label="Address" value={selectedBranch?.address} />
              <ReportRow label="City" value={selectedBranch?.city} />
              <ReportRow label="State" value={selectedBranch?.state} />
              <ReportRow label="Country" value={selectedBranch?.country} />
            </dl>
          </div>

          <div className="rounded-2xl bg-surface-50 p-4 dark:bg-gray-800/50">
            <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">Performance</p>
            <dl className="mt-3 space-y-2 text-sm">
              <ReportRow label="Revenue" value={money(summary.revenue)} />
              <ReportRow label="Employees" value={summary.employees || 0} />
              <ReportRow label="Inventory value" value={money(summary.inventoryValue)} />
              <ReportRow label="Orders" value={summary.orders || summary.totalOrders || 0} />
            </dl>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-surface-100 p-4 dark:border-gray-800">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">Enabled modules</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {enabledModuleList.map((label) => (
              <span key={label} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 dark:bg-primary-950/30 dark:text-primary-200">
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

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

      <Modal isOpen={modalOpen} onClose={closeModal} title={modalBranch?._id ? 'Edit branch' : createStep === 1 ? 'Create branch (1 / 2)' : 'Create branch (2 / 2)'} size="lg">
        <div className="p-6">
          {modalBranch?._id ? (
            <BranchEditForm
              initial={modalBranch}
              saving={saving}
              onClose={closeModal}
              onSubmit={saveBranchEdit}
            />
          ) : (
            <CreateBranchWizard
              form={createForm}
              setForm={setCreateForm}
              step={createStep}
              onStepBack={() => {
                setCreateStep(1)
                setOwnerVerifyToken('')
                setResendCooldown(0)
                setCreateForm((c) => ({ ...c, ownerOtp: '' }))
              }}
              saving={saving}
              otpSending={otpSending}
              verifySending={verifySending}
              resendCooldown={resendCooldown}
              devOtpHint={devOtpBanner}
              otpExpiresMinutes={otpExpiryMinutesHint}
              onRequestOwnerOtp={requestOwnerOtp}
              onVerifyOtp={verifyOwnerOtp}
              onSubmitCreate={submitCreateBranch}
              onClose={closeModal}
            />
          )}
        </div>
      </Modal>

      <Modal isOpen={Boolean(credentials)} onClose={() => setCredentials(null)} title="Branch login credentials" size="md">
        <div className="space-y-3 p-6 text-sm">
          <p className="text-gray-600 dark:text-gray-300">Share these credentials with the branch manager. The password is shown only once.</p>
          {credentials && (
            <div className="rounded-xl bg-surface-50 p-4 font-mono text-xs dark:bg-gray-800">
              <p><span className="font-sans font-bold">Branch owner Gmail:</span> {credentials.ownerEmail || '—'}</p>
              <p><span className="font-sans font-bold">Restaurant ID (sign-in):</span> {credentials.publicRestaurantId || credentials.restaurantId}</p>
              <p><span className="font-sans font-bold">Branch login email:</span> {credentials.branchEmail || '—'}</p>
              <p><span className="font-sans font-bold">Branch security key:</span> {credentials.branchPortalKey}</p>
              <p><span className="font-sans font-bold">Public branch ID:</span> {credentials.publicBranchId}</p>
              <p><span className="font-sans font-bold">Branch slug:</span> {credentials.branchSlug}</p>
              <p><span className="font-sans font-bold">Local username:</span> {credentials.username}</p>
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

function ReportRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="min-w-0 break-words text-right font-bold text-gray-900 dark:text-gray-100">
        {value || '-'}
      </dd>
    </div>
  )
}

export default Branches
