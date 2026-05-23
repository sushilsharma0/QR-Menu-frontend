import React, { useEffect, useState } from 'react'
import { FiPercent, FiRefreshCw } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import { RestaurantPageLoader, formatRestaurantCurrency } from '../../components/restaurant/RestaurantUI'

export default function FoodCostReport() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/restaurant/insights/food-cost', { params: { days } })
      setData(res.data?.data || null)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load food cost report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [days])

  if (loading && !data) return <RestaurantPageLoader label="Loading food cost…" />

  const summary = data?.summary || {}
  const rows = data?.rows || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-950 dark:text-gray-100">Food cost report</h1>
          <p className="text-sm text-gray-500">Recipe cost vs menu price and sales (last {days} days)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-xl border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
          <Button variant="secondary" onClick={load}>
            <FiRefreshCw className="mr-1 inline" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs uppercase text-gray-500">Menu items</p>
          <p className="text-2xl font-bold">{summary.itemCount || 0}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs uppercase text-gray-500">With recipes</p>
          <p className="text-2xl font-bold">{summary.itemsWithRecipe || 0}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs uppercase text-gray-500 flex items-center gap-1">
            <FiPercent /> Avg margin
          </p>
          <p className="text-2xl font-bold">
            {summary.avgMarginPercent != null ? `${summary.avgMarginPercent}%` : '—'}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs uppercase text-gray-500">Period revenue</p>
          <p className="text-2xl font-bold">{formatRestaurantCurrency(summary.totalRevenue)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Recipe cost</th>
              <th className="px-4 py-3 text-right">Margin %</th>
              <th className="px-4 py-3 text-right">Sold</th>
              <th className="px-4 py-3 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.menuItemId} className="border-t border-surface-100 dark:border-gray-800">
                <td className="px-4 py-3">
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-xs text-gray-500">{row.categoryName}{!row.hasRecipe ? ' · no recipe' : ''}</p>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatRestaurantCurrency(row.price)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatRestaurantCurrency(row.recipeCost)}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {row.marginPercent != null ? `${row.marginPercent}%` : '—'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{row.qtySold}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatRestaurantCurrency(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
