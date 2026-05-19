import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from '@utils/toast'
import {
  FiArchive,
  FiCheckCircle,
  FiCloud,
  FiDatabase,
  FiDownload,
  FiRefreshCw,
  FiShield,
  FiTrash2,
  FiTerminal,
  FiUpload,
} from 'react-icons/fi'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { backupApi } from '../../services/backupApi'
import { useAuth } from '../../hooks/useAuth'
import { useSocket } from '../../hooks/useSocket'

const WIZARD_STEPS = [
  { id: 'upload', title: 'Upload Backup' },
  { id: 'verify', title: 'Verify Backup' },
  { id: 'preview', title: 'Preview Backup' },
  { id: 'mode', title: 'Restore Mode' },
  { id: 'conflicts', title: 'Resolve Conflicts' },
  { id: 'confirm', title: 'Confirm Restore' },
  { id: 'progress', title: 'Migration Progress' },
  { id: 'complete', title: 'Restore Complete' },
]

const PARTIAL_GROUPS = [
  { id: 'menu', label: 'Menu' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'customers', label: 'Customers & orders' },
  { id: 'employees', label: 'Employees' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'settings', label: 'Settings' },
  { id: 'branches', label: 'Branches' },
  { id: 'tables', label: 'Tables & QR' },
]

const MODES = [
  { id: 'merge', label: 'Merge', desc: 'Add backup data alongside existing records' },
  { id: 'replace', label: 'Replace', desc: 'Remove matching tenant data then restore (requires OTP)' },
  { id: 'partial', label: 'Partial', desc: 'Restore only selected sections' },
  { id: 'migration', label: 'Migration', desc: 'Import backup from another lost restaurant account (requires OTP)' },
  { id: 'create_new_branch', label: 'New branch', desc: 'Restore into a newly created branch' },
]

const CONFLICTS = [
  { id: 'rename', label: 'Rename automatically' },
  { id: 'skip', label: 'Skip duplicates' },
  { id: 'replace', label: 'Replace existing' },
  { id: 'duplicate', label: 'Allow duplicates with new names' },
]

