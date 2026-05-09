import React, { useEffect, useState } from 'react'
import { FiAlertTriangle, FiArchive, FiBox, FiDollarSign } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { EmptyState, FinanceMetric, FinancePageHeader, FinancePanel, FinanceRow, money } from './FinanceUI'

const UNITS = ['kg', 'gram', 'liter', 'piece', 'packet', 'bottle', 'other']

const Inventory = () => {
  const [items, setItems] = useState([])
  const [valuation, setValuation] = useState(0)
  const [lowStock, setLowStock] = useState(0)
  const [deadStock, setDeadStock] = useState(0)
  const [form, setForm] = useState({ name: '', unit: 'piece', quantity: 0, minimumStock: 0, costPerUnit: 0, supplier: '', category: 'general' })

  const load = async () => {
    try {
      const res = await api.get('/restaurant/inventory')
      setItems(res.data?.data?.items || [])
      setValuation(res.data?.data?.valuation || 0)
      setLowStock(res.data?.data?.lowStock || 0)
      setDeadStock(res.data?.data?.deadStock || 0)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load inventory')
    }
  }

  useEffect(() => { load() }, [])

  const addItem = async (e) => {
    e.preventDefault()
    try {
      await api.post('/restaurant/inventory', form)
      setForm({ name: '', unit: 'piece', quantity: 0, minimumStock: 0, costPerUnit: 0, supplier: '', category: 'general' })
      toast.success('Inventory item added')
      load()
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to add inventory item')
    }
  }

  return (
    <div className="space-y-6">
      <FinancePageHeader title="Inventory Accounting" subtitle="Track stock value, low stock risk and ingredient cost baselines." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FinanceMetric label="Inventory valuation" value={money(valuation)} icon={FiDollarSign} />
        <FinanceMetric label="Low stock alerts" value={lowStock} icon={FiAlertTriangle} tone="danger" />
        <FinanceMetric label="Dead stock" value={deadStock} icon={FiArchive} tone="warning" />
        <FinanceMetric label="Total items" value={items.length} icon={FiBox} tone="neutral" />
      </div>

      <FinancePanel title="Add inventory item">
        <form onSubmit={addItem} className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
          <div>
            <label className="mb-1 block text-sm font-medium">Unit</label>
            <select className="w-full rounded-lg border border-surface-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900" value={form.unit} onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm((s) => ({ ...s, quantity: Number(e.target.value) }))} />
          <Input label="Minimum Stock" type="number" value={form.minimumStock} onChange={(e) => setForm((s) => ({ ...s, minimumStock: Number(e.target.value) }))} />
          <Input label="Cost Per Unit" type="number" value={form.costPerUnit} onChange={(e) => setForm((s) => ({ ...s, costPerUnit: Number(e.target.value) }))} />
          <Input label="Supplier" value={form.supplier} onChange={(e) => setForm((s) => ({ ...s, supplier: e.target.value }))} />
          <Input label="Category" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} />
          <div className="md:col-span-3"><Button type="submit">Save Item</Button></div>
        </form>
      </FinancePanel>

      <FinancePanel title="Inventory list">
        <div className="space-y-2">
          {items.map((x) => {
            const low = Number(x.quantity) <= Number(x.minimumStock)
            return (
              <FinanceRow
                key={x._id}
                title={x.name}
                meta={`${x.category} | ${x.quantity} ${x.unit} | Min ${x.minimumStock}`}
                amount={`${money(x.costPerUnit)}/unit`}
                status={low ? 'Low stock' : 'In stock'}
                danger={low}
              />
            )
          })}
          {items.length === 0 && <EmptyState>No inventory items found.</EmptyState>}
        </div>
      </FinancePanel>
    </div>
  )
}

export default Inventory
