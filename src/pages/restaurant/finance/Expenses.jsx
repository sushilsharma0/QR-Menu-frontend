import React, { useEffect, useState } from 'react'
import { FiCreditCard, FiPieChart, FiPlus, FiTrash2 } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../../services/api'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { EmptyState, FinanceMetric, FinancePageHeader, FinancePanel, FinanceRow, money } from './FinanceUI'

const categories = ['rent', 'electricity', 'gas', 'staff_salary', 'ingredients', 'marketing', 'maintenance', 'tax', 'internet', 'water', 'fuel', 'transportation', 'equipment', 'miscellaneous']
const manualExpenseCategories = categories.filter((c) => c !== 'staff_salary')
const FILE_MAX_BYTES = 1 * 1024 * 1024

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

  const handleReceiptImageChange = (event) => {
    const file = event.target.files?.[0] || null
    if (file && file.size > FILE_MAX_BYTES) {
      toast.error('Receipt file must be less than 1 MB')
      event.target.value = ''
      setReceiptImage(null)
      return
    }
    setReceiptImage(file)
  }

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
        subtitle="Operating costs and receipts. Staff salary is not added here—it is created automatically when you pay payroll. Raw ingredient cost tied to stock is recorded under Finance → Inventory → Raw use (ingredients lines appear below and roll into Profit & Loss)."
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
          <Select
            label="Category"
            value={form.category}
            onValueChange={(v) => setForm((s) => ({ ...s, category: v }))}
            options={manualExpenseCategories.map((x) => ({ value: x, label: x.replace(/_/g, ' ') }))}
          />
          <Input label="Payment Method" value={form.paymentMethod} onChange={(e) => setForm((s) => ({ ...s, paymentMethod: e.target.value }))} />
          <p className="text-xs text-gray-500 md:col-span-2 -mt-2">
            For the cash book: <span className="font-semibold">cash</span> reduces cash on hand;{' '}
            <span className="font-semibold">bank_transfer</span>, <span className="font-semibold">card</span>,{' '}
            <span className="font-semibold">upi</span>, or <span className="font-semibold">wallet</span> reduce bank balance. Pending expenses do not move balances.
          </p>
          <Input label="Expense Date" type="date" value={form.expenseDate} onChange={(e) => setForm((s) => ({ ...s, expenseDate: e.target.value }))} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Receipt Image</label>
            <input type="file" accept="image/*,.pdf" onChange={handleReceiptImageChange} />
            <p className="mt-1 text-xs text-gray-500">JPG, PNG, WEBP, GIF or PDF. Max 1 MB.</p>
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
              meta={`${new Date(r.expenseDate).toLocaleDateString()} | ${r.category} | ${r.paymentMethod || 'cash'}${r.sourcePayrollId ? ' | Payroll' : ''}${r.sourceInventoryLogId ? ' | Inventory use' : ''}`}
              amount={money(r.amount)}
              action={
                r.sourcePayrollId ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400">From payroll</span>
                ) : r.sourceInventoryLogId ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400">From inventory</span>
                ) : (
                  <Button type="button" size="sm" variant="danger" onClick={() => removeExpense(r._id)}><FiTrash2 className="mr-1" /> Delete</Button>
                )
              }
              danger={!r.sourcePayrollId && !r.sourceInventoryLogId}
            />
          ))}
          {rows.length === 0 && <EmptyState>No expenses yet.</EmptyState>}
        </div>
      </FinancePanel>
    </div>
  )
}

export default Expenses
