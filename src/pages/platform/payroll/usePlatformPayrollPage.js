import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import toast from '@utils/toast'
import api from '../../../services/api'
import { AuthContext } from '../../../context/AuthContext'
import { adPayrollMonthYearToBs } from '../../../utils/nepaliDateFormat'
import { currentMonthDays } from '../../restaurant/finance/payroll/payrollUtils'
import { usePlatformPageLoad } from '../../../hooks/usePlatformPageLoad'

const API = '/platform/payroll'

export function usePlatformPayrollPage() {
  const { user } = useContext(AuthContext)
  const slipRef = useRef(null)

  const [month, setMonth] = useState(() => new Date().getMonth() + 1)
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [monthCount, setMonthCount] = useState(1)
  const [data, setData] = useState({ items: [], summary: null })
  const [history, setHistory] = useState([])
  const [generating, setGenerating] = useState(false)
  const [savingModal, setSavingModal] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState(null)
  const [payrollModal, setPayrollModal] = useState(null)
  const [modalForm, setModalForm] = useState(null)
  const [modalProfile, setModalProfile] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [staffDirectory, setStaffDirectory] = useState([])
  const [staffPickId, setStaffPickId] = useState('')
  const [defaults, setDefaults] = useState(() => {
    const now = new Date()
    const currentMonthWorkingDays = currentMonthDays(now.getFullYear(), now.getMonth() + 1)

    return {
      workingDays: currentMonthWorkingDays,
      presentDays: currentMonthWorkingDays,
      absentDays: 0,
      lateDays: 0,
      latePenalty: 0,
      overtimeHours: 0,
      overtimeRate: 0,
      festivalBonus: 0,
      performanceBonus: 0,
    }
  })
  const [statutory, setStatutory] = useState(null)
  const [statutorySaving, setStatutorySaving] = useState(false)
  const [statsYear, setStatsYear] = useState(() => new Date().getFullYear())
  const [summaryMonthFrom, setSummaryMonthFrom] = useState(1)
  const [summaryMonthTo, setSummaryMonthTo] = useState(12)
  const [summaryEmployeeId, setSummaryEmployeeId] = useState('')
  const [summarySearch, setSummarySearch] = useState('')
  const [employeeSummary, setEmployeeSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const company = useMemo(
    () => ({
      name: 'QR Menu SaaS — Platform',
      address: 'Internal payroll',
      city: 'Nepal',
    }),
    [],
  )

  const payrollPeriodBs = useMemo(() => adPayrollMonthYearToBs(month, year), [month, year])
  const payrollPeriodAdIso = useMemo(() => `${year}-${String(month).padStart(2, '0')}-15`, [year, month])

  const onPayrollPeriodDateChange = useCallback((e) => {
    const v = e?.target?.value
    if (!v) return
    const [y, m] = v.split('-').map(Number)
    if (y && m >= 1 && m <= 12) {
      setYear(y)
      setMonth(m)
    }
  }, [])

  const insightsPayrollPeriodBs = useMemo(
    () => adPayrollMonthYearToBs(summaryMonthFrom, statsYear),
    [summaryMonthFrom, statsYear],
  )
  const insightsPeriodAdIso = useMemo(
    () => `${statsYear}-${String(summaryMonthFrom).padStart(2, '0')}-15`,
    [statsYear, summaryMonthFrom],
  )

  const onInsightsPayPeriodChange = useCallback((e) => {
    const v = e?.target?.value
    if (!v) return
    const [y, m] = v.split('-').map(Number)
    if (y && m >= 1 && m <= 12) {
      setStatsYear(y)
      setSummaryMonthFrom(m)
      setSummaryMonthTo((prev) => (prev < m ? m : prev))
    }
  }, [])

  useEffect(() => {
    if (selectedPayroll) {
      const timer = setTimeout(() => slipRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
      return () => clearTimeout(timer)
    }
  }, [selectedPayroll])

  const load = async () => {
    try {
      const res = await api.get(API, { params: { month, year } })
      setData(res.data?.data || { items: [], summary: null })
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load payroll')
    }
  }

  const loadHistory = async () => {
    try {
      const res = await api.get(API)
      setHistory(res.data?.data?.items || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load payroll history')
    }
  }

  useEffect(() => {
    const days = currentMonthDays(year, month)
    setDefaults((s) => ({ ...s, workingDays: days, presentDays: Math.min(Number(s.presentDays || days), days) }))
  }, [month, year])

  const loadEmployeeSummary = useCallback(async () => {
    try {
      setSummaryLoading(true)
      const params = { year: statsYear, monthFrom: summaryMonthFrom, monthTo: summaryMonthTo }
      if (summaryEmployeeId) params.employeeId = summaryEmployeeId
      const res = await api.get(`${API}/employee-summary`, { params })
      setEmployeeSummary(res.data?.data || null)
    } catch {
      setEmployeeSummary(null)
    } finally {
      setSummaryLoading(false)
    }
  }, [statsYear, summaryMonthFrom, summaryMonthTo, summaryEmployeeId])

  useEffect(() => {
    loadEmployeeSummary()
  }, [loadEmployeeSummary])

  const loadStatutory = async () => {
    try {
      const res = await api.get(`${API}/settings`)
      setStatutory(res.data?.data || null)
    } catch {
      setStatutory(null)
    }
  }

  usePlatformPageLoad(() => {
    load()
    loadHistory()
    loadStatutory()
  }, [month, year])

  useEffect(() => {
    let cancelled = false
    api
      .get(`${API}/employees`)
      .then((r) => {
        if (!cancelled) setStaffDirectory(Array.isArray(r.data?.data) ? r.data.data : [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!payrollModal) {
      setModalForm(null)
      setModalProfile(null)
      return
    }
    const { employeeId, row } = payrollModal
    const run = async () => {
      setModalLoading(true)
      try {
        let profile = null
        try {
          const res = await api.get(`${API}/employees/${employeeId}`)
          profile = res.data?.data || null
        } catch {
          profile = row?.employeeId && typeof row.employeeId === 'object' ? row.employeeId : null
        }
        setModalProfile(profile)
        const days = currentMonthDays(year, month)
        setModalForm({
          workingDays: row?.workingDays ?? days,
          presentDays: row?.presentDays ?? days,
          absentDays: row?.absentDays ?? 0,
          lateDays: row?.lateDays ?? 0,
          latePenalty: row?.latePenalty ?? 0,
          overtimeHours: row?.overtimeHours ?? 0,
          overtimeRate: row?.overtimeRate ?? 0,
          festivalBonus: row?.festivalBonus ?? 0,
          performanceBonus: row?.performanceBonus ?? 0,
          advanceSalary: row?.advanceSalary ?? 0,
          deductions: row ? Math.max(0, Number(row.deductions || 0) - Number(row.latePenalty || 0)) : 0,
          incentive: row?.incentive ?? 0,
        })
      } catch {
        toast.error('Could not load employee')
        setPayrollModal(null)
      } finally {
        setModalLoading(false)
      }
    }
    run()
  }, [payrollModal, year, month])

  const updateDefault = (key, value) => setDefaults((s) => ({ ...s, [key]: Number(value || 0) }))

  const saveStatutory = async () => {
    if (!statutory) return
    try {
      setStatutorySaving(true)
      await api.patch(`${API}/settings`, {
        defaultTdsPercent: Number(statutory.defaultTdsPercent ?? 0),
        defaultEpfPercent: Number(statutory.defaultEpfPercent ?? 0),
        defaultEmployerEpfPercent: Number(statutory.defaultEmployerEpfPercent ?? 0),
        enabled: Boolean(statutory.enabled),
      })
      toast.success('Payroll % defaults saved — regenerate payroll to apply')
      loadStatutory()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save defaults')
    } finally {
      setStatutorySaving(false)
    }
  }

  const generate = async () => {
    try {
      setGenerating(true)
      const res = await api.post(`${API}/generate`, { month, year, monthCount, defaults })
      const n = res.data?.data?.generated ?? res.data?.data?.payrolls?.length
      toast.success(n != null ? `Payroll generated (${n} record(s))` : 'Payroll generated')
      load()
      loadHistory()
      loadEmployeeSummary()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to generate payroll')
    } finally {
      setGenerating(false)
    }
  }

  const pay = async (id) => {
    try {
      await api.patch(`${API}/pay/${id}`, { method: 'bank_transfer' })
      toast.success('Salary marked as paid — expense recorded under Finance → Expenses')
      load()
      loadHistory()
      loadEmployeeSummary()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to mark payroll paid')
    }
  }

  const removePayrollRow = async (row) => {
    if (row.paymentStatus === 'paid') {
      toast.error('Paid payroll cannot be deleted.')
      return
    }
    const label = row.employeeId?.employeeCode
      ? `${row.employeeId.employeeCode} — ${row.employeeId?.name || 'employee'}`
      : row.employeeId?.name || 'this employee'
    if (!window.confirm(`Delete unpaid payroll for ${label} (${row.periodMonth}/${row.periodYear})?`)) return
    try {
      await api.delete(`${API}/${row._id}`)
      toast.success('Payroll deleted')
      load()
      loadHistory()
      loadEmployeeSummary()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not delete payroll')
    }
  }

  const openPayrollModalForRow = (row) => {
    const id = row.employeeId?._id || row.employeeId
    if (!id) return
    setSelectedPayroll(null)
    setPayrollModal({ employeeId: String(id), row })
  }

  const openPayrollModalFromPicker = () => {
    if (!staffPickId) {
      toast.error('Select an employee')
      return
    }
    const row =
      (data?.items || []).find((x) => String(x.employeeId?._id || x.employeeId) === String(staffPickId)) || null
    setSelectedPayroll(null)
    setPayrollModal({ employeeId: String(staffPickId), row })
  }

  const saveModalPayroll = async () => {
    if (!payrollModal || !modalForm) return
    try {
      setSavingModal(true)
      await api.post(`${API}/generate`, {
        month,
        year,
        monthCount: 1,
        employeeId: payrollModal.employeeId,
        defaults: { ...modalForm },
      })
      await load()
      const res = await api.get(API, { params: { month, year } })
      const items = res.data?.data?.items || []
      const found = items.find(
        (x) => String(x.employeeId?._id || x.employeeId) === String(payrollModal.employeeId),
      )
      setPayrollModal(null)
      setStaffPickId('')
      loadHistory()
      loadEmployeeSummary()
      toast.success('Payroll calculated — salary slip opened below')
      if (found) setSelectedPayroll(found)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save payroll')
    } finally {
      setSavingModal(false)
    }
  }

  const openSlip = (row) => {
    setPayrollModal(null)
    setSelectedPayroll(row)
  }

  const printSlip = (row) => {
    setPayrollModal(null)
    setSelectedPayroll(row)
    setTimeout(() => window.print(), 50)
  }

  const overtimePreview = Number(defaults.overtimeHours || 0) * Number(defaults.overtimeRate || 0)

  return {
    user,
    slipRef,
    month,
    year,
    monthCount,
    setMonthCount,
    data,
    generating,
    savingModal,
    selectedPayroll,
    setSelectedPayroll,
    payrollModal,
    setPayrollModal,
    modalForm,
    setModalForm,
    modalProfile,
    modalLoading,
    staffDirectory,
    staffPickId,
    setStaffPickId,
    defaults,
    statutory,
    setStatutory,
    statutorySaving,
    statsYear,
    setStatsYear,
    summaryMonthFrom,
    setSummaryMonthFrom,
    summaryMonthTo,
    setSummaryMonthTo,
    summaryEmployeeId,
    setSummaryEmployeeId,
    summarySearch,
    setSummarySearch,
    employeeSummary,
    summaryLoading,
    company,
    payrollPeriodBs,
    payrollPeriodAdIso,
    onPayrollPeriodDateChange,
    saveStatutory,
    updateDefault,
    generate,
    pay,
    removePayrollRow,
    openPayrollModalForRow,
    openPayrollModalFromPicker,
    saveModalPayroll,
    openSlip,
    printSlip,
    overtimePreview,
    history,
    loadEmployeeSummary,
    insightsPayrollPeriodBs,
    insightsPeriodAdIso,
    onInsightsPayPeriodChange,
  }
}
