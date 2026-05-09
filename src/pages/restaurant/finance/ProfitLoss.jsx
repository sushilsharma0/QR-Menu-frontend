import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import Card from '../../../components/common/Card'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'

const ProfitLoss = () => {
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const [report, setReport] = useState(null)
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const res = await api.get('/restaurant/finance/profit-loss', { params: { from, to, period: 'custom' } })
      setReport(res.data?.data?.report || null)
      setTrends(res.data?.data?.trends || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Profit & Loss</h1>
      <Card title="Generate P&L report">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <div className="md:col-span-2 flex items-end">
            <Button type="button" loading={loading} onClick={load}>Generate</Button>
          </div>
        </div>
      </Card>

      {report && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card title="Revenue"><p className="text-2xl font-black">Rs. {Number(report.revenue || 0).toLocaleString()}</p></Card>
          <Card title="Expenses"><p className="text-2xl font-black">Rs. {Number(report.expenses || 0).toLocaleString()}</p></Card>
          <Card title="Net Profit"><p className="text-2xl font-black text-primary-700">Rs. {Number(report.netProfit || 0).toLocaleString()}</p></Card>
        </div>
      )}

      <Card title="Profit trend">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends}>
              <XAxis dataKey="createdAt" tickFormatter={(v) => new Date(v).toLocaleDateString()} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="netProfit" stroke="#8f2800" />
              <Line type="monotone" dataKey="revenue" stroke="#b64a26" />
              <Line type="monotone" dataKey="expenses" stroke="#756a03" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

export default ProfitLoss
