import React, { useEffect, useState } from 'react'
import { FiMapPin, FiRefreshCw } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Button from '../common/Button'
import { formatRestaurantCurrency } from './RestaurantUI'

export default function BranchComparisonPanel() {
  const [branches, setBranches] = useState([])
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/restaurant/insights/branch-comparison', { params: { days } })
      setBranches(res.data?.data?.branches || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load branch comparison')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [days])

  return (
    <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-950 dark:text-gray-100">Branch comparison</h2>
          <p className="text-sm text-gray-500">Revenue and orders across outlets (last {days} days)</p>
        </div>
        <div className="flex gap-2">
          <select
            className="rounded-xl border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
          <Button variant="secondary" size="sm" onClick={load} loading={loading}>
            <FiRefreshCw />
          </Button>
        </div>
      </div>
      {branches.length === 0 ? (
        <p className="mt-6 text-center text-sm text-gray-500">Add branches to compare performance</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-gray-500">
                <th className="py-2 pr-4">Branch</th>
                <th className="py-2 pr-4 text-right">Orders</th>
                <th className="py-2 pr-4 text-right">Revenue</th>
                <th className="py-2 pr-4 text-right">Staff</th>
                <th className="py-2 text-right">Tables</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={String(b.branchId)} className="border-b border-surface-100 dark:border-gray-800">
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-2 font-semibold">
                      <FiMapPin className="text-primary-600" />
                      {b.name}
                      {b.isDefault && (
                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] text-primary-800">Default</span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">{b.orders}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{formatRestaurantCurrency(b.orderRevenue)}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{b.employees}</td>
                  <td className="py-3 text-right tabular-nums">{b.tables}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
