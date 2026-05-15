import React, { useEffect, useMemo, useState } from 'react'
import { FiPieChart, FiTarget, FiTrendingDown } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../../services/api'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { EmptyState, FinanceMetric, FinancePageHeader, FinancePanel, FinanceRow, money } from './FinanceUI'

const EXPENSE_CATEGORIES = ['rent', 'electricity', 'gas', 'staff_salary', 'ingredients', 'marketing', 'maintenance', 'tax', 'internet', 'water', 'fuel', 'transportation', 'equipment', 'miscellaneous']

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

  useEffect(() => { loadVariance() }, [year, month])

  const addLine = () => setLines((s) => [...s, { category: 'miscellaneous', amount: '' }])

  const saveBudget = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await api.post('/restaurant/finance/budgets', {
        periodType: 'monthly',
        year,
        month,
        lines: lines.filter((l) => l.category && l.amount !== '').map((l) => ({ category: l.category, amount: Number(l.amount) })),
      })
      toast.success('Budget saved')
      loadVariance()
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const budgeted = variance.reduce((sum, v) => sum + Number(v.budgeted || 0), 0)
  const actual = variance.reduce((sum, v) => sum + Number(v.actual || 0), 0)
  const overLines = variance.filter((v) => Number(v.remaining || 0) < 0).length

  return (
    <div className="space-y-6">
      <FinancePageHeader title="Budget Management" subtitle="Set category budgets and compare planned spending against actual expenses." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FinanceMetric label="Budgeted" value={money(budgeted)} icon={FiTarget} />
        <FinanceMetric label="Actual spend" value={money(actual)} icon={FiPieChart} tone="warning" />
        <FinanceMetric label="Over-budget lines" value={overLines} icon={FiTrendingDown} tone={overLines > 0 ? 'danger' : 'success'} />
      </div>

      <FinancePanel title="Monthly budget">
        <form onSubmit={saveBudget} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            <Select
              label="Month"
              value={month}
              onValueChange={(v) => setMonth(Number(v))}
              options={Array.from({ length: 12 }, (_, i) => {
                const m = i + 1
                return {
                  value: m,
                  label: new Date(2026, m - 1, 1).toLocaleString('en-US', { month: 'long' }),
                }
              })}
            />
          </div>

          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <Select
                  label={idx === 0 ? 'Category' : undefined}
                  value={line.category}
                  onValueChange={(v) => setLines((s) => s.map((x, i) => (i === idx ? { ...x, category: v } : x)))}
                  options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') }))}
                />
                <Input type="number" placeholder="Budget amount" value={line.amount} onChange={(e) => setLines((s) => s.map((x, i) => (i === idx ? { ...x, amount: e.target.value } : x)))} />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={addLine}>Add category line</Button>
            <Button type="submit" loading={loading}>Save budget</Button>
          </div>
        </form>
      </FinancePanel>

      <FinancePanel title="Actual vs budget">
        <div className="space-y-2">
          {variance.map((v) => (
            <FinanceRow
              key={v.category}
              title={v.category}
              meta={`Budget ${money(v.budgeted)} | Actual ${money(v.actual)}`}
              amount={v.remaining < 0 ? `Over by ${money(Math.abs(v.remaining))}` : `Remaining ${money(v.remaining)}`}
              danger={v.remaining < 0}
            />
          ))}
          {variance.length === 0 && <EmptyState>No budget lines for this month, or no data yet.</EmptyState>}
        </div>
      </FinancePanel>
    </div>
  )
}

export default Budget
