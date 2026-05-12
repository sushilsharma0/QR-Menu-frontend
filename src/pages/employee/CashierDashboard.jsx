import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FiCheckCircle, FiClock, FiCreditCard, FiList, FiSearch, FiUser } from 'react-icons/fi'
import { TbCurrencyRupee } from 'react-icons/tb'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useSocket } from '../../hooks/useSocket'
import useOrderAlerts from '../../hooks/useOrderAlerts'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'

const CashierDashboard = () => {
  const navigate = useNavigate()
  const { cashierBase } = useTenantRoutes()
  const [dueOrders, setDueOrders] = useState([])
  const [paidOrders, setPaidOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { socket } = useSocket()

  useOrderAlerts({
    role: 'cashier',
    onRefresh: () => fetchAll(),
  })

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [dueRes, paidRes] = await Promise.all([
        api.get('/restaurant/customer-orders', {
          params: {
            status: 'served,completed',
            paymentStatus: 'pending,partial',
            limit: 80,
          },
        }),
        api.get('/restaurant/customer-orders', {
          params: {
            paymentStatus: 'paid',
            limit: 25,
          },
        }),
      ])
      setDueOrders(dueRes.data.data.orders || [])
      setPaidOrders(paidRes.data.data.orders || [])
    } catch (error) {
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (!socket) return undefined

    const handleRealtimeUpdate = () => {
      fetchAll()
    }

    socket.on('order_updated', handleRealtimeUpdate)
    socket.on('payment_updated', handleRealtimeUpdate)

    return () => {
      socket.off('order_updated', handleRealtimeUpdate)
      socket.off('payment_updated', handleRealtimeUpdate)
    }
  }, [socket, fetchAll])

  const filterBySearch = (list) =>
    list.filter(
      (order) =>
        order.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        order.table?.tableNumber?.toLowerCase().includes(search.toLowerCase()),
    )

  const readyOrders = filterBySearch(dueOrders)
  const servedOrders = filterBySearch(paidOrders)
  const pendingTotal = readyOrders.reduce(
    (sum, order) =>
      sum + Math.max(0, Number(order.grandTotal ?? order.totalAmount ?? 0) - Number(order.amountPaidTotal || 0)),
    0,
  )
  const paidTotal = servedOrders.reduce(
    (sum, order) => sum + Number(order.grandTotal ?? order.totalAmount ?? 0),
    0,
  )

  const formatAmount = (amount) => `${DEFAULT_CURRENCY_SYMBOL}${Number(amount ?? 0).toFixed(2)}`

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 sm:text-3xl">Payments</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
            Record cash or online payments, post to house credit, print bills, and review what every cashier has closed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`${cashierBase}/transactions`}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-800 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
          >
            <FiList className="h-4 w-4" />
            Transaction log
          </Link>
          <Link
            to={`${cashierBase}/house-credit`}
            className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-bold text-primary-900 shadow-sm transition-colors hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-100"
          >
            <FiUser className="h-4 w-4" />
            House credit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-emerald-100 dark:border-emerald-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                Awaiting payment
              </p>
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
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
                Recent paid
              </p>
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
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                Still due
              </p>
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
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                Recent paid total
              </p>
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
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Search</p>
          <Input
            placeholder="Order number or table…"
            icon={FiSearch}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="py-2.5"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Collect payment" className="shadow-md">
          <div className="space-y-4">
            {readyOrders.map((order) => {
              const due = Math.max(
                0,
                Number(order.grandTotal ?? order.totalAmount ?? 0) - Number(order.amountPaidTotal || 0),
              )
              return (
                <div
                  key={order._id}
                  className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:from-gray-900 dark:to-gray-900/80"
                >
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">#{order.orderNumber}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Table: {order.table?.tableNumber}
                        {order.isCreditSale ? (
                          <span className="ml-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                            Credit
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatAmount(due)}</span>
                  </div>
                  <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                    Open the bill to take cash, online, split tender, or settle house credit.
                  </p>
                  <Button
                    size="sm"
                    className="w-full shadow-sm"
                    onClick={() => navigate(`${cashierBase}/orders/${order._id}`)}
                  >
                    View bill &amp; pay
                  </Button>
                </div>
              )
            })}
            {readyOrders.length === 0 && (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">Nothing waiting for payment.</p>
            )}
          </div>
        </Card>

        <Card title="Recently paid (all cashiers)" className="shadow-md">
          <div className="space-y-4">
            {servedOrders.map((order) => (
              <div
                key={order._id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/40"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">#{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Table: {order.table?.tableNumber}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatAmount(order.grandTotal ?? order.totalAmount)}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(order.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 w-full sm:w-auto"
                  onClick={() => navigate(`${cashierBase}/orders/${order._id}`)}
                >
                  View receipt
                </Button>
              </div>
            ))}
            {servedOrders.length === 0 && (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">No recent paid orders.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default CashierDashboard
