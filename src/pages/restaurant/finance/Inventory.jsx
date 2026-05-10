import React, { useEffect, useMemo, useState } from 'react'
import {
  FiActivity,
  FiAlertTriangle,
  FiArchive,
  FiBarChart2,
  FiBox,
  FiCalendar,
  FiDownload,
  FiFileText,
  FiPackage,
  FiPlus,
  FiPrinter,
  FiSearch,
  FiShoppingCart,
  FiTruck,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api from '../../../services/api'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import {
  EmptyState,
  FinanceChartBox,
  FinanceMetric,
  FinancePageHeader,
  FinancePanel,
  FinanceRow,
  FinanceTooltip,
  money,
} from './FinanceUI'

const UNITS = ['kg', 'gram', 'liter', 'ml', 'piece', 'packet', 'bottle', 'carton', 'box', 'other']
const CATEGORIES = ['Vegetables', 'Meat', 'Drinks', 'Dairy', 'Frozen', 'Packaging', 'Spices', 'General']
const TABS = ['Overview', 'Items', 'Suppliers', 'Purchases', 'Transactions', 'Waste', 'Analytics']
const chartColors = ['#8f2d0a', '#14b8a6', '#f97316', '#6366f1', '#ef4444', '#84cc16', '#0ea5e9']

const emptyItem = {
  name: '',
  category: 'General',
  unit: 'piece',
  purchaseUnit: '',
  conversionFactor: 1,
  quantity: 0,
  minimumStock: 0,
  costPerUnit: 0,
  supplier: '',
  supplierId: '',
  manufacturingDate: '',
  expiryDate: '',
  notes: '',
}

const emptyMovement = { inventoryItemId: '', type: 'stock_in', quantity: 0, reason: '', referenceNumber: '' }
const emptySupplier = { name: '', phone: '', address: '', panVat: '', paymentDue: 0, notes: '' }
const emptyPurchase = { inventoryItemId: '', supplierId: '', quantity: 0, unitCost: 0, paymentStatus: 'paid', supplierBillNumber: '', notes: '' }
const emptyPo = { supplierId: '', supplier: '', inventoryItemId: '', quantity: 0, unitCost: 0, expectedDate: '', notes: '' }

const statusTone = (item) => {
  const qty = Number(item.quantity || 0)
  const min = Number(item.minimumStock || 0)
  if (qty <= 0) return { label: 'Out of stock', cls: 'bg-gray-100 text-gray-700' }
  if (qty <= min * 0.5) return { label: 'Critical', cls: 'bg-red-100 text-red-700' }
  if (qty <= min) return { label: 'Low', cls: 'bg-yellow-100 text-yellow-800' }
  return { label: 'Healthy', cls: 'bg-emerald-100 text-emerald-700' }
}

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '-')

