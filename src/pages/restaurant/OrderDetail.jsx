import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiArrowLeft,
  FiCheck,
  FiChevronDown,
  FiClock,
  FiCreditCard,
  FiHash,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPrinter,
  FiShoppingBag,
  FiSliders,
  FiUser,
  FiX,
  FiExternalLink,
  FiTruck,
  FiInbox,
} from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { useSocket } from '../../hooks/useSocket'
import { useAuth } from '../../hooks/useAuth'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import OrderStatusBadge from '../../components/restaurant/OrderStatusBadge'
import {
  RestaurantPageLoader,
  RestaurantStatusPill,
  formatRestaurantCurrency,
  formatRestaurantDateTime,
  paymentStatusStyles,
} from '../../components/restaurant/RestaurantUI'

const VIRTUAL_POS_TABLES = new Set(['POS-TAKEAWAY', 'POS-DELIVERY'])

const STATUS_TIMELINE_STYLES = {
  pending: 'bg-amber-500 ring-amber-200',
  confirmed: 'bg-sky-500 ring-sky-200',
  preparing: 'bg-violet-500 ring-violet-200',
  ready: 'bg-emerald-500 ring-emerald-200',
  served: 'bg-primary-600 ring-primary-200',
  completed: 'bg-gray-600 ring-gray-200',
  cancelled: 'bg-red-500 ring-red-200',
}

