import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import toast from 'react-hot-toast'
import api from '../../../../services/api'
import { AuthContext } from '../../../../context/AuthContext'
import { adPayrollMonthYearToBs } from '../../../../utils/nepaliDateFormat'
import { currentMonthDays } from './payrollUtils'

export function usePayrollPage() {
  const { user } = useContext(AuthContext)
  const now = new Date()
  const slipRef = useRef(null)

  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
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
  const [defaults, setDefaults] = useState({
    workingDays: currentMonthDays(now.getFullYear(), now.getMonth() + 1),
    presentDays: currentMonthDays(now.getFullYear(), now.getMonth() + 1),
    absentDays: 0,
    lateDays: 0,
    latePenalty: 0,
    overtimeHours: 0,
    overtimeRate: 0,
    festivalBonus: 0,
    performanceBonus: 0,
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
      name: user?.restaurantName || user?.name || 'GOLDEN GATE HOTEL PVT.LTD.',
      address: user?.address || 'Pokhara -06, lakeside Nepal',
      city: [user?.city, user?.state].filter(Boolean).join(', ') || user?.city || 'Pokhara',
    }),
    [user],
  )

  const payrollPeriodBs = useMemo(() => adPayrollMonthYearToBs(month, year), [month, year])
  const payrollPeriodAdIso = useMemo(
    () => `${year}-${String(month).padStart(2, '0')}-15`,
    [year, month],
  )

  const onPayrollPeriodDateChange = useCallback((e) => {
    const v = e?.target?.value
    if (!v || typeof v !== 'string') return
    const parts = v.split('-').map(Number)
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return
    const [y, m] = parts
    if (!y || m < 1 || m > 12) return
    setYear(y)
    setMonth(m)
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
    if (!v || typeof v !== 'string') return
    const parts = v.split('-').map(Number)
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return
    const [y, m] = parts
    if (!y || m < 1 || m > 12) return
    setStatsYear(y)
    setSummaryMonthFrom(m)
    setSummaryMonthTo((prev) => (prev < m ? m : prev))
  }, [])

  useEffect(() => {
    if (selectedPayroll) {
      setTimeout(() => slipRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
  }, [selectedPayroll])

  const load = async () => {
    try {
      const res = await api.get('/restaurant/payroll', { params: { month, year } })
      setData(res.data?.data || { items: [], summary: null })
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load payroll')
    }
  }

  const loadHistory = async () => {
    try {
      const res = await api.get('/restaurant/payroll')
      setHistory(res.data?.data?.items || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load payroll history')
    }
  }

  useEffect(() => {
    setDefaults((s) => {
      const days = currentMonthDays(year, month)
      return { ...s, workingDays: days, presentDays: Math.min(Number(s.presentDays || days), days) }
    })
  }, [month, year])

  useEffect(() => {
    load()
  }, [month, year])

  useEffect(() => {
    loadHistory()
  }, [])

  const loadEmployeeSummary = useCallback(async () => {
    try {
      setSummaryLoading(true)
      const params = {
        year: statsYear,
        monthFrom: summaryMonthFrom,
        monthTo: summaryMonthTo,
      }
      if (summaryEmployeeId) params.employeeId = summaryEmployeeId
      const res = await api.get('/restaurant/payroll/employee-summary', { params })
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
      const res = await api.get('/restaurant/finance/tds/settings')
      setStatutory(res.data?.data || null)
    } catch {
      setStatutory(null)
    }
  }

  useEffect(() => {
    if (user?.role !== 'restaurant') return
    loadStatutory()
  }, [user?.role])

  const saveStatutory = async () => {
    if (!statutory) return
    try {
      setStatutorySaving(true)
      await api.patch('/restaurant/finance/tds/settings', {
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

  useEffect(() => {
    if (user?.role !== 'restaurant') return undefined
    let cancelled = false
    api
      .get('/restaurant/employees')
      .then((r) => {
        if (cancelled) return
        const list = r.data?.data
        setStaffDirectory(Array.isArray(list) ? list : [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user?.role])

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
        if (user?.role === 'restaurant') {
          const res = await api.get(`/restaurant/employees/${employeeId}`)
          profile = res.data?.data || null
        } else if (row?.employeeId && typeof row.employeeId === 'object') {
          profile = row.employeeId
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
          deductions: row
            ? Math.max(0, Number(row.deductions || 0) - Number(row.latePenalty || 0))
            : 0,
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
  }, [payrollModal, user?.role, year, month])

  const updateDefault = (key, value) => setDefaults((s) => ({ ...s, [key]: Number(value || 0) }))

  const generate = async () => {
    try {
      setGenerating(true)
      const res = await api.post('/restaurant/payroll/generate', { month, year, monthCount, defaults })
      const periods = res.data?.data?.periods
      const n = res.data?.data?.generated ?? res.data?.data?.payrolls?.length
      if (monthCount > 1 && periods?.length) {
        toast.success(`Payroll generated for ${periods.length} month(s), ${n} record(s)`)
      } else {
        toast.success(n != null ? `Payroll generated (${n} record(s))` : 'Payroll generated')
      }
      load()
      loadHistory()
      loadEmployeeSummary()
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to generate payroll'
      if (e.response?.status === 400 && /already generated/i.test(msg)) {
        toast.error(msg, { duration: 5000 })
      } else {
        toast.error(msg)
      }
    } finally {
      setGenerating(false)
    }
  }

  const pay = async (id) => {
    try {
      await api.patch(`/restaurant/payroll/pay/${id}`, { method: 'bank_transfer' })
      toast.success('Salary marked as paid')
      load()
      loadHistory()
      loadEmployeeSummary()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to mark payroll paid')
    }
  }

  const removePayrollRow = async (row) => {
    if (row.paymentStatus === 'paid') {
      toast.error('Paid payroll cannot be deleted or edited.')
      return
    }
    const name = row.employeeId?.name || 'this employee'
    if (!window.confirm(`Delete unpaid payroll for ${name} (${row.periodMonth}/${row.periodYear})?`)) return
    try {
      await api.delete(`/restaurant/payroll/${row._id}`)
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
    if (payrollModal.row?.paymentStatus === 'paid') {
      toast.error('Paid payroll cannot be changed')
      return
    }
    try {
      setSavingModal(true)
      await api.post('/restaurant/payroll/generate', {
        month,
        year,
        monthCount: 1,
        employeeId: payrollModal.employeeId,
        defaults: { ...modalForm },
      })
      await load()
      const res = await api.get('/restaurant/payroll', { params: { month, year } })
      const items = res.data?.data?.items || []
      const found = items.find(
        (x) => String(x.employeeId?._id || x.employeeId) === String(payrollModal.employeeId),
      )
      setPayrollModal(null)
      setStaffPickId('')
      loadHistory()
      loadEmployeeSummary()
      toast.success('Payroll calculated - salary slip opened below')
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
