import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiBarChart2, FiShoppingBag } from 'react-icons/fi'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fetchPosReports } from '../../../services/posApi'
import { usePosAccess } from '../../../hooks/usePosAccess'

export default function PosReports() {
  const { canReports } = usePosAccess()
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchPosReports().then(setData).catch(() => toast.error('Failed to load reports'))
  }, [])

  if (!canReports) return <Navigate to=".." replace />

  const chartData = data?.today?.paymentsByMethod?.map((row) => ({
    method: row._id || '-',
    total: row.total,
  })) || []

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary-700">
            <FiBarChart2 className="h-4 w-4" />
            Analytics
          </span>
          <h1 className="mt-3 text-3xl font-black text-gray-950">POS analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Today&apos;s register performance, payment mix, and item velocity.</p>
        </section>

        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-gray-500">Orders</p>
                <p className="mt-2 text-4xl font-black text-gray-950 dark:text-gray-100">{data?.today?.orders ?? '-'}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white">
                <FiShoppingBag className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-primary-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-primary-700">Paid revenue</p>
              <p className="mt-1 text-3xl font-black text-primary-700">Rs. {data?.today?.revenue ?? 0}</p>
            </div>
          </section>

          <section className="h-80 rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <p className="text-xs font-black uppercase tracking-wide text-gray-500">By payment method</p>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="method" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#8f2800" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>

        <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">Top items by quantity</p>
          <div className="mt-3 divide-y divide-surface-200">
            {(data?.today?.topItems || []).map((row) => (
              <div key={row._id} className="flex justify-between gap-4 py-3 text-sm">
                <span className="font-semibold text-gray-800 dark:text-gray-100">{row._id}</span>
                <span className="font-black text-primary-700">{row.qty} - Rs. {row.revenue}</span>
              </div>
            ))}
            {(data?.today?.topItems || []).length === 0 && (
              <p className="py-6 text-center text-sm text-gray-500">No item data yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
