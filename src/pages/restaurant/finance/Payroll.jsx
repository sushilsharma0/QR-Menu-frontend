import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { FiCheckCircle, FiClock, FiDownload, FiEdit3, FiFileText, FiPrinter, FiUsers } from 'react-icons/fi'
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
    Number(payroll.tdsAmount ?? payroll.tax ?? 0)
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
              <td className="w-[28%] border border-black px-2 py-2 text-center">{monthName(payroll.periodMonth)}</td>
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

        <div className="mt-8 font-bold uppercase">For {company?.name || 'Golden Gate Hotel'}</div>
        <div className="mt-20 text-sm font-bold">
          <p>Manager</p>
          <p className="ml-12 mt-2">Authorised Signatory</p>
        </div>
      </div>
    </div>
  )
}

const Payroll = () => {
  const { user } = useContext(AuthContext)
  const now = new Date()
  const adjustRef = useRef(null)
  const slipRef = useRef(null)
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState({ items: [], summary: null })
  const [history, setHistory] = useState([])
  const [generating, setGenerating] = useState(false)
  const [savingId, setSavingId] = useState('')
  const [selectedPayroll, setSelectedPayroll] = useState(null)
  const [editing, setEditing] = useState(null)
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
    allowance: 0,
  })
  const company = useMemo(() => ({
    name: user?.restaurantName || user?.name || 'GOLDEN GATE HOTEL PVT.LTD.',
    address: user?.address || 'Pokhara -06, lakeside Nepal',
    city: [user?.city, user?.state].filter(Boolean).join(', ') || user?.city || 'Pokhara',
  }), [user])

  useEffect(() => {
    if (editing) setTimeout(() => adjustRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }, [editing])

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

  const updateDefault = (key, value) => setDefaults((s) => ({ ...s, [key]: Number(value || 0) }))

  const generate = async () => {
    try {
      setGenerating(true)
      await api.post('/restaurant/payroll/generate', { month, year, defaults })
      toast.success('Payroll generated')
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

  const startEdit = (row) => {
    setSelectedPayroll(null)
    setEditing({
      id: row._id,
      workingDays: row.workingDays || currentMonthDays(row.periodYear, row.periodMonth),
      presentDays: row.presentDays || 0,
      absentDays: row.absentDays || 0,
      lateDays: row.lateDays || 0,
      latePenalty: row.latePenalty || 0,
      overtimeHours: row.overtimeHours || 0,
      overtimeRate: row.overtimeRate || 0,
      festivalBonus: row.festivalBonus || 0,
      performanceBonus: row.performanceBonus || 0,
      allowance: row.allowance || 0,
      incentive: row.incentive || 0,
      deductions: Math.max(0, Number(row.deductions || 0) - Number(row.latePenalty || 0)),
      advanceSalary: row.advanceSalary || 0,
    })
  }

  const openSlip = (row) => {
    setEditing(null)
    setSelectedPayroll(row)
  }

  const saveEdit = async () => {
    if (!editing?.id) return
    try {
      setSavingId(editing.id)
      await api.patch(`/restaurant/payroll/${editing.id}`, editing)
      toast.success('Payroll recalculated')
      setEditing(null)
      load()
      loadHistory()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update payroll')
    } finally {
      setSavingId('')
    }
  }

  const printSlip = (row) => {
    setEditing(null)
    setSelectedPayroll(row)
    setTimeout(() => window.print(), 50)
  }

  const overtimePreview = Number(defaults.overtimeHours || 0) * Number(defaults.overtimeRate || 0)
  const historyRows = useMemo(() => history.slice(0, 12), [history])

  return (
    <div className="space-y-6">
      <FinancePageHeader title="Payroll" subtitle="Generate salaries with attendance, overtime, bonuses, payment history and printable salary slips." />

      <FinancePanel title="Payroll controls">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input label="Month" type="number" min="1" max="12" value={month} onChange={(e) => setMonth(Number(e.target.value))} />
          <Input label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          <Input label="Working days" type="number" value={defaults.workingDays} onChange={(e) => updateDefault('workingDays', e.target.value)} />
          <Input label="Present days" type="number" value={defaults.presentDays} onChange={(e) => updateDefault('presentDays', e.target.value)} />
          <Input label="Absent days" type="number" value={defaults.absentDays} onChange={(e) => updateDefault('absentDays', e.target.value)} />
          <Input label="Late days" type="number" value={defaults.lateDays} onChange={(e) => updateDefault('lateDays', e.target.value)} />
          <Input label="Late penalties" type="number" value={defaults.latePenalty} onChange={(e) => updateDefault('latePenalty', e.target.value)} />
          <Input label="Allowance" type="number" value={defaults.allowance} onChange={(e) => updateDefault('allowance', e.target.value)} />
          <Input label="Overtime hours" type="number" value={defaults.overtimeHours} onChange={(e) => updateDefault('overtimeHours', e.target.value)} />
          <Input label="Overtime rate/hr" type="number" value={defaults.overtimeRate} onChange={(e) => updateDefault('overtimeRate', e.target.value)} />
          <Input label="Festival bonus" type="number" value={defaults.festivalBonus} onChange={(e) => updateDefault('festivalBonus', e.target.value)} />
          <Input label="Performance bonus" type="number" value={defaults.performanceBonus} onChange={(e) => updateDefault('performanceBonus', e.target.value)} />
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 md:col-span-2">
            <p className="text-xs font-bold uppercase text-amber-700">Overtime auto calculation</p>
            <p className="mt-1 text-xl font-black text-amber-900">{defaults.overtimeHours || 0} hrs x {money(defaults.overtimeRate)} = {money(overtimePreview)}</p>
          </div>
          <div className="flex items-end md:col-span-2">
            <Button type="button" loading={generating} onClick={generate}>Generate Monthly Payroll</Button>
          </div>
        </div>
      </FinancePanel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <FinanceMetric label="Total payroll cost" value={money(data?.summary?.totalPayrollCost)} icon={FiUsers} />
        <FinanceMetric label="Paid salaries" value={data?.summary?.paidSalaries || 0} icon={FiCheckCircle} tone="success" />
        <FinanceMetric label="Pending salaries" value={data?.summary?.pendingSalaries || 0} icon={FiClock} tone="warning" />
        <FinanceMetric label="Overtime pay" value={money(data?.summary?.totalOvertimePay)} icon={FiClock} tone="neutral" />
        <FinanceMetric label="Bonuses" value={money(data?.summary?.totalBonus)} icon={FiFileText} tone="success" />
      </div>

      <FinancePanel title="Payroll rows">
        <div className="space-y-2">
          {(data?.items || []).map((p) => (
            <FinanceRow
              key={p._id}
              title={p.employeeId?.name || 'Employee'}
              meta={`Present ${p.presentDays || 0}/${p.workingDays || 0} | Absent ${p.absentDays || 0} | OT ${p.overtimeHours || 0} hrs | Bonus ${money(Number(p.festivalBonus || 0) + Number(p.performanceBonus || 0) + Number(p.bonus || 0))}`}
              amount={money(p.finalSalary)}
              status={p.paymentStatus}
              action={
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => startEdit(p)}><FiEdit3 className="mr-1" /> Adjust</Button>
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

      {editing && (
        <div ref={adjustRef}>
        <FinancePanel title="Adjust payroll calculation">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {['workingDays', 'presentDays', 'absentDays', 'lateDays', 'latePenalty', 'overtimeHours', 'overtimeRate', 'festivalBonus', 'performanceBonus', 'allowance', 'incentive', 'deductions', 'advanceSalary'].map((key) => (
              <Input key={key} label={key.replace(/([A-Z])/g, ' $1')} type="number" value={editing[key]} onChange={(e) => setEditing((s) => ({ ...s, [key]: Number(e.target.value || 0) }))} />
            ))}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 md:col-span-2">
              <p className="text-xs font-bold uppercase text-emerald-700">Overtime preview</p>
              <p className="mt-1 text-xl font-black text-emerald-900">{editing.overtimeHours || 0} hrs x {money(editing.overtimeRate)} = {money(Number(editing.overtimeHours || 0) * Number(editing.overtimeRate || 0))}</p>
            </div>
            <div className="flex items-end gap-2 md:col-span-2">
              <Button type="button" loading={savingId === editing.id} onClick={saveEdit}>Save Calculation</Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </div>
        </FinancePanel>
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

export default Payroll
