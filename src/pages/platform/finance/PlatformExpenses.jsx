import React, { useEffect, useState } from 'react'
import { FiCreditCard, FiPieChart, FiPlus, FiTrash2 } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../../services/api'
import { usePlatformPageLoad } from '../../../hooks/usePlatformPageLoad'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import PlatformPermissionGate from '../../../components/platform/PlatformPermissionGate'
import { PlatformPageHeader, PlatformPill, platformStatusStyles } from '../../../components/platform/PlatformUI'
import { FinanceMetric, FinancePanel, FinanceRow, money } from '../../restaurant/finance/FinanceUI'

const CATEGORY_LABELS = {
  equipment: 'Equipment (desk, computer, bench…)',
  office_supplies: 'Office supplies',
  rent: 'Rent',
  utilities: 'Utilities',
  internet: 'Internet',
  marketing: 'Marketing',
  software: 'Software & subscriptions',
  travel: 'Travel',
  professional_services: 'Professional services',
  maintenance: 'Maintenance',
  miscellaneous: 'Miscellaneous',
  staff_salary: 'Staff salary (payroll)',
}

export default function PlatformExpenses() {
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [manualCategories, setManualCategories] = useState([])
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'equipment',
    paymentMethod: 'bank_transfer',
    expenseDate: new Date().toISOString().slice(0, 10),
    description: '',
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const res = await api.get('/platform/finance/expenses')
      setRows(res.data?.data?.items || [])
      setSummary(res.data?.data?.summary || null)
      setManualCategories(res.data?.data?.manualCategories || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load expenses')
    }
  }

  usePlatformPageLoad(() => {
    load()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.post('/platform/finance/expenses', form)
      setForm({
        title: '',
        amount: '',
        category: 'equipment',
        paymentMethod: 'bank_transfer',
        expenseDate: new Date().toISOString().slice(0, 10),
        description: '',
      })
      toast.success('Expense added')
      load()
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to add expense')
    } finally {
      setSaving(false)
    }
  }

  const removeExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    try {
      await api.delete(`/platform/finance/expenses/${id}`)
      toast.success('Expense deleted')
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed')
    }
  }

  const categoryOptions = (manualCategories.length ? manualCategories : Object.keys(CATEGORY_LABELS).filter((c) => c !== 'staff_salary')).map(
    (value) => ({
      value,
      label: CATEGORY_LABELS[value] || value.replace(/_/g, ' '),
    }),
  )

  return (
    <PlatformPermissionGate permission="manageFinance">
      <div className="space-y-6">
        <PlatformPageHeader
          badge="Finance"
          title="Platform expenses"
          description="Record purchases like computers, desks, and benches. Staff salary is added automatically when you mark payroll as paid."
          icon={FiCreditCard}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FinanceMetric label="This month" value={money(summary?.totalMonthlyExpense)} icon={FiCreditCard} tone="warning" />
          <FinanceMetric label="Top category" value={summary?.highestExpenseCategory?.replace(/_/g, ' ') || '—'} icon={FiPieChart} tone="neutral" />
          <FinanceMetric label="Payroll-linked" value={summary?.payrollLinkedCount ?? 0} icon={FiPlus} />
        </div>

        <FinancePanel title="Add purchase / expense">
          <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              label="Title"
              placeholder="e.g. Office desk, Dell laptop"
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              required
            />
            <Input
              label="Amount (₹)"
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
              required
            />
            <Select
              label="Category"
              value={form.category}
              onValueChange={(v) => setForm((s) => ({ ...s, category: v }))}
              options={categoryOptions}
            />
            <Select
              label="Payment method"
              value={form.paymentMethod}
              onValueChange={(v) => setForm((s) => ({ ...s, paymentMethod: v }))}
              options={[
                { value: 'bank_transfer', label: 'Bank transfer' },
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Card' },
                { value: 'upi', label: 'UPI' },
                { value: 'wallet', label: 'Wallet' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <Input
              label="Expense date"
              type="date"
              value={form.expenseDate}
              onChange={(e) => setForm((s) => ({ ...s, expenseDate: e.target.value }))}
              required
            />
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            />
            <div className="md:col-span-2">
              <Button type="submit" loading={saving}>
                Save expense
              </Button>
            </div>
          </form>
        </FinancePanel>

        <FinancePanel title="Expense list">
          <div className="space-y-2">
            {rows.map((r) => (
              <FinanceRow
                key={r._id}
                title={r.title}
                meta={`${new Date(r.expenseDate).toLocaleDateString()} · ${CATEGORY_LABELS[r.category] || r.category}${r.sourcePayrollId ? ' · From payroll' : ''}`}
                amount={money(r.amount)}
                action={
                  r.sourcePayrollId ? (
                    <PlatformPill className={platformStatusStyles.pending}>Payroll</PlatformPill>
                  ) : (
                    <Button type="button" size="sm" variant="danger" onClick={() => removeExpense(r._id)}>
                      <FiTrash2 className="mr-1" /> Delete
                    </Button>
                  )
                }
              />
            ))}
            {rows.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No expenses yet.</p>}
          </div>
        </FinancePanel>
      </div>
    </PlatformPermissionGate>
  )
}
