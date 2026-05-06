import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { FiEye, FiRefreshCw, FiGrid, FiList, FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { useSocket } from '../../hooks/useSocket'
import { useAuth } from '../../hooks/useAuth'
import Input from '../../components/common/Input'

const Orders = () => {
  const navigate = useNavigate()
  const { restaurantBase } = useTenantRoutes()
  const { socket } = useSocket()
  const { user } = useAuth()
  const currency = user?.currency || 'Rs.'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 })
  const [viewMode, setViewMode] = useState('card')
  const [trackOrderNumber, setTrackOrderNumber] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [filter, paymentFilter, search, dateFrom, dateTo, page, limit])

  useEffect(() => {
    if (socket) {
      socket.on('new_order', handleNewOrder)
      socket.on('order_updated', handleOrderUpdate)
      return () => {
        socket.off('new_order')
        socket.off('order_updated')
      }
    }
  }, [socket])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await api.get('/restaurant/customer-orders', {
        params: {
          status: filter !== 'all' ? filter : undefined,
          paymentStatus: paymentFilter !== 'all' ? paymentFilter : undefined,
          search: search || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page,
          limit,
        },
      })
      setOrders(res.data.data.orders)
      setPagination(res.data.data.pagination || { page: 1, pages: 1, total: 0, limit })
    } catch (error) {
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const handleNewOrder = (order) => {
    toast.success(`New order #${order.orderNumber} received!`)
    fetchOrders()
  }

  const handleOrderUpdate = (order) => {
    toast(`Order #${order.orderNumber} status updated`)
    fetchOrders()
  }

  const handleTrackByOrderNumber = async () => {
    const code = trackOrderNumber.trim()
    if (!code) {
      toast.error('Enter order number to track')
      return
    }
    try {
      const res = await api.get('/restaurant/customer-orders', {
        params: { search: code, page: 1, limit: 20 }
      })
      const found = (res?.data?.data?.orders || []).find(
        (o) => String(o.orderNumber || '').toLowerCase() === code.toLowerCase()
      )
      if (!found) {
        toast.error('Order not found')
        return
      }
      navigate(`${restaurantBase}/orders/${found._id}`)
    } catch (error) {
      toast.error('Failed to track order')
    }
  }

  const updateOrderStatus = async (orderId, status, estimatedWaitTime = null) => {
    try {
      await api.patch(`/restaurant/customer-orders/${orderId}/status`, { status, estimatedWaitTime })
      toast.success(`Order status updated to ${status}`)
      fetchOrders()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      served: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || styles.pending}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  const filters = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'served', label: 'Served' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Manage and track customer orders</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`${restaurantBase}/orders/new`)}>
            + Create Order
          </Button>
          <Button variant="secondary" onClick={fetchOrders}>
            <FiRefreshCw className="mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-full md:w-72">
            <Input
              icon={FiSearch}
              label="Search"
              placeholder="Order no / customer / phone"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Per page</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setPage(1)
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant={viewMode === 'card' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('card')}
            >
              <FiGrid className="mr-1" /> Card
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('list')}
            >
              <FiList className="mr-1" /> List
            </Button>
          </div>
        </div>

        <div className="flex gap-2 items-end flex-wrap">
          <div className="w-full md:w-80">
            <Input
              label="Track by Order Number"
              placeholder="e.g. ORD-20260506-123456"
              value={trackOrderNumber}
              onChange={(e) => setTrackOrderNumber(e.target.value)}
            />
          </div>
          <Button onClick={handleTrackByOrderNumber}>
            Track Order
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === f.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-600 mr-2">Payment:</span>
          <button
            onClick={() => setPaymentFilter('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              paymentFilter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setPaymentFilter('paid')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              paymentFilter === 'paid'
                ? 'bg-green-600 text-white'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            Paid
          </button>
          <button
            onClick={() => setPaymentFilter('pending')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              paymentFilter === 'pending'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Unpaid
          </button>
        </div>
      </div>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map((order) => (
            <Card key={order._id} className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">#{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">{order.customerName}</p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Table:</span>
                  <span className="font-medium">{order.table?.tableNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Items:</span>
                  <span className="font-medium">{order.items?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total:</span>
                  <span className="font-bold text-primary-600">{currency}{order.grandTotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment:</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      order.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {(order.paymentStatus || 'pending').toUpperCase()}
                  </span>
                </div>
                {order.estimatedWaitTime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Est. Wait:</span>
                    <span className="font-medium">{order.estimatedWaitTime} min</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => navigate(`${restaurantBase}/orders/${order._id}`)}>
                  <FiEye className="mr-1" /> View Details
                </Button>
                
                {order.status === 'pending' && (
                  <Button size="sm" variant="success" onClick={() => updateOrderStatus(order._id, 'confirmed', 15)}>
                    Confirm Order
                  </Button>
                )}
                
                {order.status === 'confirmed' && (
                  <Button size="sm" variant="primary" onClick={() => updateOrderStatus(order._id, 'preparing')}>
                    Start Preparing
                  </Button>
                )}
                
                {order.status === 'preparing' && (
                  <Button size="sm" variant="primary" onClick={() => updateOrderStatus(order._id, 'ready')}>
                    Mark Ready
                  </Button>
                )}
                
                {order.status === 'ready' && (
                  <Button size="sm" variant="success" onClick={() => updateOrderStatus(order._id, 'served')}>
                    Serve Order
                  </Button>
                )}
                
                {['pending', 'confirmed', 'preparing'].includes(order.status) && (
                  <Button size="sm" variant="danger" onClick={() => updateOrderStatus(order._id, 'cancelled')}>
                    Cancel
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-3">Order No</th>
                  <th className="py-2 pr-3">Customer</th>
                  <th className="py-2 pr-3">Table</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Payment</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b last:border-b-0">
                    <td className="py-2 pr-3 font-semibold">#{order.orderNumber}</td>
                    <td className="py-2 pr-3">{order.customerName || 'N/A'}</td>
                    <td className="py-2 pr-3">{order.table?.tableNumber || '-'}</td>
                    <td className="py-2 pr-3">{getStatusBadge(order.status)}</td>
                    <td className="py-2 pr-3">{(order.paymentStatus || 'pending').toUpperCase()}</td>
                    <td className="py-2 pr-3 font-semibold text-primary-600">{currency}{order.grandTotal}</td>
                    <td className="py-2 pr-3">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-3">
                      <Button size="sm" onClick={() => navigate(`${restaurantBase}/orders/${order._id}`)}>
                        <FiEye className="mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {orders.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No orders found
        </div>
      )}

      {orders.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <span className="text-sm font-medium px-2">
              Page {pagination.page} / {pagination.pages || 1}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= (pagination.pages || 1)}
              onClick={() => setPage((p) => Math.min((pagination.pages || 1), p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders