import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiFileText } from 'react-icons/fi'
import api from '../../../services/api'
import Card from '../../../components/common/Card'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { getAuthToken } from '../../../utils/authStorage'
import { getApiBaseUrl } from '../../../utils/runtimeConfig'

const FinancePayroll = () => {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState({ items: [], summary: null })
  const [generating, setGenerating] = useState(false)

  const load = async () => {
    try {
      const res = await api.get('/restaurant/payroll', { params: { month, year } })
      setData(res.data?.data || { items: [], summary: null })
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load payroll')
    }
  }

  useEffect(() => {
    load()
  }, [month, year])

  const generate = async () => {
    try {
      setGenerating(true)
      await api.post('/restaurant/payroll/generate', { month, year })
      toast.success('Payroll generated')
      load()
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
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to mark payroll paid')
    }
  }

  const openPayslipPrint = async (id) => {
    const token = getAuthToken()
    const base = getApiBaseUrl()
    try {
      const res = await fetch(`${base.replace(/\/$/, '')}/restaurant/payroll/payslip/${id}/html`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const html = await res.text()
      const w = window.open('', '_blank')
      if (w) {
        w.document.write(html)
        w.document.close()
        w.focus()
      }
    } catch {
      toast.error('Could not open payslip')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-gray-950 dark:text-gray-100">Payroll</h1>
      <Card title="Payroll controls">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input label="Month" type="number" min="1" max="12" value={month} onChange={(e) => setMonth(Number(e.target.value))} />
          <Input label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          <div className="md:col-span-2 flex items-end">
            <Button type="button" loading={generating} onClick={generate}>
              Generate monthly payroll
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card title="Total payroll cost">
          <p className="text-2xl font-black">Rs. {Number(data?.summary?.totalPayrollCost || 0).toLocaleString()}</p>
        </Card>
        <Card title="Paid salaries">
          <p className="text-2xl font-black text-green-700 dark:text-green-400">{data?.summary?.paidSalaries || 0}</p>
        </Card>
        <Card title="Pending salaries">
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{data?.summary?.pendingSalaries || 0}</p>
        </Card>
      </div>

      <Card title="Payroll rows">
        <div className="space-y-2">
          {(data?.items || []).map((p) => (
            <div key={p._id} className="flex flex-col gap-3 rounded-xl border border-surface-200 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
              <div>
                <p className="font-semibold">{p.employeeId?.name || 'Employee'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Basic {p.basicSalary} · TDS {p.tdsAmount ?? p.tax ?? 0} · Net {p.finalSalary}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    p.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/50' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40'
                  }`}
                >
                  {p.paymentStatus}
                </span>
                <Button type="button" variant="secondary" className="!py-1 !px-2 text-xs" onClick={() => openPayslipPrint(p._id)}>
                  <FiFileText className="mr-1 inline h-3 w-3" /> Payslip
                </Button>
                {p.paymentStatus !== 'paid' && (
                  <Button type="button" className="!py-1 !px-2 text-xs" onClick={() => pay(p._id)}>
                    Mark paid
                  </Button>
                )}
              </div>
            </div>
          ))}
          {(data?.items || []).length === 0 && <p className="text-sm text-gray-500">No payroll rows for this period.</p>}
        </div>
      </Card>
    </div>
  )
}

export default FinancePayroll
