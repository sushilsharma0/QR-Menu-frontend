import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { FiCheckCircle, FiClock, FiDownload, FiFileText, FiPercent, FiPrinter, FiUser, FiUsers, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { EmptyState, FinanceMetric, FinancePageHeader, FinancePanel, FinanceRow, money } from './FinanceUI'
import { AuthContext } from '../../../context/AuthContext'

const currentMonthDays = (year, month) => new Date(Number(year), Number(month), 0).getDate()
const monthName = (month) => new Date(2026, Number(month || 1) - 1, 1).toLocaleString('en-US', { month: 'long' }).toUpperCase()

const smallNumbers = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
function numberToWords(value) {
  const n = Math.floor(Number(value || 0))
  if (n === 0) return 'Zero'
  if (n < 20) return smallNumbers[n]
  if (n < 100) return `${tens[Math.floor(n / 10)]} ${smallNumbers[n % 10]}`.trim()
  if (n < 1000) return `${smallNumbers[Math.floor(n / 100)]} Hundred ${numberToWords(n % 100)}`.trim()
  if (n < 100000) return `${numberToWords(Math.floor(n / 1000))} Thousand ${numberToWords(n % 1000)}`.trim()
  return `${numberToWords(Math.floor(n / 100000))} Lakh ${numberToWords(n % 100000)}`.trim()
}

function SalarySlip({ payroll, company }) {
  if (!payroll) return null
  const employee = payroll.employeeId || {}
  const totalDeductions =
    Number(payroll.deductions || 0) +
    Number(payroll.advanceSalary || 0) +
    Number(payroll.tdsAmount ?? payroll.tax ?? 0) +
    Number(payroll.epfAmount || 0)
  const netPay = Number(payroll.finalSalary || 0)
  const slipDate = payroll.paymentDate ? new Date(payroll.paymentDate) : new Date()

  return (
    <div className="salary-slip-print bg-white p-8 text-black shadow-sm">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .salary-slip-print, .salary-slip-print * { visibility: visible !important; }
          .salary-slip-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 180mm !important;
            margin: 0 auto !important;
            border: 0 !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>
      <div className="mx-auto max-w-[720px] font-serif text-[15px]">
        <div className="text-center">
          <h1 className="text-xl font-bold uppercase">{company?.name || 'GOLDEN GATE HOTEL PVT.LTD.'}</h1>
          <p className="mt-4 text-lg font-bold underline">{company?.address || 'Pokhara -06, lakeside Nepal'}</p>
          <h2 className="mt-7 text-lg font-bold uppercase">Salary Slip</h2>
        </div>

        <table className="mt-4 w-full border-collapse border-2 border-black text-sm">
          <tbody>
            <tr>
              <td className="w-[38%] border border-black px-2 py-2 font-bold">MONTH</td>
              <td className="w-[28%] border border-black px-2 py-2 text-center">
                {monthName(payroll.periodMonth)} {payroll.periodYear}
              </td>
              <td className="w-[22%] border border-black px-2 py-2 font-bold">DATE</td>
              <td className="border border-black px-2 py-2 text-right">{slipDate.toLocaleDateString()}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-2 font-bold">NAME</td>
              <td className="border border-black px-2 py-2 uppercase">{employee.name || 'Employee'}</td>
              <td className="border border-black px-2 py-2 font-bold">DAYS OF ATTENDED</td>
              <td className="border border-black px-2 py-2 text-right">{payroll.presentDays || 0}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">DESIGNATION</td>
              <td className="border border-black px-2 py-1 uppercase">{employee.designation || employee.role || '-'}</td>
              <td className="border border-black px-2 py-1 font-bold">ABSENT</td>
              <td className="border border-black px-2 py-1 text-right">{payroll.absentDays || 0}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">DEPARTMENT</td>
              <td className="border border-black px-2 py-1 uppercase">{employee.department || employee.role || '-'}</td>
              <td className="border border-black px-2 py-1 font-bold">PAID DAYS</td>
              <td className="border border-black px-2 py-1 text-right">{payroll.presentDays || 0}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">LOCATION</td>
              <td className="border border-black px-2 py-1 uppercase">{company?.city || 'Pokhara'}</td>
              <td className="border border-black px-2 py-1 font-bold">HOLIDAYS</td>
              <td className="border border-black px-2 py-1 text-right">0</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">WORKING DAYS</td>
              <td className="border border-black px-2 py-1 text-center">{payroll.workingDays ?? '-'}</td>
              <td className="border border-black px-2 py-1 font-bold">BASIC SALARY (RS)</td>
              <td className="border border-black px-2 py-1 text-right">{Number(payroll.basicSalary || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold" colSpan="3">PRO-RATED BASIC (ATTENDANCE) (RS)</td>
              <td className="border border-black px-2 py-1 text-right">{Number(payroll.attendancePay || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">LATE DAYS</td>
              <td className="border border-black px-2 py-1 text-center">{payroll.lateDays ?? 0}</td>
              <td className="border border-black px-2 py-1 font-bold">ALLOWANCE (RS)</td>
              <td className="border border-black px-2 py-1 text-right">{Number(payroll.allowance || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">FESTIVAL BONUS (RS)</td>
              <td className="border border-black px-2 py-1 text-right" colSpan="3">
                {Number(payroll.festivalBonus || 0).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-2 font-bold">DEDUCTIONS</td>
              <td className="border border-black px-2 py-2" />
              <td className="border border-black px-2 py-2 font-bold">AMOUNT (RS)</td>
              <td className="border border-black px-2 py-2" />
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">ADVANCES</td>
              <td className="border border-black px-2 py-1" />
              <td className="border border-black px-2 py-1" />
              <td className="border border-black px-2 py-1 text-right">{Number(payroll.advanceSalary || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">LATE PENALTY</td>
              <td className="border border-black px-2 py-1" />
              <td className="border border-black px-2 py-1" />
              <td className="border border-black px-2 py-1 text-right">{Number(payroll.latePenalty || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">TDS (RS)</td>
              <td className="border border-black px-2 py-1" />
              <td className="border border-black px-2 py-1" />
              <td className="border border-black px-2 py-1 text-right">{Number(payroll.tdsAmount ?? payroll.tax ?? 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">EPF (RS)</td>
              <td className="border border-black px-2 py-1" />
              <td className="border border-black px-2 py-1" />
              <td className="border border-black px-2 py-1 text-right">{Number(payroll.epfAmount || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">TOTAL EARNINGS (RS)</td>
              <td className="border border-black px-2 py-1" />
              <td className="border border-black px-2 py-1" />
              <td className="border border-black px-2 py-1 text-right">{Number(payroll.grossEarnings || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">TOTAL DEDUCTIONS (RS)</td>
              <td className="border border-black px-2 py-1" />
              <td className="border border-black px-2 py-1" />
              <td className="border border-black px-2 py-1 text-right">{Number(totalDeductions || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">NET PAYS (RS)</td>
              <td className="border border-black px-2 py-1" />
              <td className="border border-black px-2 py-1" />
              <td className="border border-black px-2 py-1 text-right">{Number(netPay).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">CASH (RS)</td>
              <td className="border border-black px-2 py-1" />
              <td className="border border-black px-2 py-1" />
              <td className="border border-black px-2 py-1 text-right">{payroll.paymentStatus === 'paid' ? Number(netPay).toLocaleString() : 0}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">(RS) Words</td>
              <td colSpan="3" className="border border-black px-2 py-1 text-center uppercase">
                {numberToWords(netPay)} ONLY
              </td>
            </tr>
          </tbody>
        </table>

        <p className="mt-3 text-[11px] leading-snug text-gray-700">
          TDS and EPF are calculated on the full monthly basic salary. Pro-rated basic reflects attendance. Allowance and bonuses are included in gross pay before statutory deductions.
        </p>

        <div className="mt-8 font-bold uppercase">For {company?.name || 'Golden Gate Hotel'}</div>
        <div className="mt-20 text-sm font-bold">
          <p>Manager</p>
          <p className="ml-12 mt-2">Authorised Signatory</p>
        </div>
      </div>
    </div>
  )
}

const FinancePayroll = () => {
  const { user } = useContext(AuthContext)
  const now = new Date()
  const slipRef = useRef(null)
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  /** Generate payroll for this many consecutive months starting at month/year (1–3). */
  const [monthCount, setMonthCount] = useState(1)
  const [data, setData] = useState({ items: [], summary: null })
  const [history, setHistory] = useState([])
  const [generating, setGenerating] = useState(false)
  const [savingModal, setSavingModal] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState(null)
  /** { employeeId, row } — row may be null when opening from staff picker */
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
  const company = useMemo(() => ({
    name: user?.restaurantName || user?.name || 'GOLDEN GATE HOTEL PVT.LTD.',
    address: user?.address || 'Pokhara -06, lakeside Nepal',
    city: [user?.city, user?.state].filter(Boolean).join(', ') || user?.city || 'Pokhara',
  }), [user])

  useEffect(() => {
    if (selectedPayroll) setTimeout(() => slipRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
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

  useEffect(() => { load() }, [month, year])
  useEffect(() => { loadHistory() }, [])

  useEffect(() => {
    if (user?.role !== 'restaurant') return undefined
    let cancelled = false
    api.get('/restaurant/employees')
      .then((r) => {
        if (cancelled) return
        const list = r.data?.data
        setStaffDirectory(Array.isArray(list) ? list : [])
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user?.role])

  useEffect(() => {
    if (!payrollModal) {
      setModalForm(null)
      setModalProfile(null)
      return
    }
    const { employeeId, row } = payrollModal
    const load = async () => {
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
    load()
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
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to generate payroll')
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
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to mark payroll paid')
    }
  }

<<<<<<< HEAD
  const startEdit = (row) => {
=======
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
    const row = (data?.items || []).find((x) => String(x.employeeId?._id || x.employeeId) === String(staffPickId)) || null
>>>>>>> 19d089e511166164d2ace7d7d48a204d01d4d4a5
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
      const found = items.find((x) => String(x.employeeId?._id || x.employeeId) === String(payrollModal.employeeId))
      setPayrollModal(null)
      setStaffPickId('')
      loadHistory()
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
  const historyRows = useMemo(() => history.slice(0, 12), [history])

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Payroll"
        subtitle="Basic salary and allowance come from each employee profile. TDS and EPF are computed on full monthly basic; attendance controls pro-rated pay. Use bulk generate for everyone or open an employee to enter leave, late, OT, and festival bonus, then save for that person only."
      />

      <FinancePanel title="Payroll controls">
        <p className="mb-4 rounded-xl border border-surface-200 bg-surface-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
          <span className="font-semibold text-gray-800 dark:text-gray-200">Bulk run:</span>{' '}
          Fields below apply to <em>all</em> active employees for Generate. Basic pay and monthly allowance always come from each employee&apos;s profile (edit under Employees).
          For different attendance per person, use <span className="font-semibold">Payroll</span> on a row or pick a name below. Absent/leave can be 0 if you only set present days.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input label="Month" type="number" min="1" max="12" value={month} onChange={(e) => setMonth(Number(e.target.value))} />
          <Input label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Months to generate</label>
            <select
              value={monthCount}
              onChange={(e) => setMonthCount(Number(e.target.value))}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <option value={1}>1 month (selected month only)</option>
              <option value={2}>2 consecutive months</option>
              <option value={3}>3 consecutive months</option>
            </select>
          </div>
          <Input label="Working days" type="number" value={defaults.workingDays} onChange={(e) => updateDefault('workingDays', e.target.value)} />
          <Input label="Present days" type="number" value={defaults.presentDays} onChange={(e) => updateDefault('presentDays', e.target.value)} />
          <Input label="Absent days" type="number" value={defaults.absentDays} onChange={(e) => updateDefault('absentDays', e.target.value)} />
          <Input label="Late days" type="number" value={defaults.lateDays} onChange={(e) => updateDefault('lateDays', e.target.value)} />
          <Input label="Late penalties" type="number" value={defaults.latePenalty} onChange={(e) => updateDefault('latePenalty', e.target.value)} />
          <Input label="Overtime hours" type="number" value={defaults.overtimeHours} onChange={(e) => updateDefault('overtimeHours', e.target.value)} />
          <Input label="Overtime rate/hr" type="number" value={defaults.overtimeRate} onChange={(e) => updateDefault('overtimeRate', e.target.value)} />
          <Input label="Festival bonus" type="number" value={defaults.festivalBonus} onChange={(e) => updateDefault('festivalBonus', e.target.value)} />
          <Input label="Performance bonus" type="number" value={defaults.performanceBonus} onChange={(e) => updateDefault('performanceBonus', e.target.value)} />
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 md:col-span-2">
            <p className="text-xs font-bold uppercase text-amber-700">Overtime auto calculation</p>
            <p className="mt-1 text-xl font-black text-amber-900">{defaults.overtimeHours || 0} hrs x {money(defaults.overtimeRate)} = {money(overtimePreview)}</p>
          </div>
          <div className="flex items-end md:col-span-2">
<<<<<<< HEAD
            <Button type="button" loading={generating} onClick={generate}>Generate Monthly Payroll</Button>
=======
            <Button type="button" loading={generating} onClick={generate}>
              {monthCount > 1 ? `Generate payroll (${monthCount} months)` : 'Generate monthly payroll'}
            </Button>
>>>>>>> 19d089e511166164d2ace7d7d48a204d01d4d4a5
          </div>
        </div>
      </FinancePanel>

<<<<<<< HEAD
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
=======
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
>>>>>>> 19d089e511166164d2ace7d7d48a204d01d4d4a5
        <FinanceMetric label="Total payroll cost" value={money(data?.summary?.totalPayrollCost)} icon={FiUsers} />
        <FinanceMetric label="Paid salaries" value={data?.summary?.paidSalaries || 0} icon={FiCheckCircle} tone="success" />
        <FinanceMetric label="Pending salaries" value={data?.summary?.pendingSalaries || 0} icon={FiClock} tone="warning" />
        <FinanceMetric label="Overtime pay" value={money(data?.summary?.totalOvertimePay)} icon={FiClock} tone="neutral" />
        <FinanceMetric label="Bonuses" value={money(data?.summary?.totalBonus)} icon={FiFileText} tone="success" />
<<<<<<< HEAD
=======
        <FinanceMetric label="TDS withheld" value={money(data?.summary?.totalTds)} icon={FiPercent} tone="neutral" />
        <FinanceMetric label="EPF" value={money(data?.summary?.totalEpf)} icon={FiPercent} tone="neutral" />
>>>>>>> 19d089e511166164d2ace7d7d48a204d01d4d4a5
      </div>

      <FinancePanel title="Payroll rows">
        {user?.role === 'restaurant' && staffDirectory.length > 0 && (
          <div className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-surface-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/50">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Employee payroll</label>
              <select
                value={staffPickId}
                onChange={(e) => setStaffPickId(e.target.value)}
                className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="">Select employee…</option>
                {staffDirectory.filter((e) => e.isActive !== false).map((e) => (
                  <option key={e._id} value={e._id}>{e.name}</option>
                ))}
              </select>
            </div>
            <Button type="button" variant="secondary" onClick={openPayrollModalFromPicker}>
              <FiUser className="mr-1 inline" /> Open
            </Button>
          </div>
        )}
        <div className="space-y-2">
          {(data?.items || []).map((p) => (
            <FinanceRow
              key={p._id}
              title={p.employeeId?.name || 'Employee'}
              meta={`Present ${p.presentDays || 0}/${p.workingDays || 0} | Leave/absent ${p.absentDays || 0} | Basic ${money(p.basicSalary)} + allowance ${money(p.allowance)} | Net ${money(p.finalSalary)}`}
              amount={money(p.finalSalary)}
              status={p.paymentStatus}
              action={
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => openPayrollModalForRow(p)}>
                    <FiUser className="mr-1" /> Payroll
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => openSlip(p)}><FiFileText className="mr-1" /> Slip</Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => printSlip(p)}><FiDownload className="mr-1" /> PDF</Button>
                  {p.paymentStatus !== 'paid' && <Button type="button" size="sm" onClick={() => pay(p._id)}>Pay Salary</Button>}
                </div>
              }
            />
          ))}
          {(data?.items || []).length === 0 && <EmptyState>No payroll rows for selected period.</EmptyState>}
        </div>
      </FinancePanel>

      {payrollModal && (
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
                This period is marked paid. Open Slip to print; amounts cannot be recalculated here.
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
                    onClick={saveModalPayroll}
                  >
                    Calculate &amp; save
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setPayrollModal(null)}>Cancel</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {selectedPayroll && (
        <div ref={slipRef}>
        <FinancePanel
          title="Salary slip"
          actions={
            <>
              <Button type="button" variant="secondary" onClick={() => setSelectedPayroll(null)}>Close</Button>
              <Button type="button" onClick={() => window.print()}><FiPrinter className="mr-1" /> Print / Download PDF</Button>
            </>
          }
        >
          <SalarySlip payroll={selectedPayroll} company={company} />
        </FinancePanel>
        </div>
      )}

      <FinancePanel title="Payroll history">
        <div className="space-y-2">
          {historyRows.map((p) => (
            <FinanceRow
              key={p._id}
              title={`${p.employeeId?.name || 'Employee'} - ${p.periodMonth}/${p.periodYear}`}
              meta={`Payment ${p.paymentStatus}${p.paymentDate ? ` | Paid ${new Date(p.paymentDate).toLocaleDateString()}` : ''} | Transactions ${(p.transactions || []).length}`}
              amount={money(p.finalSalary)}
              status={p.paymentStatus}
              action={<Button type="button" size="sm" variant="secondary" onClick={() => openSlip(p)}>View Slip</Button>}
            />
          ))}
          {historyRows.length === 0 && <EmptyState>No payroll history yet.</EmptyState>}
        </div>
      </FinancePanel>
    </div>
  )
}

export default FinancePayroll
