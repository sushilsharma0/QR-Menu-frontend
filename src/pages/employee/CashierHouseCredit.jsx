import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiChevronRight, FiRefreshCw, FiUser } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'

const CashierHouseCredit = () => {
  const navigate = useNavigate()
  const { cashierBase } = useTenantRoutes()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [openByCustomer, setOpenByCustomer] = useState({})

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/restaurant/credit-customers', { params: { status: 'approved' } })
      const items = res.data.data?.items || []
      setCustomers(items)
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not load house accounts')
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const loadOrdersFor = async (customerId) => {
    setOpenByCustomer((prev) => ({ ...prev, [customerId]: 'loading' }))
    try {
      const res = await api.get('/restaurant/customer-orders', {
        params: {
          isCreditSale: true,
          creditCustomerId: customerId,
          paymentStatus: 'pending,partial',
          limit: 50,
        },
      })
      setOpenByCustomer((prev) => ({
        ...prev,
        [customerId]: res.data.data?.orders || [],
      }))
    } catch {
      toast.error('Could not load open bills')
      setOpenByCustomer((prev) => ({ ...prev, [customerId]: [] }))
    }
  }

  const fmt = (n) => `${DEFAULT_CURRENCY_SYMBOL}${Number(n ?? 0).toFixed(2)}`

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 sm:text-3xl">House credit</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Approved accounts and open credit bills. Collect payment on the bill screen.
          </p>
        </div>
        <Button type="button" variant="secondary" className="gap-2" onClick={() => loadCustomers()}>
          <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
      ) : customers.length === 0 ? (
        <Card className="p-8 text-center text-gray-500 dark:text-gray-400">No approved house accounts yet.</Card>
      ) : (
        <div className="space-y-4">
          {customers.map((c) => {
            const owed = Number(c.balanceOwed || 0)
            const slot = openByCustomer[c._id]
            const expanded = slot !== undefined
            const loadingOrders = slot === 'loading'
            const orders = Array.isArray(slot) ? slot : []
            return (
              <Card key={c._id} className="overflow-hidden !p-0">
                <button
                  type="button"
                  onClick={() => {
                    if (expanded) {
                      const next = { ...openByCustomer }
                      delete next[c._id]
                      setOpenByCustomer(next)
                    } else {
                      loadOrdersFor(c._id)
                    }
                  }}
                  className="flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-surface-50 dark:hover:bg-gray-900/60 sm:items-center sm:p-5"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
                    <FiUser className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-bold text-gray-900 dark:text-gray-100">{c.name}</p>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">{c.email}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Open tickets: {c.openCreditOrders ?? 0} · Balance owed:{' '}
                      <span className="font-bold text-amber-700 dark:text-amber-400">{fmt(owed)}</span>
                    </p>
                  </div>
                  <FiChevronRight
                    className={`mt-1 h-5 w-5 shrink-0 text-gray-400 transition-transform sm:mt-0 ${expanded ? 'rotate-90' : ''}`}
                  />
                </button>
                {expanded && (
                  <div className="border-t border-gray-100 bg-surface-50/80 px-4 py-4 dark:border-gray-800 dark:bg-gray-900/40 sm:px-5">
                    {loadingOrders ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loading bills…</p>
                    ) : orders.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No unpaid credit bills.</p>
                    ) : (
                      <ul className="space-y-2">
                        {orders.map((o) => {
                          const due = Math.max(
                            0,
                            Number(o.grandTotal || 0) - Number(o.amountPaidTotal || 0),
                          )
                          return (
                            <li
                              key={o._id}
                              className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-950 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="font-bold text-gray-900 dark:text-gray-100">#{o.orderNumber}</p>
                                <p className="text-xs text-gray-500">
                                  {o.status} · Due {fmt(due)}
                                </p>
                              </div>
                              <Button size="sm" onClick={() => navigate(`${cashierBase}/orders/${o._id}`)}>
                                Pay / view bill
                              </Button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <p className="text-center text-xs text-gray-500">
        <Link to={`${cashierBase}/dashboard`} className="font-semibold text-primary-600 hover:underline dark:text-primary-400">
          Back to payments
        </Link>
      </p>
    </div>
  )
}

export default CashierHouseCredit
