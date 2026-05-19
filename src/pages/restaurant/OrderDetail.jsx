import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiArrowLeft,
  FiCheck,
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

const SectionCard = ({ title, icon: Icon, children, actions, className = '' }) => (
  <Card
    className={`overflow-hidden rounded-2xl border-surface-200 shadow-sm hover:shadow-lg ${className}`}
  >
    <div className="-mx-6 -mt-6 mb-5 flex items-center justify-between border-b border-surface-200 bg-surface-50/70 px-6 py-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary-700 shadow-sm">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <h3 className="text-base font-bold text-gray-950">{title}</h3>
      </div>
      {actions}
    </div>
    {children}
  </Card>
)

const InfoTile = ({ label, value, icon: Icon, accent = 'text-primary-700 bg-primary-50' }) => (
  <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm">
    <div className="flex items-start gap-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-1 truncate text-lg font-bold text-gray-950">{value}</p>
      </div>
    </div>
  </div>
)

const DetailRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 rounded-xl bg-surface-50/70 px-3 py-3">
    {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />}
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-gray-900">{value || 'N/A'}</p>
    </div>
  </div>
)

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
  const { restaurantBase, kitchenBase, cashierBase, employeeBase } = useTenantRoutes()
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
  const currency = user?.currency || restaurant?.settings?.currency || 'Rs.'
  const formatMoney = (value) => formatRestaurantCurrency(value, currency)
  const subtotal = Number(order?.totalAmount || 0)
  const taxAmount = Number(order?.taxAmount || 0)
  const grandTotal = Number(order?.grandTotal || subtotal + taxAmount)
  const itemCount = order?.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0
  const customerName = getOrderCustomerLabel(order)
  const backPath = isCashierView
    ? `${cashierBase}/dashboard`
    : user?.role === 'kitchen'
      ? `${kitchenBase}/orders`
      : user?.scope === 'employee' || ['kitchen', 'cashier', 'manager', 'waiter'].includes(user?.role)
        ? `${employeeBase}/orders`
        : `${restaurantBase}/orders`

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
      <div className={compact ? 'space-y-3' : 'mt-4 space-y-3 border-t border-surface-200 pt-4'}>
        {houseCreditManageHref && (
          <Link
            to={houseCreditManageHref}
            className="inline-flex items-center gap-2 text-xs font-bold text-primary-700 hover:text-primary-900 dark:text-primary-400"
          >
            <FiExternalLink className="h-3.5 w-3.5" />
            {isCashierView ? 'House credit balances' : 'Open credit / house accounts'}
          </Link>
        )}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Record payment</p>
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
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'cash', label: 'Cash' },
            { id: 'online', label: 'Online' },
            { id: 'both', label: 'Both' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPayMode(opt.id)}
              className={`rounded-xl border-2 py-2.5 text-xs font-black transition-colors ${
                payMode === opt.id
                  ? 'border-primary-600 bg-primary-50 text-primary-800 dark:border-primary-500 dark:bg-primary-950/50 dark:text-primary-200'
                  : 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button onClick={() => navigate(backPath)} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-950">
          <FiArrowLeft /> Back to Orders
        </button>
        <Button variant="secondary" onClick={printReceipt}>
          <FiPrinter className="mr-2" /> Print Receipt
        </Button>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm"
      >
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-r from-primary-50 via-surface-50 to-emerald-50" />
        <div className="relative p-5 md:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 shadow-sm">
                <FiShoppingBag className="h-4 w-4" />
                Order Details
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-gray-950">#{order.orderNumber}</h1>
                <OrderStatusBadge status={order.status} />
                {order.paymentStatus && (
                  <RestaurantStatusPill value={order.paymentStatus} styles={paymentStatusStyles} uppercase />
                )}
              </div>
              <p className="mt-2 max-w-3xl text-sm text-gray-500">
                {customerName} - Table {order.table?.tableNumber || 'N/A'} - {formatRestaurantDateTime(order.createdAt)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/90 px-5 py-4 shadow-sm xl:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Grand Total</p>
              <p className="mt-1 text-3xl font-bold text-primary-700">{formatMoney(grandTotal)}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoTile label="Items ordered" value={itemCount} icon={FiShoppingBag} accent="bg-primary-50 text-primary-700" />
            <InfoTile label="Estimated wait" value={order.estimatedWaitTime ? `${order.estimatedWaitTime} min` : 'Not set'} icon={FiClock} accent="bg-indigo-50 text-indigo-700" />
            <InfoTile label="Table" value={order.table?.tableNumber || 'N/A'} icon={FiMapPin} accent="bg-emerald-50 text-emerald-700" />
            <InfoTile label="Payment" value={order.paymentMethod || 'N/A'} icon={FiCreditCard} accent="bg-amber-50 text-amber-700" />
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Order Information" icon={FiHash}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DetailRow label="Order number" value={`#${order.orderNumber}`} icon={FiHash} />
              <DetailRow label="Date and time" value={formatRestaurantDateTime(order.createdAt)} icon={FiClock} />
              <DetailRow label="Estimated wait" value={order.estimatedWaitTime ? `${order.estimatedWaitTime} minutes` : 'Not set'} icon={FiClock} />
              <div className="flex items-center gap-3 rounded-xl bg-surface-50/70 px-3 py-3">
                <FiSliders className="h-4 w-4 text-primary-600" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Current status</p>
                  <div className="mt-1"><OrderStatusBadge status={order.status} /></div>
                </div>
              </div>
            </div>
            {order.specialRequests && (
              <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Special requests</p>
                <p className="mt-1 text-sm font-medium text-amber-950">{order.specialRequests}</p>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Order Items" icon={FiShoppingBag}>
            <div className="overflow-hidden rounded-2xl border border-surface-200">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-3 border-b border-surface-200 bg-white px-4 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-sm font-bold text-primary-700">
                      {item.quantity}x
                    </div>
                    <div>
                      <p className="font-bold text-gray-950">{item.name}</p>
                      <p className="text-sm text-gray-500">{formatMoney(item.price)} each</p>
                      {(item.selectedVariations || []).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(item.selectedVariations || []).map((variation, vIdx) => (
                            <span key={`${variation.optionId || variation.optionName}-${vIdx}`} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700">
                              {variation.groupName}: {variation.optionName}
                              {Number(variation.quantity || 1) > 1 ? ` x${variation.quantity}` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.specialInstructions && (
                        <p className="mt-2 rounded-lg bg-surface-50 px-3 py-2 text-sm text-gray-600">Note: {item.specialInstructions}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-right font-bold text-gray-950">{formatMoney(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-gray-950 p-5 text-white">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Subtotal</span>
                  <span className="font-semibold">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Tax</span>
                  <span className="font-semibold">{formatMoney(taxAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-white/15 pt-3 text-lg font-bold">
                  <span>Total</span>
                  <span className="text-surface-100">{formatMoney(grandTotal)}</span>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Order Timeline" icon={FiClock}>
            {order.statusHistory?.length ? (
              <div className="space-y-0">
                {order.statusHistory.map((history, idx) => (
                  <div key={idx} className="relative flex gap-4 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm">
                        <FiCheck className="h-4 w-4" />
                      </span>
                      {idx < order.statusHistory.length - 1 && <span className="mt-2 h-full w-px bg-surface-200" />}
                    </div>
                    <div className="min-w-0 flex-1 rounded-2xl bg-surface-50/70 px-4 py-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="font-bold capitalize text-gray-950">{history.status}</span>
                        <span className="text-xs font-medium text-gray-500">{formatRestaurantDateTime(history.timestamp)}</span>
                      </div>
                      {history.note && <p className="mt-1 text-sm text-gray-500">{history.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50/60 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-gray-900">No timeline updates yet</p>
                <p className="mt-1 text-sm text-gray-500">Status changes will appear here as the order moves through service.</p>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Actions" icon={FiSliders} className="lg:sticky lg:top-6">
            {statusActionContent}
            {!statusActionContent && !showPaymentTools && (
              <div className="rounded-2xl border border-surface-200 bg-surface-50/70 px-4 py-5 text-center">
                <p className="text-sm font-semibold text-gray-900">No actions available</p>
                <p className="mt-1 text-xs text-gray-500">This order is already in a final state.</p>
              </div>
            )}
            {renderCreditSettlementNotice()}
            {showPaymentTools && renderStaffPaymentForm(false)}
          </SectionCard>

          <SectionCard title="Customer Information" icon={FiUser}>
            <div className="space-y-3">
              <DetailRow label="Name" value={customerName} icon={FiUser} />
              {order.guestId && <DetailRow label="Guest ID" value={order.guestId} icon={FiHash} />}
              {order.customerPhone && <DetailRow label="Phone" value={order.customerPhone} icon={FiPhone} />}
              {order.customerEmail && <DetailRow label="Email" value={order.customerEmail} icon={FiMail} />}
              <DetailRow label="Table number" value={order.table?.tableNumber || 'N/A'} icon={FiMapPin} />
            </div>
          </SectionCard>

          {order.paymentStatus && (
            <SectionCard title="Payment Information" icon={FiCreditCard}>
              <div className="space-y-3">
                <div className="rounded-xl bg-surface-50/70 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Payment status</p>
                  <div className="mt-2">
                    <RestaurantStatusPill value={order.paymentStatus} styles={paymentStatusStyles} uppercase />
                  </div>
                </div>
                {order.paymentMethod && <DetailRow label="Payment method" value={order.paymentMethod} icon={FiCreditCard} />}
                <DetailRow label="Amount due" value={formatMoney(grandTotal)} icon={FiCreditCard} />
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetail
