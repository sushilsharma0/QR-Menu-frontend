import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiClipboard, FiGrid, FiPlusCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready']

const WaiterDashboard = () => {
  const navigate = useNavigate()
  const { waiterBase } = useTenantRoutes()
  const [tables, setTables] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [tableRes, orderRes] = await Promise.all([
        api.get('/restaurant/tables'),
        api.get('/restaurant/customer-orders', {
          params: { status: ACTIVE_STATUSES.join(',') },
        }),
      ])
      setTables(tableRes.data?.data || [])
      setOrders(orderRes.data?.data?.orders || [])
    } catch (err) {
      toast.error('Failed to load waiter dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const activeTableIds = useMemo(
    () => new Set(orders.map((order) => String(order.table?._id || order.table))),
    [orders]
  )

  if (loading) {
    return <div className="text-center py-10 text-accent-700">Loading waiter workspace...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Waiter Dashboard</h1>
          <p className="text-accent-700">Quickly pick a table and place orders.</p>
        </div>
        <button className="btn-primary" type="button" onClick={() => navigate(`${waiterBase}/order`)}>
          <FiPlusCircle className="mr-2 inline" />
          Take Order
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs uppercase text-accent-700">Total Tables</p>
          <p className="text-3xl font-bold text-primary-800">{tables.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase text-accent-700">Active Orders</p>
          <p className="text-3xl font-bold text-primary-800">{orders.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase text-accent-700">Available Tables</p>
          <p className="text-3xl font-bold text-primary-800">
            {tables.filter((table) => !activeTableIds.has(String(table._id))).length}
          </p>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
          <FiGrid /> Tables
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {tables.map((table) => {
            const busy = activeTableIds.has(String(table._id))
            return (
              <button
                key={table._id}
                type="button"
                onClick={() => navigate(`${waiterBase}/order?tableId=${table._id}`)}
                className={`rounded-xl border p-3 text-left transition ${
                  busy
                    ? 'border-attention-400 bg-attention-50'
                    : 'border-surface-300 hover:border-primary-300 bg-white'
                }`}
              >
                <p className="text-sm font-semibold text-primary-900">{table.tableNumber}</p>
                <p className="text-xs text-accent-700">{busy ? 'Active order' : 'Available'}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
          <FiClipboard /> Active Orders
        </h2>
        <div className="space-y-2">
          {orders.length === 0 && <p className="text-sm text-accent-700">No active orders right now.</p>}
          {orders.map((order) => (
            <div key={order._id} className="rounded-xl border border-surface-200 px-3 py-2">
              <p className="text-sm font-medium text-primary-900">
                #{order.orderNumber} - {order.table?.tableNumber || 'Table'}
              </p>
              <p className="text-xs text-accent-700 capitalize">
                {order.status}
                {order.createdBy?.type === 'waiter' && order.createdBy?.employeeId?.name
                  ? ` | Order by: ${order.createdBy.employeeId.name} (Waiter)`
                  : ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WaiterDashboard