const Panel = ({ title, icon: Icon, children, className = '', headerClassName = '' }) => (
  <div
    className={`overflow-hidden rounded-3xl border border-gray-100/80 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] ${className}`}
  >
    <div className={`flex items-center gap-3 border-b border-gray-100 px-5 py-4 ${headerClassName}`}>
      {Icon && (
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-white text-primary-700 ring-1 ring-primary-100">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <h3 className="text-sm font-black tracking-tight text-gray-950">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
)

const MetaChip = ({ icon: Icon, label, value, tone = 'neutral' }) => {
  const tones = {
    neutral: 'border-gray-100 bg-white/90 text-gray-800',
    parcel: 'border-amber-200/80 bg-amber-50 text-amber-950',
    dine: 'border-emerald-200/80 bg-emerald-50 text-emerald-950',
    delivery: 'border-sky-200/80 bg-sky-50 text-sky-950',
  }
  return (
    <div className={`flex min-w-0 items-center gap-2.5 rounded-2xl border px-3 py-2.5 ${tones[tone] || tones.neutral}`}>
      {Icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
          <Icon className="h-4 w-4 opacity-80" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-60">{label}</p>
        <p className="truncate text-sm font-black">{value}</p>
      </div>
    </div>
  )
}

function formatTableCode(tableNumber) {
  const raw = String(tableNumber || '').trim()
  if (!raw) return ''
  if (/^t/i.test(raw)) {
    const rest = raw.slice(1).replace(/^[-\s]+/, '')
    return rest ? `T${rest}` : raw
  }
  return `T${raw}`
}

function getOrderFulfillment(order) {
  const tableNumber = order?.table?.tableNumber
  const isParcel = order?.orderChannel === 'takeaway' || order?.posDetails?.mode === 'takeaway'
  const isDelivery = order?.orderChannel === 'delivery' || order?.posDetails?.mode === 'delivery'
  const isVirtualPos = VIRTUAL_POS_TABLES.has(tableNumber)

  if (isParcel) {
    const tableLabel =
      tableNumber && !isVirtualPos ? `${formatTableCode(tableNumber)}-parcel` : 'Parcel'
    return {
      type: 'parcel',
      tableLabel,
      channelLabel: 'Pack for takeaway',
      tone: 'parcel',
      Icon: FiInbox,
    }
  }
  if (isDelivery) {
    const tableLabel =
      tableNumber && !isVirtualPos ? `${formatTableCode(tableNumber)}-delivery` : 'Delivery'
    return {
      type: 'delivery',
      tableLabel,
      channelLabel: 'Delivery',
      tone: 'delivery',
      Icon: FiTruck,
    }
  }
  return {
    type: 'dine_in',
    tableLabel: tableNumber ? formatTableCode(tableNumber) : '—',
    channelLabel: 'Dine in',
    tone: 'dine',
    Icon: FiMapPin,
  }
}

function cleanSpecialRequests(text, fulfillmentType) {
  const raw = String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const unique = [...new Set(raw)]
  const filtered =
    fulfillmentType === 'parcel'
      ? unique.filter((line) => !/parcel order\s*-\s*pack for takeaway/i.test(line))
      : unique
  return filtered.join(' · ')
}

const formatFulfillment = (value) => (value === 'parcel' ? 'Parcel' : 'Eat here')

function getFulfillmentCounts(order) {
  return (order?.items || []).reduce(
    (acc, item) => {
      const qty = Number(item.quantity || 0)
      if (item.fulfillmentMode === 'parcel') acc.parcel += qty
      else acc.dine += qty
      return acc
    },
    { dine: 0, parcel: 0 },
  )
}

function getFulfillmentLabel(order) {
  const counts = getFulfillmentCounts(order)
  if (counts.dine > 0 && counts.parcel > 0) return `${counts.dine} eat here + ${counts.parcel} parcel`
  if (counts.parcel > 0) return `${counts.parcel} parcel`
  if (counts.dine > 0) return `${counts.dine} eat here`
  return 'N/A'
}

const getChannelLabel = (value = '') =>
  String(value || 'qr_ordering').replace(/_/g, ' ')

function getOrderCustomerLabel(order) {
  const name = String(order?.customerName || '').trim()
  if (order?.guestId && (!name || name.toLowerCase() === 'guest' || name.toLowerCase() === 'qr customer')) {
    return order.guestId
  }
  return name || order?.guestId || 'Guest'
}

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const safeImageUrl = (value = '') => {
  try {
    const url = new URL(String(value || ''), window.location.origin)
    return ['http:', 'https:', 'data:'].includes(url.protocol) ? escapeHtml(url.href) : ''
  } catch {
    return ''
  }
}

const OrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const { user } = useAuth()
  const { portalBase, restaurantBase, kitchenBase, cashierBase, employeeBase, managerBase } = useTenantRoutes()
  const [order, setOrder] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [creditCustomers, setCreditCustomers] = useState([])
  const [creditPick, setCreditPick] = useState('')
  const [payMode, setPayMode] = useState('cash')
  const [singlePayAmount, setSinglePayAmount] = useState('')
  const [splitCash, setSplitCash] = useState('')
  const [splitOnline, setSplitOnline] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const suppressNextSocketToastRef = useRef(false)
  const isCashierView = user?.scope === 'employee' && user?.role === 'cashier'
  const isManagerView = user?.scope === 'employee' && (user?.role === 'manager' || user?.role === 'admin')
  const currency = user?.currency || restaurant?.settings?.currency || 'Rs.'
  const formatMoney = (value) => formatRestaurantCurrency(value, currency)
  const subtotal = Number(order?.totalAmount || 0)
  const taxAmount = Number(order?.taxAmount || 0)
  const discountAmount = Number(order?.discountAmount || 0)
  const serviceChargeAmount = Number(order?.posDetails?.serviceChargeAmount || 0)
  const amountPaid = Number(order?.amountPaidTotal || 0)
  const grandTotal = Number(order?.grandTotal || subtotal + taxAmount)
  const itemCount = order?.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0
  const customerName = getOrderCustomerLabel(order)
  const backPath = isCashierView
    ? `${cashierBase}/dashboard`
    : isManagerView
      ? `${managerBase}/orders`
      : user?.role === 'kitchen'
        ? `${kitchenBase}/orders`
        : user?.scope === 'employee' || ['kitchen', 'cashier', 'waiter'].includes(user?.role)
          ? `${employeeBase}/orders`
          : `${portalBase}/orders`

  useEffect(() => {
    fetchOrder()
    fetchRestaurantProfile()
  }, [id])

  useEffect(() => {
    const allowHouseAccountPick =
      order &&
      order.paymentStatus !== 'paid' &&
      order.paymentStatus !== 'failed' &&
      ['served', 'completed'].includes(order.status) &&
      !order.isCreditSale
    if (!order?._id || !allowHouseAccountPick) {
      setCreditCustomers([])
      setCreditPick('')
      return
    }
    api
      .get('/restaurant/credit-customers', { params: { status: 'approved' } })
      .then((r) => setCreditCustomers(r.data.data?.items || []))
      .catch(() => setCreditCustomers([]))
  }, [order?._id, order?.status, order?.paymentStatus, order?.isCreditSale])

  useEffect(() => {
    if (!order) return
    const due = Math.max(0, Number(order.grandTotal || 0) - Number(order.amountPaidTotal || 0))
    setSinglePayAmount(due > 0 ? due.toFixed(2) : '')
    if (order.guestPaymentPreferenceAt && order.paymentMethod === 'mixed') {
      const gCash = Number(order.guestPaymentPreferenceCash || 0)
      const gOnline = Number(order.guestPaymentPreferenceOnline || 0)
      if (gCash > 0.01 || gOnline > 0.01) {
        setPayMode('both')
        setSplitCash(gCash > 0.01 ? String(gCash) : '')
        setSplitOnline(gOnline > 0.01 ? String(gOnline) : '')
        return
      }
    }
    if (order.guestPaymentPreferenceAt && order.paymentMethod === 'cash') setPayMode('cash')
    else if (order.guestPaymentPreferenceAt && order.paymentMethod === 'online') setPayMode('online')
    setSplitCash('')
    setSplitOnline('')
  }, [
    order?._id,
    order?.grandTotal,
    order?.amountPaidTotal,
    order?.paymentStatus,
    order?.guestPaymentPreferenceAt,
    order?.paymentMethod,
    order?.guestPaymentPreferenceCash,
    order?.guestPaymentPreferenceOnline,
  ])

  const fetchRestaurantProfile = async () => {
    try {
      const res = await api.get('/restaurant/auth/profile')
      setRestaurant(res.data.data)
    } catch (error) {
      console.error('Failed to fetch restaurant profile', error)
    }
  }

  useEffect(() => {
    if (socket && id) {
      socket.emit('join:order', id)
      socket.on('order_status', handleStatusUpdate)
      return () => {
        socket.off('order_status')
      }
    }
  }, [socket, id])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/restaurant/customer-orders/${id}`)
      setOrder(res.data.data)
    } catch (error) {
      toast.error('Failed to fetch order details')
      navigate(backPath)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = (data) => {
    setOrder(prev => ({ ...prev, ...data }))
    if (suppressNextSocketToastRef.current) {
      suppressNextSocketToastRef.current = false
    } else {
      toast.success(`Order status updated to ${data.status}`)
    }
    fetchOrder()
  }

  const amountDue = Math.max(0, Number(order?.grandTotal || 0) - Number(order?.amountPaidTotal || 0))

  const submitCounterPayment = async () => {
    if (!id || amountDue <= 0) return
    try {
      setUpdating(true)
      if (payMode === 'both') {
        const c = Number(splitCash) || 0
        const o = Number(splitOnline) || 0
        if (c <= 0 && o <= 0) {
          toast.error('Enter cash and/or online amounts')
          return
        }
        if (c + o - amountDue > 0.02) {
          toast.error(`Cash + online cannot exceed amount due (${formatMoney(amountDue)})`)
          return
        }
        await api.post('/restaurant/cashier/pay', {
          customerOrderId: id,
          paymentMode: 'both',
          cashAmount: c,
          onlineAmount: o,
        })
      } else {
        const amt = Number(singlePayAmount)
        if (!Number.isFinite(amt) || amt <= 0) {
          toast.error('Enter a valid amount')
          return
        }
        if (amt - amountDue > 0.02) {
          toast.error('Amount exceeds balance due')
          return
        }
        const method = payMode === 'online' ? 'online' : 'cash'
        await api.post('/restaurant/cashier/pay', {
          customerOrderId: id,
          paymentMethod: method,
          amount: amt,
        })
      }
      toast.success('Payment recorded')
      fetchOrder()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Payment failed')
    } finally {
      setUpdating(false)
    }
  }

  const postCreditToAccount = async (creditCustomerId) => {
    try {
      setUpdating(true)
      await api.post('/restaurant/cashier/pay', {
        customerOrderId: id,
        paymentMethod: 'credit',
        creditCustomerId,
      })
      toast.success('Posted to house account')
      fetchOrder()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed')
    } finally {
      setUpdating(false)
    }
  }

  const canRecordAnyPayment =
    order &&
    order.paymentStatus !== 'paid' &&
    order.paymentStatus !== 'failed' &&
    ['served', 'completed'].includes(order.status) &&
    !order.isCreditSale

  const canPostToNewHouseAccount = canRecordAnyPayment && !order?.isCreditSale

  const houseCreditManageHref =
    isCashierView && cashierBase ? `${cashierBase}/house-credit` : restaurantBase ? `${restaurantBase}/credit-customers` : ''

  const renderCreditSettlementNotice = () => {
    if (!order?.isCreditSale || order.paymentStatus === 'paid') return null
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        <p className="font-black">House credit bill</p>
        <p className="mt-1 text-xs font-semibold">
          This bill is linked to an approved credit customer. For security, payment can be recorded only from the house credit section.
        </p>
        {houseCreditManageHref && (
          <Link
            to={houseCreditManageHref}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-black text-white hover:bg-amber-700"
          >
            <FiExternalLink className="h-3.5 w-3.5" />
            Open house credit
          </Link>
        )}
      </div>
    )
  }

  const renderStaffPaymentForm = (compact = false) => {
    if (!order) return null
    if (!canRecordAnyPayment) return null
    return (
      <div className={compact ? 'space-y-3' : 'mt-5 space-y-4 border-t border-gray-100 pt-5'}>
        {houseCreditManageHref && (
          <Link
            to={houseCreditManageHref}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-xs font-bold text-primary-800 hover:bg-primary-100"
          >
            <FiExternalLink className="h-3.5 w-3.5" />
            {isCashierView ? 'House credit balances' : 'Open credit / house accounts'}
          </Link>
        )}
        <div className="rounded-2xl bg-gray-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Record payment</p>
          {order.guestPaymentPreferenceAt ? (
            <p className="mt-1 rounded-lg bg-primary-50 px-2 py-1.5 text-xs font-semibold text-primary-900 dark:bg-primary-950/50 dark:text-primary-100">
              Guest indicated:{' '}
              {order.paymentMethod === 'mixed'
                ? `split — cash ${formatMoney(order.guestPaymentPreferenceCash)} + online ${formatMoney(order.guestPaymentPreferenceOnline)}`
                : String(order.paymentMethod || '—')}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Amount due: <span className="font-bold text-gray-900 dark:text-gray-100">{formatMoney(amountDue)}</span>
            {Number(order.amountPaidTotal) > 0 && (
              <span className="ml-2">(already paid {formatMoney(order.amountPaidTotal)})</span>
            )}
          </p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-white p-1 ring-1 ring-gray-100">
          {[
            { id: 'cash', label: 'Cash' },
            { id: 'online', label: 'Online' },
            { id: 'both', label: 'Both' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPayMode(opt.id)}
              className={`rounded-xl py-2.5 text-xs font-black transition-all ${
                payMode === opt.id
                  ? 'bg-primary-700 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {payMode !== 'both' ? (
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
            Amount ({payMode === 'cash' ? 'cash' : 'online'})
            <input
              type="number"
              min="0"
              step="0.01"
              value={singlePayAmount}
              onChange={(e) => setSinglePayAmount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </label>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Cash (Rs.)
              <input
                type="number"
                min="0"
                step="0.01"
                value={splitCash}
                onChange={(e) => setSplitCash(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Online (Rs.)
              <input
                type="number"
                min="0"
                step="0.01"
                value={splitOnline}
                onChange={(e) => setSplitOnline(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <p className="col-span-2 text-[10px] text-gray-400">Must add up to amount due for a full settle.</p>
          </div>
        )}
        <Button className="w-full" disabled={updating || amountDue <= 0} onClick={submitCounterPayment}>
          Save payment
        </Button>

        {canPostToNewHouseAccount && (
          <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Or post to house account</p>
            <select
              className="mb-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={creditPick}
              onChange={(e) => setCreditPick(e.target.value)}
            >
              <option value="">Select approved customer…</option>
              {creditCustomers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} — {c.email}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              disabled={updating || !creditPick}
              onClick={() => postCreditToAccount(creditPick)}
            >
              Post balance to house account
            </Button>
          </div>
        )}
      </div>
    )
  }

  const updateStatus = async (status, estimatedWaitTime = null) => {
    try {
      setUpdating(true)
      suppressNextSocketToastRef.current = true
      await api.patch(`/restaurant/customer-orders/${id}/status`, { status, estimatedWaitTime })
      toast.success(`Order status updated to ${status}`)
      fetchOrder()
    } catch (error) {
      suppressNextSocketToastRef.current = false
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const printReceipt = () => {
    const subtotal = Number(order?.totalAmount || 0)
    const vat = Number(order?.taxAmount || 0)
    const grandTotal = Number(order?.grandTotal || subtotal + vat)
    const paymentMethod = (order?.paymentMethod || 'cash').toUpperCase()
    const billDate = formatRestaurantDateTime(order?.createdAt)

    const cur = currency
    const restaurantName = order?.restaurant?.name || restaurant?.name || 'Restaurant'
    const restaurantLogo = order?.restaurant?.logo || restaurant?.logo
    const restaurantAddress = restaurant?.address || 'Kathmandu, Nepal'
    const safeLogo = safeImageUrl(restaurantLogo)
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Tax Invoice Receipt</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 12px; max-width: 320px; margin: 0 auto; color: #111; }
            .center { text-align: center; }
            .title { font-weight: 700; font-size: 16px; margin-bottom: 4px; }
            .subtitle { font-size: 12px; margin: 2px 0; }
            .divider { border-top: 1px dashed #777; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0; }
            .head { font-weight: 700; }
            .item { font-size: 12px; margin: 5px 0; }
            .total { font-weight: 700; font-size: 13px; }
            .footer { text-align: center; margin-top: 14px; font-size: 11px; }
            .logo { max-width: 120px; max-height: 120px; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="center">
            ${safeLogo ? `<img class="logo" src="${safeLogo}" alt="Logo" />` : ''}
            <div class="title">${escapeHtml(restaurantName)}</div>
            <div class="subtitle">${escapeHtml(restaurantAddress)}</div>
            <div class="subtitle">PAN: 123456789</div>
            <div class="subtitle">TAX INVOICE</div>
          </div>
          <div class="divider"></div>
          <div class="row"><span>Bill No:</span><span>${escapeHtml(order?.orderNumber)}</span></div>
          <div class="row"><span>Date:</span><span>${escapeHtml(billDate)}</span></div>
          <div class="row"><span>Table:</span><span>${escapeHtml(order?.table?.tableNumber || 'N/A')}</span></div>
          <div class="row"><span>Customer:</span><span>${escapeHtml(getOrderCustomerLabel(order))}</span></div>
          <div class="row"><span>Payment:</span><span>${escapeHtml(paymentMethod)}</span></div>
          <div class="divider"></div>
          <div class="row head"><span>Particular</span><span>Amt</span></div>
          ${order?.items?.map(item => `
            <div class="item">
              <div>${escapeHtml(item.name)}</div>
              <div class="row"><span>${escapeHtml(item.quantity)} x ${escapeHtml(cur)} ${Number(item.price || 0).toFixed(2)}</span><span>${escapeHtml(cur)} ${Number(item.price * item.quantity).toFixed(2)}</span></div>
            </div>
          `).join('')}
          <div class="divider"></div>
          <div class="row"><span>Sub Total</span><span>${escapeHtml(cur)} ${subtotal.toFixed(2)}</span></div>
          <div class="row"><span>VAT</span><span>${escapeHtml(cur)} ${vat.toFixed(2)}</span></div>
          <div class="row total"><span>Grand Total</span><span>${escapeHtml(cur)} ${grandTotal.toFixed(2)}</span></div>
          <div class="divider"></div>
          <p class="footer">Thank you. Visit Again!</p>
        </body>
      </html>
    `)
    printWindow.print()
    printWindow.close()
  }

  const getStatusActions = () => {
    switch (order?.status) {
      case 'pending':
        return (
          <div className="space-y-3">
            <Button className="w-full" onClick={() => updateStatus('confirmed', 15)} disabled={updating}>
              <FiCheck className="mr-2" /> Confirm Order
            </Button>
            <Button variant="danger" className="w-full" onClick={() => updateStatus('cancelled')} disabled={updating}>
              <FiX className="mr-2" /> Cancel Order
            </Button>
          </div>
        )
      case 'confirmed':
        return (
          <div className="space-y-3">
            <Button className="w-full" onClick={() => updateStatus('preparing')} disabled={updating}>
              Start Preparing
            </Button>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Wait Time</label>
              <div className="flex flex-wrap gap-2">
                {[10, 15, 20, 30, 45].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => updateStatus('confirmed', mins)}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      case 'preparing':
        return (
          <Button className="w-full" variant="success" onClick={() => updateStatus('ready')} disabled={updating}>
            Mark Ready
          </Button>
        )
      case 'ready':
        return (
          <Button className="w-full" variant="success" onClick={() => updateStatus('served')} disabled={updating}>
            Serve Order
          </Button>
        )
      default:
        return null
    }
  }

  if (loading) {
    return <RestaurantPageLoader />
  }

  if (!order) return null

  const statusActionContent = getStatusActions()
  const showPaymentTools = canRecordAnyPayment
  const fulfillment = getOrderFulfillment(order)
  const FulfillmentIcon = fulfillment.Icon
  const specialNote = cleanSpecialRequests(order.specialRequests, fulfillment.type)

  if (isCashierView) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={() => navigate(backPath)} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-950">
            <FiArrowLeft /> Back to Cashier
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {houseCreditManageHref && (
              <Link
                to={houseCreditManageHref}
                className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-bold text-primary-800 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-200"
              >
                <FiExternalLink className="h-4 w-4" />
                House credit
              </Link>
            )}
            <Button onClick={printReceipt}>
              <FiPrinter className="mr-2" /> Print Bill
            </Button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-3xl px-0 sm:px-2">
          <Card className="overflow-hidden rounded-3xl border-surface-200 shadow-xl">
            <div className="-mx-6 -mt-6 mb-6 bg-gradient-to-r from-primary-800 via-secondary-700 to-accent-700 px-6 py-7 text-white">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Cashier Receipt</p>
                  <h1 className="mt-2 text-3xl font-bold">#{order.orderNumber}</h1>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Grand Total</p>
                  <p className="mt-1 text-3xl font-bold text-surface-100">{formatMoney(grandTotal)}</p>
                </div>
              </div>
            </div>

            <div className="text-center border-b border-dashed pb-4">
              <h2 className="text-2xl font-bold text-gray-900">{order?.restaurant?.name || 'Restaurant'}</h2>
              <p className="text-sm text-gray-500">Kathmandu, Nepal</p>
              <p className="text-sm text-gray-500">PAN: 123456789</p>
              <p className="text-xs font-semibold mt-1 text-gray-700">TAX INVOICE / BILL RECEIPT</p>
            </div>

            <div className="py-4 space-y-2 border-b border-dashed text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Bill No</span><span className="font-semibold">{order.orderNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{formatRestaurantDateTime(order.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Table</span><span>{order.table?.tableNumber || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Customer</span><span>{customerName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="uppercase">{order.paymentMethod || 'cash'}</span></div>
            </div>

            <div className="py-4 border-b border-dashed">
              <div className="flex justify-between text-xs uppercase tracking-wide text-gray-500 mb-2">
                <span>Particular</span>
                <span>Amount</span>
              </div>
              <div className="space-y-2">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="text-sm">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <div className="flex justify-between text-gray-600">
                      <span>{item.quantity} x {Number(item.price || 0).toFixed(2)}</span>
                      <span>{formatMoney(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="py-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Sub Total</span><span>{formatMoney(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">VAT</span><span>{formatMoney(taxAmount)}</span></div>
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span>Grand Total</span>
                <span className="text-primary-600">{formatMoney(grandTotal)}</span>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500 border-t border-dashed pt-4">
              <p>Thank you! Visit Again.</p>
            </div>

            <div className="mt-4 border-t border-dashed pt-4 text-left">
              {renderCreditSettlementNotice()}
              {renderStaffPaymentForm(true)}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-primary-200 hover:text-primary-800"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to orders
        </button>
        <Button variant="secondary" onClick={printReceipt} className="rounded-2xl">
          <FiPrinter className="mr-2" />
          Print receipt
        </Button>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-[2rem] shadow-[0_20px_50px_-24px_rgba(69,26,3,0.45)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-primary-950 to-primary-800" />
        <div
          className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl"
          aria-hidden
        />

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
                Order details
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                  #{order.orderNumber}
                </h1>
                <OrderStatusBadge status={order.status} />
                {order.paymentStatus && (
                  <RestaurantStatusPill
                    value={order.paymentStatus}
                    styles={paymentStatusStyles}
                    uppercase
                  />
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-white/75">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
                  <FiUser className="h-3.5 w-3.5" />
                  {customerName}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
                  <FiClock className="h-3.5 w-3.5" />
                  {formatRestaurantDateTime(order.createdAt)}
                </span>
                {order.estimatedWaitTime ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
                    ~{order.estimatedWaitTime} min wait
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
              <div
                className={`inline-flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm ${
                  fulfillment.tone === 'parcel'
                    ? 'border-amber-300/40 bg-amber-400/20 text-amber-50'
                    : fulfillment.tone === 'delivery'
                      ? 'border-sky-300/40 bg-sky-400/20 text-sky-50'
                      : 'border-emerald-300/40 bg-emerald-400/20 text-emerald-50'
                }`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                  <FulfillmentIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-80">
                    {fulfillment.channelLabel}
                  </p>
                  <p className="text-xl font-black">{fulfillment.tableLabel}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-white/95 px-5 py-3 text-right shadow-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
                  Grand total
                </p>
                <p className="text-3xl font-black text-primary-700">{formatMoney(grandTotal)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetaChip icon={FiShoppingBag} label="Items" value={String(itemCount)} tone="neutral" />
            <MetaChip
              icon={FiClock}
              label="Wait"
              value={order.estimatedWaitTime ? `${order.estimatedWaitTime} min` : '—'}
              tone="neutral"
            />
            <MetaChip icon={FulfillmentIcon} label="Service" value={fulfillment.channelLabel} tone={fulfillment.tone} />
            <MetaChip
              icon={FiCreditCard}
              label="Payment"
              value={order.paymentMethod || 'Pending'}
              tone="neutral"
            />
          </div>

          {specialNote ? (
            <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-500/15 px-4 py-3 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-100/80">
                Kitchen note
              </p>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-amber-50">{specialNote}</p>
            </div>
          ) : null}
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Panel title="Order items" icon={FiShoppingBag}>
            <ul className="divide-y divide-gray-100">
              {order.items?.map((item, idx) => (
                <li
                  key={idx}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 text-sm font-black text-primary-800 ring-1 ring-primary-100">
                      {item.quantity}×
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-black text-gray-950">{item.name}</p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-500">
                        {formatMoney(item.price)} each
                      </p>
                      {(item.selectedVariations || []).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(item.selectedVariations || []).map((variation, vIdx) => (
                            <span
                              key={`${variation.optionId || variation.optionName}-${vIdx}`}
                              className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-700"
                            >
                              {variation.groupName}: {variation.optionName}
                              {Number(variation.quantity || 1) > 1 ? ` ×${variation.quantity}` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.specialInstructions && (
                        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 ring-1 ring-amber-100">
                          {item.specialInstructions}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-lg font-black text-gray-950 sm:text-right">
                    {formatMoney(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white">
              <div className="space-y-2.5 px-5 py-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">{formatMoney(subtotal)}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span className="font-bold text-gray-900">{formatMoney(taxAmount)}</span>
                  </div>
                )}
                {serviceChargeAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Service charge</span>
                    <span className="font-bold text-gray-900">{formatMoney(serviceChargeAmount)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span className="font-bold">−{formatMoney(discountAmount)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 bg-primary-950 px-5 py-4 text-white">
                <span className="text-sm font-bold uppercase tracking-wider text-white/70">Total due</span>
                <span className="text-2xl font-black">{formatMoney(grandTotal)}</span>
              </div>
            </div>
          </Panel>

          <Panel title="Kitchen timeline" icon={FiClock}>
            {order.statusHistory?.length ? (
              <div className="relative pl-1">
                <span
                  className="absolute bottom-4 left-[17px] top-4 w-0.5 bg-gradient-to-b from-primary-300 via-primary-200 to-transparent"
                  aria-hidden
                />
                <ul className="space-y-4">
                  {order.statusHistory.map((history, idx) => {
                    const dotClass =
                      STATUS_TIMELINE_STYLES[history.status] || STATUS_TIMELINE_STYLES.pending
                    const isLast = idx === order.statusHistory.length - 1
                    return (
                      <li key={idx} className="relative flex gap-4">
                        <span
                          className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-md ring-4 ${dotClass} ${isLast ? 'scale-110' : ''}`}
                        >
                          <FiCheck className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-black capitalize text-gray-950">{history.status}</span>
                            <span className="text-xs font-semibold text-gray-500">
                              {formatRestaurantDateTime(history.timestamp)}
                            </span>
                          </div>
                          {history.note && (
                            <p className="mt-1.5 text-sm font-medium text-gray-600">{history.note}</p>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-10 text-center">
                <FiClock className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-3 text-sm font-bold text-gray-800">No updates yet</p>
                <p className="mt-1 text-xs text-gray-500">Status changes appear here as the order progresses.</p>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <div className="lg:sticky lg:top-6 lg:space-y-6">
            <Panel title="Actions" icon={FiSliders} className="ring-1 ring-primary-100/80">
              {statusActionContent}
              {!statusActionContent && !showPaymentTools && (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                  <p className="text-sm font-bold text-gray-800">No actions available</p>
                  <p className="mt-1 text-xs text-gray-500">This order is in a final state.</p>
                </div>
              )}
              {renderCreditSettlementNotice()}
              {showPaymentTools && renderStaffPaymentForm(false)}
            </Panel>

            <Panel title="Guest" icon={FiUser}>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-lg font-black text-white shadow-md">
                  {customerName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-gray-950">{customerName}</p>
                  {order.guestId && (
                    <p className="text-xs font-semibold text-gray-500">ID {order.guestId}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {order.customerPhone && (
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-primary-50 hover:text-primary-900"
                  >
                    <FiPhone className="h-4 w-4 text-primary-600" />
                    {order.customerPhone}
                  </a>
                )}
                {order.customerEmail && (
                  <a
                    href={`mailto:${order.customerEmail}`}
                    className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-primary-50 hover:text-primary-900"
                  >
                    <FiMail className="h-4 w-4 text-primary-600" />
                    <span className="truncate">{order.customerEmail}</span>
                  </a>
                )}
              </div>
            </Panel>

            <Panel title="Payment" icon={FiCreditCard}>
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</span>
                {order.paymentStatus ? (
                  <RestaurantStatusPill value={order.paymentStatus} styles={paymentStatusStyles} uppercase />
                ) : (
                  <span className="text-sm font-bold text-gray-600">—</span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl border border-gray-100 bg-white px-3 py-3">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Method</p>
                  <p className="mt-1 text-sm font-black capitalize text-gray-900">
                    {order.paymentMethod || '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white px-3 py-3">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Due</p>
                  <p className="mt-1 text-sm font-black text-primary-700">{formatMoney(amountDue)}</p>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetail
