import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import Card from '../../../components/common/Card'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'

const Payroll = () => {
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

  useEffect(() => { load() }, [month, year])

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Payroll</h1>
      <Card title="Payroll controls">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input label="Month" type="number" min="1" max="12" value={month} onChange={(e) => setMonth(Number(e.target.value))} />
          <Input label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          <div className="md:col-span-2 flex items-end">
            <Button type="button" loading={generating} onClick={generate}>Generate Monthly Payroll</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card title="Total payroll cost"><p className="text-2xl font-black">Rs. {Number(data?.summary?.totalPayrollCost || 0).toLocaleString()}</p></Card>
        <Card title="Paid salaries"><p className="text-2xl font-black text-green-700">{data?.summary?.paidSalaries || 0}</p></Card>
        <Card title="Pending salaries"><p className="text-2xl font-black text-amber-700">{data?.summary?.pendingSalaries || 0}</p></Card>
      </div>

      <Card title="Payroll rows">
        <div className="space-y-2">
          {(data?.items || []).map((p) => (
            <div key={p._id} className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="font-semibold">{p.employeeId?.name || 'Employee'}</p>
                <p className="text-xs text-gray-500">
                  Basic {p.basicSalary} • TDS {p.tdsAmount ?? p.tax ?? 0} • Net {p.finalSalary}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-xs ${p.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
                  {p.paymentStatus}
                </span>
                {p.paymentStatus !== 'paid' && (
                  <Button type="button" onClick={() => pay(p._id)}>Mark Paid</Button>
                )}
              </div>
            </div>
          ))}
          {(data?.items || []).length === 0 && <p className="text-sm text-gray-500">No payroll rows for selected period.</p>}
        </div>
      </Card>
    </div>
  )
}

export default Payroll
