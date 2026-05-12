import React, { useEffect, useMemo, useState } from 'react'
import {
  FiActivity,
  FiAlertTriangle,
  FiArchive,
  FiBarChart2,
  FiCalendar,
  FiChevronDown,
  FiCreditCard,
  FiDollarSign,
  FiDownload,
  FiEdit2,
  FiFileText,
  FiPackage,
  FiPlus,
  FiPrinter,
  FiSearch,
  FiShoppingCart,
  FiTrash2,
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
  FinanceTooltip,
  money,
} from './FinanceUI'

const UNITS = ['kg', 'gram', 'liter', 'ml', 'piece', 'packet', 'bottle', 'carton', 'box', 'other']
const CATEGORIES = ['Vegetables', 'Meat', 'Drinks', 'Dairy', 'Frozen', 'Packaging', 'Spices', 'General']
const TABS = ['Overview', 'Items', 'Raw use', 'Suppliers', 'Purchases', 'Transactions', 'Waste', 'Analytics']
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
const emptyRawUse = { inventoryItemId: '', quantity: 0, reason: '', referenceNumber: '', ingredientsPaidFrom: 'cash' }
const emptyWaste = { inventoryItemId: '', quantity: 0, reason: '', referenceNumber: '' }
const emptySupplier = { name: '', phone: '', address: '', panVat: '', paymentDue: 0, notes: '' }
const emptyPurchase = { inventoryItemId: '', supplierId: '', quantity: 0, unitCost: 0, paymentStatus: 'paid', paymentSource: 'cash', supplierBillNumber: '', notes: '' }
const emptyPurchaseEdit = { _id: '', quantity: 0, unitCost: 0, paymentStatus: 'paid', paymentSource: 'cash', supplierBillNumber: '', notes: '', supplierId: '' }

const statusTone = (item) => {
  const qty = Number(item.quantity || 0)
  const min = Number(item.minimumStock || 0)
  if (qty <= 0) return { label: 'Out of stock', cls: 'bg-gray-100 text-gray-700' }
  if (qty <= min * 0.5) return { label: 'Critical', cls: 'bg-red-100 text-red-700' }
  if (qty <= min) return { label: 'Low', cls: 'bg-yellow-100 text-yellow-800' }
  return { label: 'Healthy', cls: 'bg-emerald-100 text-emerald-700' }
}

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '-')

const toInputDate = (d) => {
  if (!d) return ''
  const x = new Date(d)
  if (Number.isNaN(x.getTime())) return ''
  return x.toISOString().slice(0, 10)
}

const apiItemToForm = (item) => ({
  name: item.name || '',
  category: item.category || 'General',
  unit: item.unit || 'piece',
  purchaseUnit: item.purchaseUnit || '',
  conversionFactor: item.conversionFactor ?? 1,
  quantity: Number(item.quantity ?? 0),
  minimumStock: Number(item.minimumStock ?? 0),
  costPerUnit: Number(item.costPerUnit ?? 0),
  supplier: item.supplier || '',
  supplierId: item.supplierId?._id ? String(item.supplierId._id) : item.supplierId ? String(item.supplierId) : '',
  manufacturingDate: toInputDate(item.manufacturingDate),
  expiryDate: toInputDate(item.expiryDate),
  notes: item.notes || '',
})

function formatForecastQty(value, unit) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return `0 ${unit || ''}`.trim()
  const u = unit ? ` ${unit}` : ''
  const abs = Math.abs(n)
  const decimals = abs >= 100 ? 1 : abs >= 10 ? 2 : abs >= 1 ? 2 : 3
  return `${n.toLocaleString('en-IN', { maximumFractionDigits: decimals, minimumFractionDigits: 0 })}${u}`
}

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
  const [report, setReport] = useState(null)
  const [cashBook, setCashBook] = useState({ cashBalance: 0, bankBalance: 0 })
  const [cashBookDraft, setCashBookDraft] = useState({ cashBalance: '', bankBalance: '' })
  const [summary, setSummary] = useState({ valuation: 0, lowStock: 0, deadStock: 0, expiringSoon: 0 })
  const [search, setSearch] = useState('')
  const [itemForm, setItemForm] = useState(emptyItem)
  const [editingItemId, setEditingItemId] = useState(null)
  const [movementForm, setMovementForm] = useState(emptyMovement)
  const [rawUseForm, setRawUseForm] = useState(emptyRawUse)
  const [wasteForm, setWasteForm] = useState(emptyWaste)
  const [supplierForm, setSupplierForm] = useState(emptySupplier)
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchase)
  const [purchaseEdit, setPurchaseEdit] = useState(null)
  const [loading, setLoading] = useState(false)
  /** Items tab: show category, unit, qty, cost, supplier, etc. */
  const [itemFormAdvancedOpen, setItemFormAdvancedOpen] = useState(false)

  const loadAll = async () => {
    try {
      const from90 = new Date()
      from90.setDate(from90.getDate() - 90)
      const [invRes, supplierRes, txnRes, purchaseRes, reportRes, cbRes] = await Promise.all([
        api.get('/restaurant/inventory', { params: { q: search || undefined } }),
        api.get('/restaurant/inventory/suppliers'),
        api.get('/restaurant/inventory/transactions', {
          params: { limit: 4000, from: from90.toISOString() },
        }),
        api.get('/restaurant/inventory/purchases'),
        api.get('/restaurant/inventory/reports/summary'),
        api.get('/restaurant/inventory/cash-book'),
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
      const cb = cbRes.data?.data || {}
      setCashBook({
        cashBalance: Number(cb.cashBalance || 0),
        bankBalance: Number(cb.bankBalance || 0),
      })
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load inventory')
    }
  }

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    setCashBookDraft({
      cashBalance: String(cashBook.cashBalance ?? ''),
      bankBalance: String(cashBook.bankBalance ?? ''),
    })
  }, [cashBook.cashBalance, cashBook.bankBalance])

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
    const FORECAST_MS = 30 * 24 * 60 * 60 * 1000
    const windowStart = Date.now() - FORECAST_MS
    const outTypes = ['usage', 'recipe_sale', 'stock_out', 'wastage']
    const forecast = items
      .map((item) => {
        const relevant = transactions.filter((txn) => {
          if (String(txn.inventoryItemId?._id || txn.inventoryItemId) !== String(item._id)) return false
          if (!outTypes.includes(txn.type)) return false
          const t = new Date(txn.createdAt).getTime()
          return !Number.isNaN(t) && t >= windowStart
        })
        const usedInWindow = relevant.reduce((sum, txn) => sum + Number(txn.quantity || 0), 0)
        if (usedInWindow <= 0) return null
        const activeDays = new Set(relevant.map((txn) => new Date(txn.createdAt).toISOString().slice(0, 10))).size
        const denomDays = Math.max(1, Math.min(30, activeDays))
        const dailyUsage = usedInWindow / denomDays
        const daysLeft = dailyUsage > 0 ? Math.floor(Number(item.quantity || 0) / dailyUsage) : null
        return {
          ...item,
          dailyUsage,
          daysLeft,
          usedInWindow,
          activeDays,
        }
      })
      .filter(Boolean)
      .filter((row) => row.daysLeft !== null)
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
  const itemsListFilter = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        String(item.name || '').toLowerCase().includes(q) ||
        String(item.category || '').toLowerCase().includes(q),
    )
  }, [items, search])
  const wasteCost = transactions.filter((txn) => txn.type === 'wastage').reduce((sum, txn) => sum + Number(txn.totalCost || 0), 0)
  const pendingSupplierDue = suppliers.reduce((sum, supplier) => sum + Number(supplier.paymentDue || 0), 0)

  const rawUseSelectedItem = useMemo(
    () => items.find((x) => String(x._id) === String(rawUseForm.inventoryItemId)),
    [items, rawUseForm.inventoryItemId],
  )
  const rawUseLineCost = useMemo(() => {
    const qty = Number(rawUseForm.quantity || 0)
    const cpu = Number(rawUseSelectedItem?.costPerUnit || 0)
    return qty * cpu
  }, [rawUseForm.quantity, rawUseSelectedItem])

  const saveItem = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (editingItemId) {
        await api.patch(`/restaurant/inventory/${editingItemId}`, itemForm)
        toast.success('Inventory item updated')
      } else {
        await api.post('/restaurant/inventory', itemForm)
        toast.success('Inventory item saved')
      }
      setItemForm(emptyItem)
      setEditingItemId(null)
      setItemFormAdvancedOpen(false)
      loadAll()
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to save item')
    } finally {
      setLoading(false)
    }
  }

  const cancelItemEdit = () => {
    setEditingItemId(null)
    setItemForm(emptyItem)
    setItemFormAdvancedOpen(false)
  }

  const beginEditItem = (item) => {
    setActiveTab('Items')
    setEditingItemId(String(item._id))
    setItemForm(apiItemToForm(item))
    setItemFormAdvancedOpen(true)
  }

  const removeItem = async (item) => {
    if (
      !window.confirm(
        `Delete "${item.name}" from inventory? It will be hidden from lists; existing purchase and movement history is kept.`,
      )
    ) {
      return
    }
    try {
      setLoading(true)
      await api.delete(`/restaurant/inventory/${item._id}`)
      toast.success('Item removed')
      if (editingItemId === String(item._id)) cancelItemEdit()
      loadAll()
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to delete item')
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
      const res = await api.post('/restaurant/inventory/movements', movementForm)
      const expense = res.data?.data?.expense
      if (movementForm.type === 'usage' && expense) {
        toast.success('Stock reduced and ingredients expense added for P&L')
      } else {
        toast.success(movementForm.type === 'stock_in' ? 'Stock added' : 'Stock removed')
      }
      setMovementForm(emptyMovement)
      loadAll()
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to record movement')
    }
  }

  const postRawUse = async (e) => {
    e.preventDefault()
    if (!rawUseForm.inventoryItemId) {
      toast.error('Please select a raw material item')
      return
    }
    if (Number(rawUseForm.quantity || 0) <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }
    try {
      const res = await api.post('/restaurant/inventory/movements', {
        inventoryItemId: rawUseForm.inventoryItemId,
        quantity: Number(rawUseForm.quantity),
        type: 'usage',
        reason: rawUseForm.reason,
        referenceNumber: rawUseForm.referenceNumber,
        syncIngredientsExpense: true,
        ingredientsPaidFrom: rawUseForm.ingredientsPaidFrom,
      })
      if (res.data?.data?.expense) {
        toast.success('Usage saved — stock reduced and cost posted to Expenses (ingredients)')
      } else {
        toast.success('Usage saved — stock reduced (no cost recorded; set cost per unit on the item)')
      }
      setRawUseForm(emptyRawUse)
      loadAll()
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to record raw material use')
    }
  }

  const postWaste = async (e) => {
    e.preventDefault()
    if (!wasteForm.inventoryItemId) {
      toast.error('Please select an inventory item')
      return
    }
    if (Number(wasteForm.quantity || 0) <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }
    try {
      await api.post('/restaurant/inventory/movements', {
        inventoryItemId: wasteForm.inventoryItemId,
        quantity: Number(wasteForm.quantity),
        type: 'wastage',
        reason: wasteForm.reason,
        referenceNumber: wasteForm.referenceNumber,
      })
      toast.success('Waste recorded — stock reduced')
      setWasteForm(emptyWaste)
      loadAll()
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to record waste')
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

  const saveCashBookOpening = async (e) => {
    e.preventDefault()
    try {
      const cashBalance = Number(cashBookDraft.cashBalance)
      const bankBalance = Number(cashBookDraft.bankBalance)
      if (!Number.isFinite(cashBalance) || !Number.isFinite(bankBalance)) {
        toast.error('Enter valid numbers for cash and bank')
        return
      }
      const res = await api.patch('/restaurant/inventory/cash-book', { cashBalance, bankBalance })
      const d = res.data?.data || {}
      setCashBook({ cashBalance: Number(d.cashBalance || 0), bankBalance: Number(d.bankBalance || 0) })
      toast.success('Cash & bank balances updated')
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to update balances')
    }
  }

  const beginEditPurchase = (purchase) => {
    setPurchaseEdit({
      _id: purchase._id,
      itemName: purchase.inventoryItemId?.name || 'Purchase',
      unit: purchase.inventoryItemId?.unit || '',
      quantity: Number(purchase.quantity || 0),
      unitCost: Number(purchase.unitCost || 0),
      paymentStatus: purchase.paymentStatus || 'paid',
      paymentSource: purchase.paymentSource || 'cash',
      supplierBillNumber: purchase.supplierBillNumber || '',
      notes: purchase.notes || '',
      supplierId: purchase.supplierId?._id || purchase.supplierId || '',
    })
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

  const saveEditPurchase = async (e) => {
    e.preventDefault()
    if (!purchaseEdit?._id) return
    if (Number(purchaseEdit.quantity) <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }
    try {
      await api.patch(`/restaurant/inventory/purchases/${purchaseEdit._id}`, {
        quantity: Number(purchaseEdit.quantity),
        unitCost: Number(purchaseEdit.unitCost),
        paymentStatus: purchaseEdit.paymentStatus,
        paymentSource: purchaseEdit.paymentSource,
        supplierBillNumber: purchaseEdit.supplierBillNumber,
        notes: purchaseEdit.notes,
        supplierId: purchaseEdit.supplierId || null,
      })
      toast.success('Purchase updated — stock adjusted')
      setPurchaseEdit(null)
      loadAll()
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to update purchase')
    }
  }

  const deletePurchase = async (purchase) => {
    const itemName = purchase.inventoryItemId?.name || 'this purchase'
    const qty = Number(purchase.quantity || 0)
    const unit = purchase.inventoryItemId?.unit || ''
    if (!window.confirm(
      `Delete this purchase?\n\nThis will reverse ${qty} ${unit} from "${itemName}" stock. ` +
      `Use this only to undo a mistaken entry.`,
    )) {
      return
    }
    try {
      await api.delete(`/restaurant/inventory/purchases/${purchase._id}`)
      toast.success('Purchase deleted and stock reversed')
      loadAll()
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to delete purchase')
    }
  }

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
        subtitle="Stock purchases, manual raw-material use (COGS), waste, and valuation. Record kitchen consumption under Raw use — that lowers quantity on hand and posts an ingredients expense for Profit & Loss."
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
            onClick={() => {
              setActiveTab(tab)
              if (tab !== 'Items') setItemFormAdvancedOpen(false)
            }}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${activeTab === tab ? 'bg-primary-700 text-white shadow-md' : 'text-gray-600 hover:bg-primary-50 dark:text-gray-300 dark:hover:bg-gray-800'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab !== 'Items' && (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-7">
        <FinanceMetric label="Stock value" value={money(summary.valuation)} icon={FiPackage} />
        <FinanceMetric label="Low stock" value={summary.lowStock} icon={FiAlertTriangle} tone="danger" />
        <FinanceMetric label="Expiring soon" value={summary.expiringSoon} icon={FiCalendar} tone="warning" />
        <FinanceMetric label="Waste cost" value={money(wasteCost)} icon={FiArchive} tone="danger" />
        <FinanceMetric label="Supplier due" value={money(pendingSupplierDue)} icon={FiTruck} tone="neutral" />
        <FinanceMetric label="Cash on hand" value={money(cashBook.cashBalance)} icon={FiDollarSign} tone="neutral" />
        <FinanceMetric label="Bank balance" value={money(cashBook.bankBalance)} icon={FiCreditCard} tone="neutral" />
      </div>
      )}

      {activeTab === 'Overview' && (
        <div className="flex flex-col gap-6">
          <FinancePanel title="Cash & bank (running balances)">
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Set your opening figures here, then the app moves money when you record a <strong>paid</strong> stock purchase (choose cash or bank on the Purchases tab),
              add a paid expense (cash vs card/bank/UPI), pay payroll, or post raw-material use with a paid-from choice. Pending supplier bills do not change these balances until marked paid.
            </p>
            <form onSubmit={saveCashBookOpening} className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Input
                label="Cash balance"
                type="number"
                value={cashBookDraft.cashBalance}
                onChange={(e) => setCashBookDraft((s) => ({ ...s, cashBalance: e.target.value }))}
              />
              <Input
                label="Bank balance"
                type="number"
                value={cashBookDraft.bankBalance}
                onChange={(e) => setCashBookDraft((s) => ({ ...s, bankBalance: e.target.value }))}
              />
              <div className="flex items-end">
                <Button type="submit">Save balances</Button>
              </div>
            </form>
          </FinancePanel>
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
                  <p className="mt-1 text-sm text-gray-500">
                    Predicted finish in <span className="font-black text-primary-700">{item.daysLeft}</span> days
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Last 30 days: {formatForecastQty(item.usedInWindow, item.unit)} out · avg{' '}
                    {formatForecastQty(item.dailyUsage, item.unit)}/day
                    <span className="text-gray-400"> ({item.activeDays} active day{item.activeDays !== 1 ? 's' : ''})</span>
                  </p>
                </div>
              ))}
              {analytics.forecast.length === 0 && (
                <EmptyState>
                  Forecast uses usage, waste, and stock-out in the last 30 days (loaded from your transaction history). Log Raw use or Waste
                  to see projections.
                </EmptyState>
              )}
            </div>
          </FinancePanel>
        </div>
        </div>
      )}

      {activeTab === 'Items' && (
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-amber-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-1 border-b border-amber-100/80 px-4 py-4 dark:border-gray-800 sm:px-6">
              <h2 className="text-lg font-black text-gray-950 dark:text-gray-100">
                {editingItemId ? 'Edit item' : 'Quick add item'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter name, minimum stock, and optional expiry. Use <span className="font-semibold text-gray-700 dark:text-gray-300">More fields</span> for unit, opening quantity, cost, and supplier.
              </p>
            </div>
            <form onSubmit={saveItem} className="space-y-5 px-4 py-5 sm:px-6">
              {editingItemId && (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  Editing this item — save to apply, cancel to discard.
                </p>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-1">
                  <Input
                    label="Item name"
                    value={itemForm.name}
                    onChange={(e) => setItemForm((s) => ({ ...s, name: e.target.value }))}
                    required
                  />
                </div>
                <Input
                  label="Minimum stock"
                  type="number"
                  min={0}
                  value={itemForm.minimumStock}
                  onChange={(e) => setItemForm((s) => ({ ...s, minimumStock: Number(e.target.value) }))}
                />
                <Input
                  label="Expiry date (optional)"
                  type="date"
                  value={itemForm.expiryDate}
                  onChange={(e) => setItemForm((s) => ({ ...s, expiryDate: e.target.value }))}
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setItemFormAdvancedOpen((o) => !o)}
                  aria-expanded={itemFormAdvancedOpen}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-left text-sm font-bold text-gray-800 transition hover:bg-amber-50/80 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  <span>More fields — category, unit, quantity, cost, supplier…</span>
                  <FiChevronDown
                    className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${itemFormAdvancedOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                {itemFormAdvancedOpen && (
                  <div className="mt-4 space-y-4 rounded-xl border border-dashed border-amber-200/80 bg-[#fffdf8] p-4 dark:border-gray-700 dark:bg-gray-950/80">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input
                        label="Opening quantity"
                        type="number"
                        value={itemForm.quantity}
                        onChange={(e) => setItemForm((s) => ({ ...s, quantity: Number(e.target.value) }))}
                      />
                      <Input
                        label="Cost per unit"
                        type="number"
                        value={itemForm.costPerUnit}
                        onChange={(e) => setItemForm((s) => ({ ...s, costPerUnit: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input
                        label="Purchase unit"
                        value={itemForm.purchaseUnit}
                        placeholder="e.g. carton, bag"
                        onChange={(e) => setItemForm((s) => ({ ...s, purchaseUnit: e.target.value }))}
                      />
                      <Input
                        label="Conversion factor"
                        type="number"
                        value={itemForm.conversionFactor}
                        onChange={(e) => setItemForm((s) => ({ ...s, conversionFactor: Number(e.target.value) }))}
                      />
                    </div>
                    <Input
                      label="Manufacturing date (optional)"
                      type="date"
                      value={itemForm.manufacturingDate}
                      onChange={(e) => setItemForm((s) => ({ ...s, manufacturingDate: e.target.value }))}
                    />
                    <Select
                      label="Supplier"
                      placeholder="Optional"
                      value={itemForm.supplierId || ''}
                      onValueChange={(value) => setItemForm((s) => ({ ...s, supplierId: value }))}
                      searchable
                      searchPlaceholder="Search supplier…"
                      options={suppliers.map((s) => ({ label: s.name, value: String(s._id) }))}
                    />
                    <Input label="Notes" value={itemForm.notes} onChange={(e) => setItemForm((s) => ({ ...s, notes: e.target.value }))} />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-surface-100 pt-4 dark:border-gray-800">
                <Button type="submit" loading={loading}>
                  {editingItemId ? (
                    <>
                      <FiEdit2 className="mr-1" /> Save changes
                    </>
                  ) : (
                    <>
                      <FiPlus className="mr-1" /> Add item
                    </>
                  )}
                </Button>
                {editingItemId && (
                  <Button type="button" variant="secondary" onClick={cancelItemEdit}>
                    Cancel edit
                  </Button>
                )}
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-4 border-b border-amber-100/80 px-4 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-lg font-black text-gray-950 dark:text-gray-100">All items</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {search.trim()
                    ? `${itemsListFilter.length} match${itemsListFilter.length === 1 ? '' : 'es'} for “${search.trim()}” (of ${items.length} loaded). Press Enter to fetch from server.`
                    : `${itemsListFilter.length} item${itemsListFilter.length === 1 ? '' : 's'} — list view below.`}
                </p>
              </div>
              <div className="relative w-full sm:max-w-md">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full rounded-xl border border-surface-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadAll()}
                  placeholder="Filter by name or category… (Enter = reload from server)"
                />
              </div>
            </div>
              <div className="max-h-[min(70vh,920px)] overflow-y-auto p-4 sm:p-6">
                {itemsListFilter.length === 0 ? (
                  <div className="py-16">
                    <EmptyState>
                      {items.length === 0
                        ? 'No inventory items yet. Add one with the form above.'
                        : 'No items match this filter. Clear the search box or press Enter to reload from the server.'}
                    </EmptyState>
                  </div>
                ) : (
                  <InventoryItemsTable items={itemsListFilter} onEdit={beginEditItem} onRemove={removeItem} />
                )}
              </div>
          </section>
        </div>
      )}

      {activeTab === 'Raw use' && (
        <div className="flex flex-col gap-6">
          <FinancePanel title="Record raw material use">
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              Choose an inventory item and how much you used. Stock goes down by that amount. Cost is quantity × <strong>cost per unit</strong> on the item; the same value is posted as an <strong>ingredients</strong> expense so Profit & Loss matches your sell-side COGS.
            </p>
            <form onSubmit={postRawUse} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Select
                label="Raw material (inventory item)"
                placeholder="Select item"
                value={rawUseForm.inventoryItemId || ''}
                onValueChange={(value) => setRawUseForm((s) => ({ ...s, inventoryItemId: value }))}
                searchable
                searchPlaceholder="Search by item name…"
                options={items.map((i) => ({
                  label: `${i.name} (${i.quantity} ${i.unit} on hand)${i.category ? ` · ${i.category}` : ''}`,
                  value: String(i._id),
                }))}
              />
              <Input
                label="Quantity used"
                type="number"
                min={0}
                step="any"
                value={rawUseForm.quantity || ''}
                onChange={(e) => setRawUseForm((s) => ({ ...s, quantity: Number(e.target.value) }))}
              />
              <Select
                label="Ingredient cost paid from"
                value={rawUseForm.ingredientsPaidFrom || 'cash'}
                onValueChange={(value) => setRawUseForm((s) => ({ ...s, ingredientsPaidFrom: value }))}
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'bank', label: 'Bank' },
                ]}
              />
              <Input label="Reference (optional)" value={rawUseForm.referenceNumber} onChange={(e) => setRawUseForm((s) => ({ ...s, referenceNumber: e.target.value }))} />
              <Input label="Note (optional)" value={rawUseForm.reason} onChange={(e) => setRawUseForm((s) => ({ ...s, reason: e.target.value }))} />
              <div className="md:col-span-2 lg:col-span-3">
                <div className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800/80">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Line cost (for expense)</p>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {rawUseSelectedItem
                      ? `${Number(rawUseForm.quantity || 0)} ${rawUseSelectedItem.unit} × ${money(rawUseSelectedItem.costPerUnit)} = ${money(rawUseLineCost)}`
                      : 'Select an item to preview.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-3 md:col-span-2 lg:col-span-3">
                <Button type="submit">Save use and post COGS</Button>
              </div>
            </form>
          </FinancePanel>
          <FinancePanel title="Recent usage (COGS)">
            <TransactionTable transactions={transactions.filter((txn) => txn.type === 'usage')} />
          </FinancePanel>
        </div>
      )}

      {activeTab === 'Suppliers' && (
        <div className="flex flex-col gap-6">
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
          <FinancePanel title="Supplier directory">
            <SuppliersListTable suppliers={suppliers} />
          </FinancePanel>
        </div>
      )}

      {activeTab === 'Purchases' && (
        <div className="flex flex-col gap-6">
          <FinancePanel title="Stock in purchase">
            <form onSubmit={savePurchase} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Select
                label="Item"
                placeholder="Select item"
                value={purchaseForm.inventoryItemId || ''}
                onValueChange={(value) => setPurchaseForm((s) => ({ ...s, inventoryItemId: value }))}
                searchable
                searchPlaceholder="Search by item name…"
                options={items.map((i) => ({
                  label: `${i.name}${i.category ? ` · ${i.category}` : ''}`,
                  value: String(i._id),
                }))}
              />
              <Select
                label="Supplier"
                placeholder="Select supplier"
                value={purchaseForm.supplierId || ''}
                onValueChange={(value) => setPurchaseForm((s) => ({ ...s, supplierId: value }))}
                searchable
                searchPlaceholder="Search supplier…"
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
              {purchaseForm.paymentStatus === 'paid' && (
                <Select
                  label="Paid from"
                  value={purchaseForm.paymentSource || 'cash'}
                  onValueChange={(value) => setPurchaseForm((s) => ({ ...s, paymentSource: value }))}
                  options={[
                    { value: 'cash', label: 'Cash' },
                    { value: 'bank', label: 'Bank' },
                  ]}
                />
              )}
              <div className="md:col-span-2"><Input label="Notes" value={purchaseForm.notes} onChange={(e) => setPurchaseForm((s) => ({ ...s, notes: e.target.value }))} /></div>
              <div className="md:col-span-2"><Button type="submit"><FiShoppingCart className="mr-1" /> Record Purchase</Button></div>
            </form>
          </FinancePanel>

          <FinancePanel title="Purchase history">
            {purchaseEdit && (
              <form
                onSubmit={saveEditPurchase}
                className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Editing purchase
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {purchaseEdit.itemName}
                      {purchaseEdit.unit ? ` (${purchaseEdit.unit})` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPurchaseEdit(null)}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    label="Quantity"
                    type="number"
                    step="any"
                    min="0"
                    value={purchaseEdit.quantity}
                    onChange={(e) =>
                      setPurchaseEdit((s) => ({ ...s, quantity: e.target.value }))
                    }
                  />
                  <Input
                    label="Unit cost"
                    type="number"
                    step="any"
                    min="0"
                    value={purchaseEdit.unitCost}
                    onChange={(e) =>
                      setPurchaseEdit((s) => ({ ...s, unitCost: e.target.value }))
                    }
                  />
                  <Input
                    label="Bill number"
                    value={purchaseEdit.supplierBillNumber}
                    onChange={(e) =>
                      setPurchaseEdit((s) => ({ ...s, supplierBillNumber: e.target.value }))
                    }
                  />
                  <Select
                    label="Payment status"
                    value={purchaseEdit.paymentStatus}
                    onValueChange={(value) =>
                      setPurchaseEdit((s) => ({ ...s, paymentStatus: value }))
                    }
                    options={[
                      { label: 'Paid', value: 'paid' },
                      { label: 'Partial', value: 'partial' },
                      { label: 'Pending', value: 'pending' },
                    ]}
                  />
                  {purchaseEdit.paymentStatus === 'paid' && (
                    <Select
                      label="Paid from"
                      value={purchaseEdit.paymentSource || 'cash'}
                      onValueChange={(value) =>
                        setPurchaseEdit((s) => ({ ...s, paymentSource: value }))
                      }
                      options={[
                        { value: 'cash', label: 'Cash' },
                        { value: 'bank', label: 'Bank' },
                      ]}
                    />
                  )}
                </div>
                <Input
                  label="Notes"
                  value={purchaseEdit.notes}
                  onChange={(e) =>
                    setPurchaseEdit((s) => ({ ...s, notes: e.target.value }))
                  }
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setPurchaseEdit(null)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save changes</Button>
                </div>
              </form>
            )}

            <PurchaseHistoryListTable
              purchases={purchases}
              onEdit={beginEditPurchase}
              onDelete={deletePurchase}
            />
          </FinancePanel>
        </div>
      )}

      {activeTab === 'Transactions' && (
        <div className="flex flex-col gap-6">
          <FinancePanel title="Add / remove stock">
            <form onSubmit={postMovement} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Select
                label="Item"
                placeholder="Select item"
                value={movementForm.inventoryItemId || ''}
                onValueChange={(value) => setMovementForm((s) => ({ ...s, inventoryItemId: value }))}
                searchable
                searchPlaceholder="Search by item name…"
                options={items.map((i) => ({
                  label: `${i.name} (${i.quantity} ${i.unit})${i.category ? ` · ${i.category}` : ''}`,
                  value: String(i._id),
                }))}
              />
              <Select
                label="Action"
                value={movementForm.type}
                onValueChange={(value) => setMovementForm((s) => ({ ...s, type: value }))}
                options={[
                  { label: 'Add Stock', value: 'stock_in' },
                  { label: 'Remove Stock', value: 'stock_out' },
                  { label: 'Raw material use (COGS)', value: 'usage' },
                  { label: 'Wastage / Damage', value: 'wastage' },
                ]}
              />
              <Input label="Quantity" type="number" value={movementForm.quantity} onChange={(e) => setMovementForm((s) => ({ ...s, quantity: Number(e.target.value) }))} />
              <Input label="Reference" value={movementForm.referenceNumber} onChange={(e) => setMovementForm((s) => ({ ...s, referenceNumber: e.target.value }))} />
              <Input label="Reason / notes" value={movementForm.reason} onChange={(e) => setMovementForm((s) => ({ ...s, reason: e.target.value }))} />
              <div className="flex items-end md:col-span-2 lg:col-span-3">
                <Button type="submit">{movementForm.type === 'stock_in' ? 'Add Stock' : 'Remove Stock'}</Button>
              </div>
            </form>
          </FinancePanel>

          <FinancePanel title="Transaction history" actions={<Button type="button" variant="secondary" onClick={exportTransactions}><FiDownload className="mr-1" /> Export</Button>}>
            <TransactionTable transactions={transactions} />
          </FinancePanel>
        </div>
      )}

      {activeTab === 'Waste' && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FinanceMetric label="Waste cost (loaded period)" value={money(wasteCost)} icon={FiArchive} tone="danger" />
            <FinanceMetric label="Waste entries" value={transactions.filter((txn) => txn.type === 'wastage').length} icon={FiFileText} tone="warning" />
            <FinanceMetric label="Pending bills" value={report?.purchases?.pendingBills || 0} icon={FiTruck} tone="neutral" />
          </div>
          <div className="flex flex-col gap-6">
            <FinancePanel title="Record waste / damage">
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              Log spoilage, prep mistakes, or breakage. Stock is reduced by the amount you enter. This does not post an ingredients expense (unlike Raw use); it shows in waste analytics only.
            </p>
            <form onSubmit={postWaste} className="space-y-3">
              <Select
                label="Item"
                placeholder="Select item"
                value={wasteForm.inventoryItemId || ''}
                onValueChange={(value) => setWasteForm((s) => ({ ...s, inventoryItemId: value }))}
                searchable
                searchPlaceholder="Search by item name…"
                options={items.map((i) => ({
                  label: `${i.name} (${i.quantity} ${i.unit} on hand)${i.category ? ` · ${i.category}` : ''}`,
                  value: String(i._id),
                }))}
              />
              <Input
                label="Quantity lost"
                type="number"
                min={0}
                step="any"
                value={wasteForm.quantity || ''}
                onChange={(e) => setWasteForm((s) => ({ ...s, quantity: Number(e.target.value) }))}
              />
              <Input label="Reference (optional)" value={wasteForm.referenceNumber} onChange={(e) => setWasteForm((s) => ({ ...s, referenceNumber: e.target.value }))} />
              <Input label="Note (optional)" value={wasteForm.reason} onChange={(e) => setWasteForm((s) => ({ ...s, reason: e.target.value }))} />
              <Button type="submit">Record waste</Button>
            </form>
          </FinancePanel>
          <FinancePanel title="Waste history">
            <TransactionTable transactions={transactions.filter((txn) => txn.type === 'wastage')} />
          </FinancePanel>
          </div>
        </>
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

function InventoryItemsTable({ items, onEdit, onRemove }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-100 dark:border-gray-800">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-surface-200 bg-surface-50/80 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-400">
            <th className="px-4 py-3">Item</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">On hand</th>
            <th className="px-4 py-3 text-right">Min</th>
            <th className="px-4 py-3">Expiry</th>
            <th className="px-4 py-3 text-right">Value</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const tone = statusTone(item)
            const stockValue = Number(item.quantity || 0) * Number(item.costPerUnit || 0)
            return (
              <tr
                key={item._id}
                className="border-b border-surface-100 transition hover:bg-amber-50/40 dark:border-gray-800 dark:hover:bg-gray-900/60"
              >
                <td className="px-4 py-3 font-semibold text-gray-950 dark:text-gray-100">{item.name}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.category || 'General'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${tone.cls}`}>{tone.label}</span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-gray-100">
                  {item.quantity} {item.unit}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">{item.minimumStock}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {item.expiryDate ? (
                    <span className="font-medium text-orange-800 dark:text-orange-300">{formatDate(item.expiryDate)}</span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-right font-bold text-primary-800 dark:text-primary-300">{money(stockValue)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => onEdit(item)}>
                      <FiEdit2 className="mr-1" /> Edit
                    </Button>
                    <Button type="button" size="sm" variant="danger" onClick={() => onRemove(item)}>
                      <FiTrash2 className="mr-1" /> Delete
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SuppliersListTable({ suppliers }) {
  if (!suppliers.length) {
    return <EmptyState>No suppliers saved yet.</EmptyState>
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-100 dark:border-gray-800">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-surface-200 bg-surface-50/80 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-400">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">PAN / VAT</th>
            <th className="px-4 py-3">Address</th>
            <th className="px-4 py-3 text-right">Due</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s._id} className="border-b border-surface-100 hover:bg-amber-50/40 dark:border-gray-800 dark:hover:bg-gray-900/60">
              <td className="px-4 py-3 font-semibold text-gray-950 dark:text-gray-100">{s.name}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.phone || '—'}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.panVat || '—'}</td>
              <td className="max-w-[220px] truncate px-4 py-3 text-gray-600 dark:text-gray-300" title={s.address || ''}>
                {s.address || '—'}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{money(s.paymentDue)}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    Number(s.paymentDue || 0) > 0 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {Number(s.paymentDue || 0) > 0 ? 'Due' : 'Clear'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function purchaseGrandTotal(p) {
  return Number(p.totalCost || 0) + Number(p.taxAmount || 0)
}

function PurchaseHistoryListTable({ purchases, onEdit, onDelete }) {
  if (!purchases.length) {
    return <EmptyState>No purchases recorded yet.</EmptyState>
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-100 dark:border-gray-800">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-surface-200 bg-surface-50/80 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-400">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Item</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3">Supplier</th>
            <th className="px-4 py-3 text-right">Total</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">Paid from</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => (
            <tr key={purchase._id} className="border-b border-surface-100 hover:bg-amber-50/40 dark:border-gray-800 dark:hover:bg-gray-900/60">
              <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(purchase.purchasedAt)}</td>
              <td className="px-4 py-3 font-semibold text-gray-950 dark:text-gray-100">{purchase.inventoryItemId?.name || '—'}</td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-800 dark:text-gray-200">
                {purchase.quantity} {purchase.inventoryItemId?.unit || ''}
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{purchase.supplierId?.name || purchase.supplier || '—'}</td>
              <td className="px-4 py-3 text-right font-bold text-primary-800 dark:text-primary-300">{money(purchaseGrandTotal(purchase))}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs font-bold capitalize text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {purchase.paymentStatus || '—'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm capitalize text-gray-700 dark:text-gray-300">
                {purchase.paymentStatus === 'paid' ? (purchase.paymentSource === 'bank' ? 'Bank' : 'Cash') : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => onEdit(purchase)}>
                    Edit
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => onDelete(purchase)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TransactionTable({ transactions }) {
  if (!transactions.length) {
    return (
      <div className="rounded-xl border border-dashed border-surface-200 bg-surface-50/50 py-12 dark:border-gray-700 dark:bg-gray-900/40">
        <EmptyState>No transactions found.</EmptyState>
      </div>
    )
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-100 dark:border-gray-800">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-surface-200 bg-surface-50/80 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-400">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Item</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">Cost</th>
            <th className="px-4 py-3">User / Note</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr key={txn._id} className="border-b border-surface-100 hover:bg-amber-50/40 dark:border-gray-800 dark:hover:bg-gray-900/60">
              <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(txn.createdAt)}</td>
              <td className="px-4 py-3 font-semibold text-gray-950 dark:text-gray-100">{txn.inventoryItemId?.name || '-'}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-primary-50 px-2 py-1 text-xs font-bold text-primary-700 dark:bg-gray-800 dark:text-primary-300">{txn.type}</span>
              </td>
              <td className="px-4 py-3 tabular-nums text-gray-800 dark:text-gray-200">{txn.quantity} {txn.inventoryItemId?.unit || ''}</td>
              <td className="px-4 py-3 font-bold text-primary-800 dark:text-primary-300">{money(txn.totalCost)}</td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{txn.note || txn.referenceNumber || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
