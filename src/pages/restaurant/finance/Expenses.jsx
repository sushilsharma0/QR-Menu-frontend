import React, { useEffect, useState } from 'react'
import { FiCreditCard, FiPieChart, FiPlus, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { EmptyState, FinanceMetric, FinancePageHeader, FinancePanel, FinanceRow, money } from './FinanceUI'

const categories = ['rent', 'electricity', 'gas', 'staff_salary', 'ingredients', 'marketing', 'maintenance', 'tax', 'internet', 'water', 'fuel', 'transportation', 'equipment', 'miscellaneous']

const Expenses = () => {
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'miscellaneous',
    paymentMethod: 'cash',
    expenseDate: new Date().toISOString().slice(0, 10),
    description: '',
  })
  const [receiptImage, setReceiptImage] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const res = await api.get('/restaurant/finance/expenses')
      setRows(res.data?.data?.items || [])
      setSummary(res.data?.data?.summary || null)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load expenses')
    }
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (receiptImage) fd.append('receiptImage', receiptImage)
      await api.post('/restaurant/finance/expenses', fd)
      setForm({ title: '', amount: '', category: 'miscellaneous', paymentMethod: 'cash', expenseDate: new Date().toISOString().slice(0, 10), description: '' })
      setReceiptImage(null)
      toast.success('Expense added')
      load()
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to add expense')
    } finally {
      setSaving(false)
    }
  }

  const removeExpense = async (id) => {
    try {
      await api.delete(`/restaurant/finance/expenses/${id}`)
      toast.success('Expense deleted')
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Expense Management"
        subtitle="Operating costs and receipts. When you mark payroll as paid, a staff_salary expense is created automatically so Profit & Loss includes wages."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FinanceMetric label="Monthly expense" value={money(summary?.totalMonthlyExpense)} icon={FiCreditCard} tone="warning" />
        <FinanceMetric label="Highest category" value={summary?.highestExpenseCategory || '-'} icon={FiPieChart} tone="neutral" />
        <FinanceMetric label="Expense entries" value={rows.length} icon={FiPlus} />
      </div>

      <FinancePanel title="Add expense">
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} required />
          <Input label="Amount" type="number" value={form.amount} onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))} required />
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select className="w-full rounded-lg border border-surface-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}>
              {categories.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <Input label="Payment Method" value={form.paymentMethod} onChange={(e) => setForm((s) => ({ ...s, paymentMethod: e.target.value }))} />
          <Input label="Expense Date" type="date" value={form.expenseDate} onChange={(e) => setForm((s) => ({ ...s, expenseDate: e.target.value }))} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Receipt Image</label>
            <input type="file" accept="image/*,.pdf" onChange={(e) => setReceiptImage(e.target.files?.[0] || null)} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" loading={saving}>Save Expense</Button>
          </div>
        </form>
      </FinancePanel>

      <FinancePanel title="Expense list">
        <div className="space-y-2">
          {rows.map((r) => (
            <FinanceRow
              key={r._id}
              title={r.title}
              meta={`${new Date(r.expenseDate).toLocaleDateString()} | ${r.category} | ${r.paymentMethod || 'cash'}${r.sourcePayrollId ? ' | Payroll' : ''}`}
              amount={money(r.amount)}
              action={
                r.sourcePayrollId ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400">From payroll</span>
                ) : (
                  <Button type="button" size="sm" variant="danger" onClick={() => removeExpense(r._id)}><FiTrash2 className="mr-1" /> Delete</Button>
                )
              }
              danger={!r.sourcePayrollId}
            />
          ))}
          {rows.length === 0 && <EmptyState>No expenses yet.</EmptyState>}
        </div>
      </FinancePanel>
    </div>
  )
}

export default Expenses
