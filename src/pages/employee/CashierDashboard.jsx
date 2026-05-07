import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCheckCircle, FiClock, FiCreditCard, FiSearch } from 'react-icons/fi'
import { TbCurrencyRupee } from 'react-icons/tb'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import { useSocket } from '../../hooks/useSocket'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'

const CashierDashboard = () => {
  const navigate = useNavigate()
  const { cashierBase } = useTenantRoutes()
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [paymentModal, setPaymentModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { socket } = useSocket()

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    if (!socket) return undefined

    const handleRealtimeUpdate = () => {
      fetchOrders()
    }

    socket.on('new_order', handleRealtimeUpdate)
    socket.on('order_updated', handleRealtimeUpdate)
    socket.on('payment_updated', handleRealtimeUpdate)

    return () => {
      socket.off('new_order', handleRealtimeUpdate)
      socket.off('order_updated', handleRealtimeUpdate)
      socket.off('payment_updated', handleRealtimeUpdate)
    }
  }, [socket])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await api.get('/restaurant/customer-orders', { params: { status: 'served' } })
      setOrders(res.data.data.orders)
    } catch (error) {
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const processPayment = async (customerOrderId, paymentMethod, amount) => {
    try {
      await api.post('/restaurant/cashier/pay', { customerOrderId, paymentMethod, amount })
      toast.success('Payment processed successfully')
      setPaymentModal(false)
      setSelectedOrder(null)
      fetchOrders()
    } catch (error) {
      toast.error('Payment failed')
    }
  }

  const filteredOrders = orders.filter(order => 
    order.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
    order.table?.tableNumber?.toLowerCase().includes(search.toLowerCase())
  )

  const readyOrders = filteredOrders.filter(
    (o) => o.status === 'served' && o.paymentStatus !== 'paid',
  )
  const servedOrders = filteredOrders.filter(
    (o) => o.paymentStatus === 'paid',
  )
  const pendingTotal = readyOrders.reduce((sum, order) => sum + Number(order.grandTotal ?? order.totalAmount ?? 0), 0)
  const paidTotal = servedOrders.reduce((sum, order) => sum + Number(order.grandTotal ?? order.totalAmount ?? 0), 0)

  const formatAmount = (amount) => `${DEFAULT_CURRENCY_SYMBOL}${Number(amount ?? 0).toFixed(2)}`

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-700 via-primary-600 to-indigo-600 p-6 shadow-lg dark:border-primary-900/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white lg:text-3xl">Cashier Dashboard</h1>
            <p className="mt-1 text-primary-100">Fast checkout, cleaner tracking, and happy customers.</p>
          </div>
          <div className="inline-flex items-center rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur">
            <FiClock className="mr-2 h-4 w-4" />
            Live updates enabled
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-emerald-100 dark:border-emerald-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Ready to pay</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{readyOrders.length}</p>
            </div>
            <span className="rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
              <FiClock className="h-5 w-5" />
            </span>
          </div>
        </Card>
        <Card className="border-sky-100 dark:border-sky-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">Completed</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{servedOrders.length}</p>
            </div>
            <span className="rounded-full bg-sky-100 p-3 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
              <FiCheckCircle className="h-5 w-5" />
            </span>
          </div>
        </Card>
        <Card className="border-amber-100 dark:border-amber-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">Pending amount</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{formatAmount(pendingTotal)}</p>
            </div>
            <span className="rounded-full bg-amber-100 p-3 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
              <TbCurrencyRupee className="h-5 w-5" />
            </span>
          </div>
        </Card>
        <Card className="border-violet-100 dark:border-violet-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">Collected today</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{formatAmount(paidTotal)}</p>
            </div>
            <span className="rounded-full bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
              <FiCreditCard className="h-5 w-5" />
            </span>
          </div>
        </Card>
      </div>

      <Card className="shadow-md">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Find order quickly</p>
          <Input
            placeholder="Search by order number or table..."
            icon={FiSearch}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="py-2.5"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ready to Payment */}
        <Card title="Ready to Payment" className="shadow-md">
          <div className="space-y-4">
            {readyOrders.map((order) => (
              <div
                key={order._id}
                className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:from-gray-900 dark:to-gray-900/80"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">#{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Table: {order.table?.tableNumber}</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {formatAmount(order.grandTotal ?? order.totalAmount)}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    className="flex-1 shadow-sm"
                    onClick={() => {
                      setSelectedOrder(order)
                      setPaymentModal(true)
                    }}
                  >
                    <TbCurrencyRupee className="mr-1" /> Process Payment
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => navigate(`${cashierBase}/orders/${order._id}`)}>
                    View Details
                  </Button>
                </div>
              </div>
            ))}
            {readyOrders.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No served orders waiting for payment</p>
            )}
          </div>
        </Card>

        {/* Completed Payment */}
        <Card title="Completed Payment" className="shadow-md">
          <div className="space-y-4">
            {servedOrders.map((order) => (
              <div key={order._id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">#{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Table: {order.table?.tableNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatAmount(order.grandTotal ?? order.totalAmount)}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(order.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="mt-2" onClick={() => navigate(`${cashierBase}/orders/${order._id}`)}>
                  View Receipt
                </Button>
              </div>
            ))}
            {servedOrders.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No completed orders</p>
            )}
          </div>
        </Card>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={paymentModal} onClose={() => setPaymentModal(false)} title="Process Payment">
        <div className="p-6">
          {selectedOrder && (
            <>
              <div className="mb-4 rounded-xl border border-primary-100 bg-primary-50 p-4 dark:border-primary-900/50 dark:bg-primary-900/20">
                <p className="text-gray-600 dark:text-gray-300">Order #{selectedOrder.orderNumber}</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatAmount(selectedOrder.grandTotal ?? selectedOrder.totalAmount)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button className="py-2.5" onClick={() => processPayment(selectedOrder._id, 'cash', selectedOrder.grandTotal ?? selectedOrder.totalAmount)}>Cash</Button>
                <Button className="py-2.5" onClick={() => processPayment(selectedOrder._id, 'card', selectedOrder.grandTotal ?? selectedOrder.totalAmount)}>Card</Button>
                <Button className="py-2.5" onClick={() => processPayment(selectedOrder._id, 'online', selectedOrder.grandTotal ?? selectedOrder.totalAmount)}>Online</Button>
                <Button className="py-2.5" onClick={() => processPayment(selectedOrder._id, 'upi', selectedOrder.grandTotal ?? selectedOrder.totalAmount)}>UPI</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default CashierDashboard