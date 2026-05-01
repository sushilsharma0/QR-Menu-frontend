import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiDollarSign, FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'

const CashierDashboard = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [paymentModal, setPaymentModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await api.get('/restaurant/customer-orders', { params: { status: 'ready,served' } })
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

  const readyOrders = filteredOrders.filter(o => o.status === 'ready')
  const servedOrders = filteredOrders.filter(o => o.status === 'served')

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cashier Dashboard</h1>
        <p className="text-gray-500 mt-1">Process customer payments</p>
      </div>

      <Card>
        <Input
          placeholder="Search by order number or table..."
          icon={FiSearch}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ready for Payment */}
        <Card title="Ready for Payment">
          <div className="space-y-4">
            {readyOrders.map((order) => (
              <div key={order._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">#{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500">Table: {order.table?.tableNumber}</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">${order.grandTotal ?? order.totalAmount}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedOrder(order)
                      setPaymentModal(true)
                    }}
                  >
                    <FiDollarSign className="mr-1" /> Process Payment
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/employee/orders/${order._id}`)}>
                    View Details
                  </Button>
                </div>
              </div>
            ))}
            {readyOrders.length === 0 && (
              <p className="text-center text-gray-500 py-8">No orders ready for payment</p>
            )}
          </div>
        </Card>

        {/* Completed Orders */}
        <Card title="Completed Orders">
          <div className="space-y-4">
            {servedOrders.map((order) => (
              <div key={order._id} className="border rounded-lg p-4 opacity-75">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">#{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500">Table: {order.table?.tableNumber}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(order.updatedAt).toLocaleTimeString()}
                  </span>
                </div>
                <Button size="sm" variant="ghost" className="mt-2" onClick={() => navigate(`/employee/orders/${order._id}`)}>
                  View Receipt
                </Button>
              </div>
            ))}
            {servedOrders.length === 0 && (
              <p className="text-center text-gray-500 py-8">No completed orders</p>
            )}
          </div>
        </Card>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={paymentModal} onClose={() => setPaymentModal(false)} title="Process Payment">
        <div className="p-6">
          {selectedOrder && (
            <>
              <div className="mb-4">
                <p className="text-gray-600">Order #{selectedOrder.orderNumber}</p>
                <p className="text-2xl font-bold text-primary-600">${selectedOrder.grandTotal ?? selectedOrder.totalAmount}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => processPayment(selectedOrder._id, 'cash', selectedOrder.grandTotal ?? selectedOrder.totalAmount)}>Cash</Button>
                <Button onClick={() => processPayment(selectedOrder._id, 'card', selectedOrder.grandTotal ?? selectedOrder.totalAmount)}>Card</Button>
                <Button onClick={() => processPayment(selectedOrder._id, 'online', selectedOrder.grandTotal ?? selectedOrder.totalAmount)}>Online</Button>
                <Button onClick={() => processPayment(selectedOrder._id, 'upi', selectedOrder.grandTotal ?? selectedOrder.totalAmount)}>UPI</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default CashierDashboard