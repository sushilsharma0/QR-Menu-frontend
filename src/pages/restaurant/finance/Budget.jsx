import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import Card from '../../../components/common/Card'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'

const EXPENSE_CATEGORIES = [
  'rent',
  'electricity',
  'gas',
  'staff_salary',
  'ingredients',
  'marketing',
  'maintenance',
  'tax',
  'internet',
  'water',
  'fuel',
  'transportation',
  'equipment',
  'miscellaneous',
]

const Budget = () => {
  const now = useMemo(() => new Date(), [])
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [lines, setLines] = useState([{ category: 'rent', amount: '' }])
  const [variance, setVariance] = useState([])
  const [loading, setLoading] = useState(false)

  const loadVariance = async () => {
    try {
      const res = await api.get('/restaurant/finance/budgets/variance', { params: { year, month } })
      setVariance(res.data?.data?.variance || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load variance')
    }
  }

  useEffect(() => {
    loadVariance()
  }, [year, month])

  const addLine = () => setLines((s) => [...s, { category: 'miscellaneous', amount: '' }])

  const saveBudget = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await api.post('/restaurant/finance/budgets', {
        periodType: 'monthly',
        year,
        month,
        lines: lines
          .filter((l) => l.category && l.amount !== '')
          .map((l) => ({ category: l.category, amount: Number(l.amount) })),
      })
      toast.success('Budget saved')
      loadVariance()
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-gray-950 dark:text-gray-100">Budget Management</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Set monthly category budgets and compare actual expenses. Alerts fire when spending exceeds budget.
      </p>

      <Card title="Monthly budget">
        <form onSubmit={saveBudget} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            <div>
              <label className="mb-1 block text-sm font-medium">Month</label>
              <select
                className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-900"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <select
                  className="rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-900"
                  value={line.category}
                  onChange={(e) => {
                    const v = e.target.value
                    setLines((s) => s.map((x, i) => (i === idx ? { ...x, category: v } : x)))
                  }}
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  placeholder="Budget amount"
                  value={line.amount}
                  onChange={(e) => {
                    const v = e.target.value
                    setLines((s) => s.map((x, i) => (i === idx ? { ...x, amount: v } : x)))
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={addLine}>
              Add category line
            </Button>
            <Button type="submit" loading={loading}>
              Save budget
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Actual vs budget (variance)">
        <div className="space-y-2">
          {variance.length === 0 && <p className="text-sm text-gray-500">No budget lines for this month, or no data yet.</p>}
          {variance.map((v) => (
            <div
              key={v.category}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-surface-200 p-3 dark:border-gray-700"
            >
              <span className="font-semibold capitalize">{v.category}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Budget Rs. {Number(v.budgeted || 0).toLocaleString()} · Actual Rs. {Number(v.actual || 0).toLocaleString()}
              </span>
              <span className={`text-sm font-bold ${v.remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {v.remaining < 0 ? `Over by Rs. ${Math.abs(v.remaining).toLocaleString()}` : `Remaining Rs. ${v.remaining.toLocaleString()}`}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default Budget
