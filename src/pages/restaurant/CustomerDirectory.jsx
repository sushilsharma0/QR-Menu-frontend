import React, { useEffect, useState } from 'react'
import { FiRefreshCw, FiUsers } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { RestaurantPageLoader, formatRestaurantCurrency } from '../../components/restaurant/RestaurantUI'

export default function CustomerDirectory() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/restaurant/crm/customers', {
        params: { search: search || undefined, limit: 50 },
      })
      setCustomers(res.data?.data?.customers || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => load(), 300)
    return () => clearTimeout(t)
  }, [search])

  if (loading && !customers.length) return <RestaurantPageLoader label="Loading customers…" />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-950 dark:text-gray-100">Customer directory</h1>
          <p className="text-sm text-gray-500">Registered customer IDs at your restaurant</p>
        </div>
        <Button variant="secondary" onClick={load}>
          <FiRefreshCw className="mr-1 inline" /> Refresh
        </Button>
      </div>

      <Input className="max-w-md" placeholder="Search name, email, phone, or customer ID" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3 text-right">Orders</th>
              <th className="px-4 py-3 text-right">Spent</th>
              <th className="px-4 py-3 text-right">Points</th>
              <th className="px-4 py-3">Last order</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  <FiUsers className="mx-auto h-8 w-8 opacity-40" />
                  <p className="mt-2">No registered customers yet</p>
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.customerId} className="border-t border-surface-100 dark:border-gray-800">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.customerId}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    <p>{c.email || '—'}</p>
                    <p className="text-xs">{c.phone || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.orderCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatRestaurantCurrency(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.loyaltyPoints}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