const downloadCsv = (filename, rows) => {
  if (!rows.length) {
    toast.error('No rows to export')
    return
  }
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const Inventory = () => {
  const [activeTab, setActiveTab] = useState('Overview')
  const [items, setItems] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [purchases, setPurchases] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [report, setReport] = useState(null)
  const [summary, setSummary] = useState({ valuation: 0, lowStock: 0, deadStock: 0, expiringSoon: 0 })
  const [search, setSearch] = useState('')
  const [itemForm, setItemForm] = useState(emptyItem)
  const [movementForm, setMovementForm] = useState(emptyMovement)
  const [supplierForm, setSupplierForm] = useState(emptySupplier)
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchase)
  const [poForm, setPoForm] = useState(emptyPo)
  const [loading, setLoading] = useState(false)

  const loadAll = async () => {
    try {
      const [invRes, supplierRes, txnRes, purchaseRes, reportRes, poRes] = await Promise.all([
        api.get('/restaurant/inventory', { params: { q: search || undefined } }),
        api.get('/restaurant/inventory/suppliers'),
        api.get('/restaurant/inventory/transactions'),
        api.get('/restaurant/inventory/purchases'),
        api.get('/restaurant/inventory/reports/summary'),
        api.get('/restaurant/inventory/purchase-orders'),
      ])
      const inv = invRes.data?.data || {}
      setItems(inv.items || [])
      setSummary({
        valuation: inv.valuation || 0,
        lowStock: inv.lowStock || 0,
        deadStock: inv.deadStock || 0,
        expiringSoon: inv.expiringSoon || 0,
      })
      setSuppliers(supplierRes.data?.data || [])
      setTransactions(txnRes.data?.data || [])
      setPurchases(purchaseRes.data?.data || [])
      setReport(reportRes.data?.data || null)
      setPurchaseOrders(poRes.data?.data || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load inventory')
    }
  }

  useEffect(() => { loadAll() }, [])

  const analytics = useMemo(() => {
    const byCategory = CATEGORIES.map((cat) => {
      const categoryItems = items.filter((item) => String(item.category || '').toLowerCase() === cat.toLowerCase())
      return {
        name: cat,
        value: categoryItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.costPerUnit || 0), 0),
        count: categoryItems.length,
      }
    }).filter((row) => row.value > 0 || row.count > 0)

    const usageMap = new Map()
    const wasteMap = new Map()
    transactions.forEach((txn) => {
      const item = txn.inventoryItemId
      const name = item?.name || 'Unknown item'
      const qty = Number(txn.quantity || 0)
      const cost = Number(txn.totalCost || 0)
      if (['usage', 'recipe_sale', 'stock_out'].includes(txn.type)) usageMap.set(name, (usageMap.get(name) || 0) + qty)
      if (txn.type === 'wastage') wasteMap.set(name, (wasteMap.get(name) || 0) + cost)
    })

    const mostUsed = [...usageMap.entries()].map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 8)
    const wasteTrend = [...wasteMap.entries()].map(([name, cost]) => ({ name, cost })).sort((a, b) => b.cost - a.cost).slice(0, 8)
    const expensive = [...items]
      .map((item) => ({ name: item.name, value: Number(item.costPerUnit || 0), stockValue: Number(item.quantity || 0) * Number(item.costPerUnit || 0) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
    const movement = [...transactions].slice(0, 20).reverse().map((txn) => ({
      date: new Date(txn.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      in: ['stock_in', 'purchase'].includes(txn.type) ? Number(txn.quantity || 0) : 0,
      out: ['stock_out', 'usage', 'wastage', 'recipe_sale'].includes(txn.type) ? Number(txn.quantity || 0) : 0,
    }))
    const forecast = items
      .map((item) => {
        const used30 = transactions
          .filter((txn) => String(txn.inventoryItemId?._id || txn.inventoryItemId) === String(item._id) && ['usage', 'recipe_sale', 'stock_out', 'wastage'].includes(txn.type))
          .reduce((sum, txn) => sum + Number(txn.quantity || 0), 0)
        const daily = used30 / 30
        return { ...item, dailyUsage: daily, daysLeft: daily > 0 ? Math.floor(Number(item.quantity || 0) / daily) : null }
      })
      .filter((item) => item.daysLeft !== null)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 6)
    return { byCategory, mostUsed, wasteTrend, expensive, movement, forecast }
  }, [items, transactions])

  const lowItems = items.filter((item) => Number(item.quantity || 0) <= Number(item.minimumStock || 0))
  const expiringItems = items.filter((item) => {
    if (!item.expiryDate) return false
    const expiry = new Date(item.expiryDate)
    const days = (expiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    return days <= 7
  })
  const wasteCost = transactions.filter((txn) => txn.type === 'wastage').reduce((sum, txn) => sum + Number(txn.totalCost || 0), 0)
  const pendingSupplierDue = suppliers.reduce((sum, supplier) => sum + Number(supplier.paymentDue || 0), 0)

  const saveItem = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await api.post('/restaurant/inventory', itemForm)
      toast.success('Inventory item saved')
      setItemForm(emptyItem)
      loadAll()
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to save item')
    } finally {
      setLoading(false)
    }
  }

  const postMovement = async (e) => {
    e.preventDefault()
    if (!movementForm.inventoryItemId) {
      toast.error('Please select an inventory item')
      return
    }
    if (Number(movementForm.quantity || 0) <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }
    try {
      await api.post('/restaurant/inventory/movements', movementForm)
      toast.success(movementForm.type === 'stock_in' ? 'Stock added' : 'Stock removed')
      setMovementForm(emptyMovement)
      loadAll()
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to record movement')
    }
  }

  const saveSupplier = async (e) => {
    e.preventDefault()
    try {
      await api.post('/restaurant/inventory/suppliers', supplierForm)
      toast.success('Supplier saved')
      setSupplierForm(emptySupplier)
      loadAll()
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to save supplier')
    }
  }

  const savePurchase = async (e) => {
    e.preventDefault()
    const item = items.find((x) => x._id === purchaseForm.inventoryItemId)
    if (!purchaseForm.inventoryItemId) {
      toast.error('Please select an inventory item')
      return
    }
    if (Number(purchaseForm.quantity || 0) <= 0) {
      toast.error('Purchase quantity must be greater than 0')
      return
    }
    try {
      await api.post('/restaurant/inventory/purchases', {
        ...purchaseForm,
        unitCost: Number(purchaseForm.unitCost || item?.costPerUnit || 0),
      })
      toast.success('Purchase recorded and stock increased')
      setPurchaseForm(emptyPurchase)
      loadAll()
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to record purchase')
    }
  }

  const savePurchaseOrder = async (e) => {
    e.preventDefault()
    if (!poForm.inventoryItemId) {
      toast.error('Please select an inventory item for the purchase order')
      return
    }
    if (Number(poForm.quantity || 0) <= 0) {
      toast.error('Purchase order quantity must be greater than 0')
      return
    }
    try {
      await api.post('/restaurant/inventory/purchase-orders', {
        supplierId: poForm.supplierId || null,
        supplier: poForm.supplier,
        expectedDate: poForm.expectedDate,
        notes: poForm.notes,
        items: [{ inventoryItemId: poForm.inventoryItemId, quantity: Number(poForm.quantity || 0), unitCost: Number(poForm.unitCost || 0) }],
      })
      toast.success('Purchase order created')
      setPoForm(emptyPo)
      loadAll()
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to create purchase order')
    }
  }

  const updatePoStatus = async (id, status) => {
    try {
      await api.patch(`/restaurant/inventory/purchase-orders/${id}/status`, { status })
      toast.success(status === 'delivered' ? 'PO delivered and stock updated' : 'PO updated')
      loadAll()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update PO')
    }
  }

  const exportItems = () => downloadCsv('inventory-valuation.csv', items.map((item) => ({
    Item: item.name,
    Category: item.category,
    Quantity: item.quantity,
    Unit: item.unit,
    Minimum: item.minimumStock,
    CostPerUnit: item.costPerUnit,
    StockValue: Number(item.quantity || 0) * Number(item.costPerUnit || 0),
    Supplier: item.supplierId?.name || item.supplier || '',
    Expiry: formatDate(item.expiryDate),
  })))

  const exportTransactions = () => downloadCsv('inventory-transactions.csv', transactions.map((txn) => ({
    Date: formatDate(txn.createdAt),
    Item: txn.inventoryItemId?.name || '',
    Action: txn.type,
    Quantity: txn.quantity,
    Unit: txn.inventoryItemId?.unit || '',
    Cost: txn.totalCost,
    Reference: txn.referenceNumber || '',
    Note: txn.note || '',
  })))

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Inventory Control"
        subtitle="Manage stock in/out, suppliers, purchase orders, waste, expiry alerts, recipe deductions and inventory valuation."
        actions={
          <>
            <Button type="button" variant="secondary" onClick={loadAll}><FiActivity className="mr-1" /> Refresh</Button>
            <Button type="button" variant="secondary" onClick={exportItems}><FiDownload className="mr-1" /> Export CSV</Button>
            <Button type="button" onClick={() => window.print()}><FiPrinter className="mr-1" /> Print Report</Button>
          </>
        }
      />

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-amber-100 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${activeTab === tab ? 'bg-primary-700 text-white shadow-md' : 'text-gray-600 hover:bg-primary-50 dark:text-gray-300 dark:hover:bg-gray-800'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <FinanceMetric label="Stock value" value={money(summary.valuation)} icon={FiPackage} />
        <FinanceMetric label="Low stock" value={summary.lowStock} icon={FiAlertTriangle} tone="danger" />
        <FinanceMetric label="Expiring soon" value={summary.expiringSoon} icon={FiCalendar} tone="warning" />
        <FinanceMetric label="Waste cost" value={money(wasteCost)} icon={FiArchive} tone="danger" />
        <FinanceMetric label="Supplier due" value={money(pendingSupplierDue)} icon={FiTruck} tone="neutral" />
      </div>

      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <FinancePanel title="Stock alerts" className="xl:col-span-2">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[...lowItems, ...expiringItems].slice(0, 8).map((item) => {
                const tone = statusTone(item)
                return (
                  <div key={`${item._id}-${item.expiryDate || 'stock'}`} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-gray-950">{item.name}</p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone.cls}`}>{tone.label}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{item.quantity} {item.unit} available, min {item.minimumStock}</p>
                    {item.expiryDate && <p className="mt-1 text-xs font-semibold text-orange-700">Expiry: {formatDate(item.expiryDate)}</p>}
                  </div>
                )
              })}
              {lowItems.length + expiringItems.length === 0 && <EmptyState>No low stock or expiry alerts right now.</EmptyState>}
            </div>
          </FinancePanel>

          <FinancePanel title="Forecasting">
            <div className="space-y-3">
              {analytics.forecast.map((item) => (
                <div key={item._id} className="rounded-2xl border border-surface-200 p-4">
                  <p className="font-bold text-gray-950 dark:text-gray-100">{item.name}</p>
                  <p className="mt-1 text-sm text-gray-500">Predicted finish in <span className="font-black text-primary-700">{item.daysLeft}</span> days</p>
                  <p className="text-xs text-gray-500">Daily usage avg {item.dailyUsage.toFixed(2)} {item.unit}</p>
                </div>
              ))}
              {analytics.forecast.length === 0 && <EmptyState>Forecast starts after usage or order recipe deductions are logged.</EmptyState>}
            </div>
          </FinancePanel>
        </div>
      )}

      {activeTab === 'Items' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <FinancePanel title="Add inventory item" className="xl:col-span-1">
            <form onSubmit={saveItem} className="space-y-3">
              <Input label="Item name" value={itemForm.name} onChange={(e) => setItemForm((s) => ({ ...s, name: e.target.value }))} required />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Category"
                  value={itemForm.category}
                  onValueChange={(value) => setItemForm((s) => ({ ...s, category: value }))}
                  options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                />
                <Select
                  label="Base unit"
                  value={itemForm.unit}
                  onValueChange={(value) => setItemForm((s) => ({ ...s, unit: value }))}
                  options={UNITS.map((u) => ({ value: u, label: u }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Quantity" type="number" value={itemForm.quantity} onChange={(e) => setItemForm((s) => ({ ...s, quantity: Number(e.target.value) }))} />
                <Input label="Minimum stock" type="number" value={itemForm.minimumStock} onChange={(e) => setItemForm((s) => ({ ...s, minimumStock: Number(e.target.value) }))} />
              </div>
              <Input label="Cost per unit" type="number" value={itemForm.costPerUnit} onChange={(e) => setItemForm((s) => ({ ...s, costPerUnit: Number(e.target.value) }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Purchase unit" value={itemForm.purchaseUnit} placeholder="carton / kg" onChange={(e) => setItemForm((s) => ({ ...s, purchaseUnit: e.target.value }))} />
                <Input label="Conversion factor" type="number" value={itemForm.conversionFactor} onChange={(e) => setItemForm((s) => ({ ...s, conversionFactor: Number(e.target.value) }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="MFG date" type="date" value={itemForm.manufacturingDate} onChange={(e) => setItemForm((s) => ({ ...s, manufacturingDate: e.target.value }))} />
                <Input label="Expiry date" type="date" value={itemForm.expiryDate} onChange={(e) => setItemForm((s) => ({ ...s, expiryDate: e.target.value }))} />
              </div>
              <Select
                label="Supplier"
                placeholder="Optional"
                value={itemForm.supplierId || ''}
                onValueChange={(value) => setItemForm((s) => ({ ...s, supplierId: value }))}
                options={suppliers.map((s) => ({ label: s.name, value: String(s._id) }))}
              />
              <Input label="Notes" value={itemForm.notes} onChange={(e) => setItemForm((s) => ({ ...s, notes: e.target.value }))} />
              <Button type="submit" loading={loading}><FiPlus className="mr-1" /> Save Item</Button>
            </form>
          </FinancePanel>

          <FinancePanel
            title="Inventory list"
            className="xl:col-span-2"
            actions={
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-3 text-gray-400" />
                <input className="w-72 rounded-xl border border-surface-300 py-2 pl-9 pr-3 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadAll()} placeholder="Search item" />
              </div>
            }
          >
            <div className="space-y-2">
              {items.map((item) => {
                const tone = statusTone(item)
                const stockValue = Number(item.quantity || 0) * Number(item.costPerUnit || 0)
                return (
                  <FinanceRow
                    key={item._id}
                    title={item.name}
                    meta={`${item.category || 'General'} | ${item.quantity} ${item.unit} | Min ${item.minimumStock} | ${item.purchaseUnit ? `1 ${item.purchaseUnit} = ${item.conversionFactor || 1} ${item.unit}` : 'base unit stock'}`}
                    amount={money(stockValue)}
                    status={tone.label}
                    danger={tone.label !== 'Healthy'}
                  />
                )
              })}
              {items.length === 0 && <EmptyState>No inventory items found.</EmptyState>}
            </div>
          </FinancePanel>
        </div>
      )}

      {activeTab === 'Suppliers' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <FinancePanel title="Add supplier">
            <form onSubmit={saveSupplier} className="space-y-3">
              <Input label="Name" value={supplierForm.name} onChange={(e) => setSupplierForm((s) => ({ ...s, name: e.target.value }))} required />
              <Input label="Phone" value={supplierForm.phone} onChange={(e) => setSupplierForm((s) => ({ ...s, phone: e.target.value }))} />
              <Input label="Address" value={supplierForm.address} onChange={(e) => setSupplierForm((s) => ({ ...s, address: e.target.value }))} />
              <Input label="PAN/VAT" value={supplierForm.panVat} onChange={(e) => setSupplierForm((s) => ({ ...s, panVat: e.target.value }))} />
              <Input label="Payment due" type="number" value={supplierForm.paymentDue} onChange={(e) => setSupplierForm((s) => ({ ...s, paymentDue: Number(e.target.value) }))} />
              <Input label="Notes" value={supplierForm.notes} onChange={(e) => setSupplierForm((s) => ({ ...s, notes: e.target.value }))} />
              <Button type="submit">Save Supplier</Button>
            </form>
          </FinancePanel>
          <FinancePanel title="Supplier history" className="xl:col-span-2">
            <div className="space-y-2">
              {suppliers.map((supplier) => (
                <FinanceRow key={supplier._id} title={supplier.name} meta={`${supplier.phone || '-'} | PAN/VAT ${supplier.panVat || '-'} | ${supplier.address || '-'}`} amount={money(supplier.paymentDue)} status={supplier.paymentDue > 0 ? 'Due' : 'Clear'} />
              ))}
              {suppliers.length === 0 && <EmptyState>No suppliers saved yet.</EmptyState>}
            </div>
          </FinancePanel>
        </div>
      )}

      {activeTab === 'Purchases' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <FinancePanel title="Stock in purchase">
            <form onSubmit={savePurchase} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Select
                label="Item"
                placeholder="Select item"
                value={purchaseForm.inventoryItemId || ''}
                onValueChange={(value) => setPurchaseForm((s) => ({ ...s, inventoryItemId: value }))}
                options={items.map((i) => ({ label: i.name, value: String(i._id) }))}
              />
              <Select
                label="Supplier"
                placeholder="Select supplier"
                value={purchaseForm.supplierId || ''}
                onValueChange={(value) => setPurchaseForm((s) => ({ ...s, supplierId: value }))}
                options={suppliers.map((s) => ({ label: s.name, value: String(s._id) }))}
              />
              <Input label="Quantity" type="number" value={purchaseForm.quantity} onChange={(e) => setPurchaseForm((s) => ({ ...s, quantity: Number(e.target.value) }))} />
              <Input label="Unit cost" type="number" value={purchaseForm.unitCost} onChange={(e) => setPurchaseForm((s) => ({ ...s, unitCost: Number(e.target.value) }))} />
              <Input label="Supplier bill no." value={purchaseForm.supplierBillNumber} onChange={(e) => setPurchaseForm((s) => ({ ...s, supplierBillNumber: e.target.value }))} />
              <Select
                label="Payment"
                value={purchaseForm.paymentStatus}
                onValueChange={(value) => setPurchaseForm((s) => ({ ...s, paymentStatus: value }))}
                options={['paid', 'pending', 'partial'].map((x) => ({ value: x, label: x }))}
              />
              <div className="md:col-span-2"><Input label="Notes" value={purchaseForm.notes} onChange={(e) => setPurchaseForm((s) => ({ ...s, notes: e.target.value }))} /></div>
              <div className="md:col-span-2"><Button type="submit"><FiShoppingCart className="mr-1" /> Record Purchase</Button></div>
            </form>
          </FinancePanel>

          <FinancePanel title="Purchase orders">
            <form onSubmit={savePurchaseOrder} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Select
                label="Supplier"
                placeholder="Select supplier"
                value={poForm.supplierId || ''}
                onValueChange={(value) => setPoForm((s) => ({ ...s, supplierId: value }))}
                options={suppliers.map((s) => ({ label: s.name, value: String(s._id) }))}
              />
              <Select
                label="Item"
                placeholder="Select item"
                value={poForm.inventoryItemId || ''}
                onValueChange={(value) => setPoForm((s) => ({ ...s, inventoryItemId: value }))}
                options={items.map((i) => ({ label: i.name, value: String(i._id) }))}
              />
              <Input label="Quantity" type="number" value={poForm.quantity} onChange={(e) => setPoForm((s) => ({ ...s, quantity: Number(e.target.value) }))} />
              <Input label="Unit cost" type="number" value={poForm.unitCost} onChange={(e) => setPoForm((s) => ({ ...s, unitCost: Number(e.target.value) }))} />
              <Input label="Expected date" type="date" value={poForm.expectedDate} onChange={(e) => setPoForm((s) => ({ ...s, expectedDate: e.target.value }))} />
              <Input label="Notes" value={poForm.notes} onChange={(e) => setPoForm((s) => ({ ...s, notes: e.target.value }))} />
              <div className="md:col-span-2"><Button type="submit">Create PO</Button></div>
            </form>
            <div className="mt-5 space-y-2">
              {purchaseOrders.map((po) => (
                <FinanceRow
                  key={po._id}
                  title={`${po.poNumber} - ${po.supplierId?.name || po.supplier || 'Supplier'}`}
                  meta={`${po.items?.map((i) => `${i.name} ${i.quantity} ${i.unit}`).join(', ')} | Expected ${formatDate(po.expectedDate)}`}
                  amount={money((po.items || []).reduce((sum, i) => sum + Number(i.quantity || 0) * Number(i.unitCost || 0), 0))}
                  status={po.status}
                  action={po.status !== 'delivered' && po.status !== 'cancelled' ? <Button type="button" size="sm" onClick={() => updatePoStatus(po._id, 'delivered')}>Mark Delivered</Button> : null}
                />
              ))}
            </div>
          </FinancePanel>

          <FinancePanel title="Purchase history" className="xl:col-span-2">
            <div className="space-y-2">
              {purchases.map((purchase) => (
                <FinanceRow key={purchase._id} title={purchase.inventoryItemId?.name || 'Purchase'} meta={`${formatDate(purchase.purchasedAt)} | ${purchase.quantity} ${purchase.inventoryItemId?.unit || ''} | ${purchase.supplierId?.name || purchase.supplier || 'Supplier'}`} amount={money(purchase.totalCost)} status={purchase.paymentStatus} />
              ))}
              {purchases.length === 0 && <EmptyState>No purchases recorded yet.</EmptyState>}
            </div>
          </FinancePanel>
        </div>
      )}

      {activeTab === 'Transactions' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <FinancePanel title="Add / remove stock">
            <form onSubmit={postMovement} className="space-y-3">
              <Select
                label="Item"
                placeholder="Select item"
                value={movementForm.inventoryItemId || ''}
                onValueChange={(value) => setMovementForm((s) => ({ ...s, inventoryItemId: value }))}
                options={items.map((i) => ({ label: i.name, value: String(i._id) }))}
              />
              <Select
                label="Action"
                value={movementForm.type}
                onValueChange={(value) => setMovementForm((s) => ({ ...s, type: value }))}
                options={[
                  { label: 'Add Stock', value: 'stock_in' },
                  { label: 'Remove Stock', value: 'stock_out' },
                  { label: 'Kitchen Usage', value: 'usage' },
                  { label: 'Wastage / Damage', value: 'wastage' },
                ]}
              />
              <Input label="Quantity" type="number" value={movementForm.quantity} onChange={(e) => setMovementForm((s) => ({ ...s, quantity: Number(e.target.value) }))} />
              <Input label="Reference" value={movementForm.referenceNumber} onChange={(e) => setMovementForm((s) => ({ ...s, referenceNumber: e.target.value }))} />
              <Input label="Reason / notes" value={movementForm.reason} onChange={(e) => setMovementForm((s) => ({ ...s, reason: e.target.value }))} />
              <Button type="submit">{movementForm.type === 'stock_in' ? 'Add Stock' : 'Remove Stock'}</Button>
            </form>
          </FinancePanel>

          <FinancePanel title="Transaction history" className="xl:col-span-2" actions={<Button type="button" variant="secondary" onClick={exportTransactions}><FiDownload className="mr-1" /> Export</Button>}>
            <TransactionTable transactions={transactions} />
          </FinancePanel>
        </div>
      )}

      {activeTab === 'Waste' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <FinanceMetric label="Monthly waste cost" value={money(wasteCost)} icon={FiArchive} tone="danger" />
          <FinanceMetric label="Waste entries" value={transactions.filter((txn) => txn.type === 'wastage').length} icon={FiFileText} tone="warning" />
          <FinanceMetric label="Pending bills" value={report?.purchases?.pendingBills || 0} icon={FiTruck} tone="neutral" />
          <FinancePanel title="Waste report" className="xl:col-span-3">
            <TransactionTable transactions={transactions.filter((txn) => txn.type === 'wastage')} />
          </FinancePanel>
        </div>
      )}

      {activeTab === 'Analytics' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartPanel title="Inventory value by category" empty={!analytics.byCategory.length}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={analytics.byCategory} dataKey="value" nameKey="name" outerRadius={105} label>
                  {analytics.byCategory.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                </Pie>
                <Tooltip content={<FinanceTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Most used ingredients" empty={!analytics.mostUsed.length}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.mostUsed}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<FinanceTooltip valuePrefix="" />} />
                <Bar dataKey="qty" name="Used qty" fill="#8f2d0a" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Stock movement" empty={!analytics.movement.length}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.movement}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<FinanceTooltip valuePrefix="" />} />
                <Area type="monotone" dataKey="in" name="Stock in" stroke="#14b8a6" fill="#99f6e4" />
                <Area type="monotone" dataKey="out" name="Stock out" stroke="#f97316" fill="#fed7aa" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Top expensive items" empty={!analytics.expensive.length}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.expensive}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<FinanceTooltip />} />
                <Bar dataKey="value" name="Cost/unit" fill="#6366f1" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>
      )}
    </div>
  )
}

function TransactionTable({ transactions }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-surface-200 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="py-3 pr-3">Date</th>
            <th className="py-3 pr-3">Item</th>
            <th className="py-3 pr-3">Action</th>
            <th className="py-3 pr-3">Qty</th>
            <th className="py-3 pr-3">Cost</th>
            <th className="py-3 pr-3">User / Note</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr key={txn._id} className="border-b border-surface-100">
              <td className="py-3 pr-3">{formatDate(txn.createdAt)}</td>
              <td className="py-3 pr-3 font-semibold">{txn.inventoryItemId?.name || '-'}</td>
              <td className="py-3 pr-3"><span className="rounded-full bg-primary-50 px-2 py-1 text-xs font-bold text-primary-700">{txn.type}</span></td>
              <td className="py-3 pr-3">{txn.quantity} {txn.inventoryItemId?.unit || ''}</td>
              <td className="py-3 pr-3 font-bold">{money(txn.totalCost)}</td>
              <td className="py-3 pr-3 text-gray-500">{txn.note || txn.referenceNumber || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {transactions.length === 0 && <EmptyState>No transactions found.</EmptyState>}
    </div>
  )
}

function ChartPanel({ title, empty, children }) {
  return (
    <FinancePanel title={title}>
      <FinanceChartBox empty={empty}>{children}</FinanceChartBox>
    </FinancePanel>
  )
}

export default Inventory