function formatSize(bytes = 0) {
  const n = Number(bytes || 0)
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(n / 1024))} KB`
}

const BackupRecovery = () => {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const queryClient = useQueryClient()
  const restaurantId = user?.restaurantId || user?.id

  const [wizardStep, setWizardStep] = useState(0)
  const [file, setFile] = useState(null)
  const [validated, setValidated] = useState(null)
  const [preview, setPreview] = useState(null)
  const [mode, setMode] = useState('merge')
  const [partialGroups, setPartialGroups] = useState(['menu', 'inventory', 'employees'])
  const [conflictStrategy, setConflictStrategy] = useState('rename')
  const [otp, setOtp] = useState('')
  const [otpId, setOtpId] = useState(null)
  const [otpVerified, setOtpVerified] = useState(false)
  const [activeJob, setActiveJob] = useState(null)
  const [progress, setProgress] = useState(null)
  const [busy, setBusy] = useState(false)

  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['backup-dashboard'],
    queryFn: async () => {
      const res = await backupApi.getHistory()
      return res.data?.data
    },
  })

  const needsOtp = ['replace', 'migration', 'full'].includes(mode)

  useEffect(() => {
    if (!socket || !restaurantId) return
    socket.emit('join:restaurant', restaurantId)
    const onProgress = (payload) => {
      if (activeJob && payload.jobId === String(activeJob._id)) {
        setProgress(payload)
      }
    }
    const onComplete = (payload) => {
      if (activeJob && payload.jobId === String(activeJob._id)) {
        setProgress({ percent: 100, currentLabel: 'Restore complete' })
        setWizardStep(7)
        refetch()
        queryClient.invalidateQueries({ queryKey: ['backup-dashboard'] })
        toast.success('Migration restore completed')
      }
    }
    const onFailed = (payload) => {
      if (activeJob && payload.jobId === String(activeJob._id)) {
        toast.error(payload.message || 'Restore failed')
      }
    }
    socket.on('backup:restore_progress', onProgress)
    socket.on('backup:restore_complete', onComplete)
    socket.on('backup:restore_failed', onFailed)
    return () => {
      socket.off('backup:restore_progress', onProgress)
      socket.off('backup:restore_complete', onComplete)
      socket.off('backup:restore_failed', onFailed)
    }
  }, [socket, restaurantId, activeJob, refetch, queryClient])

  const buildFormData = useCallback(() => {
    const form = new FormData()
    if (file) form.append('backup', file)
    form.append('mode', mode)
    form.append('conflictStrategy', conflictStrategy)
    form.append('async', 'true')
    if (otpId) form.append('otpId', otpId)
    if (mode === 'partial') form.append('partialGroups', JSON.stringify(partialGroups))
    return form
  }, [file, mode, conflictStrategy, otpId, partialGroups])

  const runValidate = async () => {
    if (!file) return toast.error('Select a .qrbackup file')
    try {
      setBusy(true)
      const res = await backupApi.validateBackup(buildFormData())
      setValidated(res.data?.data)
      if (res.data?.data?.crossTenant) {
        toast('This backup belongs to another restaurant — use Migration mode', { icon: 'ℹ️' })
      }
      setWizardStep(2)
      toast.success('Backup verified')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Validation failed')
    } finally {
      setBusy(false)
    }
  }

  const runPreview = async () => {
    try {
      setBusy(true)
      const res = await backupApi.previewBackup(buildFormData())
      setPreview(res.data?.data)
      setWizardStep(3)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Preview failed')
    } finally {
      setBusy(false)
    }
  }

  const requestOtp = async () => {
    try {
      setBusy(true)
      const res = await backupApi.requestRestoreOtp({ purpose: mode === 'migration' ? 'migration' : 'restore' })
      setOtpId(res.data?.data?.otpId)
      toast.success(res.data?.data?.emailSent ? 'Verification code sent to your email' : 'Check server logs for OTP (dev)')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send OTP')
    } finally {
      setBusy(false)
    }
  }

  const verifyOtp = async () => {
    if (!otp) return toast.error('Enter the verification code')
    try {
      setBusy(true)
      await backupApi.verifyRestoreOtp({ otp, purpose: mode === 'migration' ? 'migration' : 'restore' })
      setOtpVerified(true)
      toast.success('Email verified')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Invalid code')
    } finally {
      setBusy(false)
    }
  }

  const startRestore = async () => {
    if (needsOtp && !otpVerified) return toast.error('Verify email OTP first')
    if (!window.confirm(`Start ${mode} migration restore?`)) return
    try {
      setBusy(true)
      const res = await backupApi.startRestore(buildFormData())
      const job = res.data?.data?.job
      setActiveJob(job)
      setWizardStep(6)
      pollJob(job._id)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to start restore')
    } finally {
      setBusy(false)
    }
  }

  const pollJob = (jobId) => {
    const interval = setInterval(async () => {
      try {
        const res = await backupApi.getRestoreJob(jobId)
        const job = res.data?.data
        setActiveJob(job)
        if (job.progress) setProgress(job.progress)
        if (['completed', 'failed', 'cancelled'].includes(job.status)) {
          clearInterval(interval)
          if (job.status === 'completed') setWizardStep(7)
          if (job.status === 'failed') toast.error(job.failureReason || 'Restore failed')
        }
      } catch {
        clearInterval(interval)
      }
    }, 2000)
  }

  const createBackup = async (type = 'full') => {
    try {
      setBusy(true)
      await backupApi.createBackup({ type })
      toast.success('Backup created')
      refetch()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Backup failed')
    } finally {
      setBusy(false)
    }
  }

  const downloadBackup = async (id) => {
    try {
      const res = await backupApi.downloadBackup(id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-${id}.qrbackup`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed')
    }
  }

  const summary = preview?.summary || validated?.preview?.summary

  const stepContent = useMemo(() => {
    switch (wizardStep) {
      case 0:
        return (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <label
              htmlFor="qrbackup-file"
              className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-8 dark:border-gray-700 dark:bg-gray-950"
            >
              <FiUpload className="h-8 w-8 text-primary-600" />
              <span className="mt-2 font-bold text-gray-900 dark:text-gray-100">Upload .qrbackup file</span>
              <span className="mt-1 text-sm text-gray-500">{file?.name || 'Encrypted migration-safe archive'}</span>
              <input
                id="qrbackup-file"
                type="file"
                accept=".qrbackup,.qrbak"
                className="sr-only"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null)
                  setValidated(null)
                  setPreview(null)
                  setOtpVerified(false)
                }}
              />
            </label>
            <Button type="button" onClick={() => setWizardStep(1)} disabled={!file}>
              Continue to verification
            </Button>
          </motion.div>
        )
      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Validates encryption, signatures, checksums, schema version, and archive safety limits.
            </p>
            <Button type="button" onClick={runValidate} disabled={busy}>
              Verify integrity
            </Button>
          </div>
        )
      case 2:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {validated?.valid && (
              <div className="rounded-lg bg-accent-50 px-4 py-3 text-sm text-accent-800 dark:bg-gray-800 dark:text-accent-200">
                Backup is valid and ready for migration preview.
              </div>
            )}
            <Button type="button" onClick={runPreview} disabled={busy}>
              Generate preview
            </Button>
          </motion.div>
        )
      case 3:
        return (
          <motion.div className="space-y-4">
            {summary && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              >
                {[
                  ['Menu items', (preview?.counts?.menuItems || 0) + (preview?.counts?.categories || 0)],
                  ['Orders', summary.orderCount],
                  ['Inventory', summary.inventoryCount],
                  ['Employees', summary.employeeCount],
                  ['Branches', summary.branchCount],
                  ['Backup date', summary.backupDate ? new Date(summary.backupDate).toLocaleDateString() : '—'],
                ].map(([label, value]) => (
                  <motion.div
                    key={label}
                    whileHover={{ scale: 1.02 }}
                    className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-950"
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
                    <p className="mt-1 text-lg font-black text-gray-900 dark:text-gray-100">{value}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
            <Button type="button" onClick={() => setWizardStep(4)}>
              Choose restore mode
            </Button>
          </motion.div>
        )
      case 4:
        return (
          <motion.div className="space-y-4">
            <motion.div layout className="grid gap-2">
              {MODES.map((m) => (
                <motion.button
                  key={m.id}
                  type="button"
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setMode(m.id)}
                  className={`rounded-lg border px-4 py-3 text-left ${
                    mode === m.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <p className="font-bold text-gray-900 dark:text-gray-100">{m.label}</p>
                  <p className="text-sm text-gray-500">{m.desc}</p>
                </motion.button>
              ))}
            </motion.div>
            {mode === 'partial' && (
              <div className="flex flex-wrap gap-2">
                {PARTIAL_GROUPS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() =>
                      setPartialGroups((prev) =>
                        prev.includes(g.id) ? prev.filter((x) => x !== g.id) : [...prev, g.id],
                      )
                    }
                    className={`rounded-full px-3 py-1 text-sm font-bold ${
                      partialGroups.includes(g.id)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            )}
            <Button type="button" onClick={() => setWizardStep(5)}>
              Conflict resolution
            </Button>
          </motion.div>
        )
      case 5:
        return (
          <div className="space-y-4">
            <select
              value={conflictStrategy}
              onChange={(e) => setConflictStrategy(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            >
              {CONFLICTS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            {needsOtp && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                <p className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-100">
                  <FiShield /> Email verification required
                </p>
                <motion.div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={requestOtp} disabled={busy}>
                    Send OTP
                  </Button>
                  <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" className="max-w-[140px]" />
                  <Button type="button" size="sm" onClick={verifyOtp} disabled={busy}>
                    Verify
                  </Button>
                </motion.div>
                {otpVerified && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-green-700">
                    <FiCheckCircle /> Verified
                  </p>
                )}
              </div>
            )}
            <Button type="button" onClick={() => setWizardStep(6)}>
              Review & confirm
            </Button>
          </div>
        )
      case 6:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Mode: <strong>{mode}</strong> · Conflicts: <strong>{conflictStrategy}</strong>
              {needsOtp && ' · OTP verified'}
            </p>
            <Button type="button" onClick={startRestore} disabled={busy || (needsOtp && !otpVerified)}>
              Start migration restore
            </Button>
          </div>
        )
      case 7:
        return (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
            <FiCheckCircle className="mx-auto h-16 w-16 text-green-600" />
            <h3 className="mt-4 text-xl font-bold">Migration complete</h3>
            <p className="mt-2 text-gray-500">New IDs were generated — no raw MongoDB restore was performed.</p>
            <Button type="button" className="mt-6" variant="outline" onClick={() => { setWizardStep(0); setFile(null); setPreview(null) }}>
              Start another recovery
            </Button>
          </motion.div>
        )
      default:
        return null
    }
  }, [wizardStep, file, validated, preview, summary, mode, partialGroups, conflictStrategy, otp, otpVerified, busy, needsOtp])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-6xl space-y-6 p-4">
      <motion.div initial={{ y: -8 }} animate={{ y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Backup & Recovery</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Enterprise migration-safe backups · AES-256 · tenant isolation · {isConnected ? 'live progress' : 'connecting…'}
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Recovery Wizard" icon={FiShield}>
            <div className="mb-6 flex flex-wrap gap-1">
              {WIZARD_STEPS.map((s, i) => (
                <motion.button
                  key={s.id}
                  type="button"
                  onClick={() => i <= wizardStep && setWizardStep(i)}
                  className={`rounded-full px-2 py-1 text-xs font-bold ${
                    i === wizardStep ? 'bg-primary-600 text-white' : i < wizardStep ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i + 1}
                </motion.button>
              ))}
            </div>
            <h2 className="mb-4 text-lg font-bold">{WIZARD_STEPS[wizardStep]?.title}</h2>
            <AnimatePresence mode="wait">{stepContent}</AnimatePresence>
            {wizardStep === 6 && progress && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <motion.div
                    className="h-full bg-primary-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percent || 0}%` }}
                  />
                </div>
                <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {progress.currentLabel || progress.currentStep || 'Processing…'}
                </p>
              </motion.div>
            )}
          </Card>
        </div>

        <motion.div initial={{ x: 12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
          <Card
            title="Quick actions"
            icon={FiArchive}
            actions={
              <Button type="button" size="sm" variant="outline" onClick={() => refetch()} disabled={busy}>
                <FiRefreshCw className="h-4 w-4" />
              </Button>
            }
          >
            <div className="flex flex-col gap-2">
              <Button type="button" onClick={() => createBackup('full')} disabled={busy}>
                Full backup
              </Button>
              <Button type="button" variant="secondary" onClick={() => createBackup('partial')} disabled={busy}>
                Partial backup
              </Button>
            </div>
          </Card>

          <Card title="Backup history" icon={FiDatabase}>
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
                {(dashboard?.backups || []).slice(0, 12).map((b) => (
                  <li key={b._id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-2 py-2 dark:bg-gray-950">
                    <span className="font-medium capitalize">{b.type}</span>
                    <span className="text-gray-500">{formatSize(b.size)}</span>
                    <motion.div className="flex gap-1" whileHover={{ scale: 1.05 }}>
                      <button type="button" onClick={() => downloadBackup(b._id)} className="p-1 text-primary-600">
                        <FiDownload />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm('Delete backup?')) return
                          await backupApi.deleteBackup(b._id)
                          refetch()
                        }}
                        className="p-1 text-red-600"
                      >
                        <FiTrash2 />
                      </button>
                    </motion.div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Cloud & schedules" icon={FiCloud}>
            <p className="text-sm text-gray-500">
              {(dashboard?.schedules || []).filter((s) => s.isActive).length} active schedule(s)
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {['daily', 'weekly', 'monthly'].map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant="outline"
                  onClick={() => backupApi.saveSchedule({ frequency: f, backupType: 'snapshot', isActive: true }).then(() => { toast.success('Schedule saved'); refetch() })}
                >
                  {f}
                </Button>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {(dashboard?.jobs?.length > 0 || dashboard?.audits?.length > 0) && (
        <Card title="Restore logs & audits" icon={FiTerminal}>
          <motion.div layout className="grid gap-4 md:grid-cols-2">
            <motion.div>
              <p className="mb-2 text-xs font-bold uppercase text-gray-400">Recent jobs</p>
              <ul className="space-y-1 text-sm">
                {(dashboard?.jobs || []).slice(0, 8).map((j) => (
                  <li key={j._id} className="flex justify-between rounded bg-gray-50 px-2 py-1 dark:bg-gray-950">
                    <span className="capitalize">{j.mode}</span>
                    <span className={j.status === 'completed' ? 'text-green-600' : j.status === 'failed' ? 'text-red-600' : ''}>{j.status}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div>
              <p className="mb-2 text-xs font-bold uppercase text-gray-400">Audit trail</p>
              <ul className="space-y-1 text-sm">
                {(dashboard?.audits || []).slice(0, 8).map((a) => (
                  <li key={a._id} className="rounded bg-gray-50 px-2 py-1 dark:bg-gray-950">
                    <span className="font-medium">{a.action}</span>
                    <span className="ml-2 text-gray-400">{new Date(a.createdAt).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </Card>
      )}
    </motion.div>
  )
}

export default BackupRecovery
