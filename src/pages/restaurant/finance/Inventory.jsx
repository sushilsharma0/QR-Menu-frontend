import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import Card from '../../../components/common/Card'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'

const Inventory = () => {
  const [items, setItems] = useState([])
  const [valuation, setValuation] = useState(0)
  const [lowStock, setLowStock] = useState(0)
  const [deadStock, setDeadStock] = useState(0)
  const UNITS = ['kg', 'gram', 'liter', 'piece', 'packet', 'bottle', 'other']
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
      <h1 className="text-2xl font-black">Inventory Accounting</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Inventory valuation"><p className="text-2xl font-black">Rs. {Number(valuation).toLocaleString()}</p></Card>
        <Card title="Low stock alerts"><p className="text-2xl font-black text-red-600">{lowStock}</p></Card>
        <Card title="Dead stock (qty = 0)"><p className="text-2xl font-black text-amber-700">{deadStock}</p></Card>
        <Card title="Total items"><p className="text-2xl font-black">{items.length}</p></Card>
      </div>

      <Card title="Add inventory item">
        <form onSubmit={addItem} className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
          <div>
            <label className="mb-1 block text-sm font-medium">Unit</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={form.unit}
              onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm((s) => ({ ...s, quantity: Number(e.target.value) }))} />
          <Input label="Minimum Stock" type="number" value={form.minimumStock} onChange={(e) => setForm((s) => ({ ...s, minimumStock: Number(e.target.value) }))} />
          <Input label="Cost Per Unit" type="number" value={form.costPerUnit} onChange={(e) => setForm((s) => ({ ...s, costPerUnit: Number(e.target.value) }))} />
          <Input label="Supplier" value={form.supplier} onChange={(e) => setForm((s) => ({ ...s, supplier: e.target.value }))} />
          <Input label="Category" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} />
          <div className="md:col-span-3"><Button type="submit">Save Item</Button></div>
        </form>
      </Card>

      <Card title="Inventory list">
        <div className="space-y-2">
          {items.map((x) => (
            <div key={x._id} className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="font-semibold">{x.name}</p>
                <p className="text-xs text-gray-500">{x.category} • {x.quantity} {x.unit}</p>
              </div>
              <p className={`text-sm font-semibold ${Number(x.quantity) <= Number(x.minimumStock) ? 'text-red-600' : 'text-gray-700'}`}>
                Min {x.minimumStock} • Rs. {Number(x.costPerUnit).toLocaleString()}/unit
              </p>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-gray-500">No inventory items found.</p>}
        </div>
      </Card>
    </div>
  )
}

export default Inventory
