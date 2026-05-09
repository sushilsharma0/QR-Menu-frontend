import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import Card from '../../../components/common/Card'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'

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

  useEffect(() => {
    load()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (receiptImage) fd.append('receiptImage', receiptImage)
      await api.post('/restaurant/finance/expenses', fd)
      setForm({
        title: '',
        amount: '',
        category: 'miscellaneous',
        paymentMethod: 'cash',
        expenseDate: new Date().toISOString().slice(0, 10),
        description: '',
      })
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
      <h1 className="text-2xl font-black">Expense Management</h1>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Monthly expense">
          <p className="text-2xl font-black text-primary-700">Rs. {Number(summary?.totalMonthlyExpense || 0).toLocaleString()}</p>
        </Card>
        <Card title="Highest category">
          <p className="text-lg font-semibold capitalize">{summary?.highestExpenseCategory || '-'}</p>
        </Card>
      </div>

      <Card title="Add Expense">
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} required />
          <Input label="Amount" type="number" value={form.amount} onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))} required />
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select className="w-full rounded-lg border px-3 py-2" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}>
              {['rent', 'electricity', 'gas', 'staff_salary', 'ingredients', 'marketing', 'maintenance', 'tax', 'internet', 'water', 'fuel', 'transportation', 'equipment', 'miscellaneous'].map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
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
      </Card>

      <Card title="Expense List">
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r._id} className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="font-semibold">{r.title}</p>
                <p className="text-xs text-gray-500">{new Date(r.expenseDate).toLocaleDateString()} • {r.category}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-primary-700">Rs. {Number(r.amount || 0).toLocaleString()}</span>
                <Button type="button" variant="danger" onClick={() => removeExpense(r._id)}>Delete</Button>
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="text-sm text-gray-500">No expenses yet.</p>}
        </div>
      </Card>
    </div>
  )
}

export default Expenses
