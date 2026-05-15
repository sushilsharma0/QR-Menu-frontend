import React, { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import toast from '@utils/toast'
import {
  FiBarChart2,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiRefreshCw,
  FiShoppingBag,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchPosReports } from '../../../services/posApi'
import { usePosAccess } from '../../../hooks/usePosAccess'

const COLORS = ['#8f2800', '#f59e0b', '#10b981', '#2563eb', '#9333ea', '#dc2626', '#64748b']

function money(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`
}

function Metric({ label, value, sub, icon: Icon, tone = 'bg-primary-600' }) {
  return (
    <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-gray-950">{value}</p>
          {sub && <p className="mt-1 text-sm font-semibold text-gray-500">{sub}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </section>
  )
}

function Panel({ title, children, className = '', bodyClassName = '' }) {
  return (
    <section className={`rounded-3xl border border-surface-200 bg-white p-5 shadow-sm ${className}`}>
      <p className="text-xs font-black uppercase tracking-wide text-gray-500">{title}</p>
      <div className={`mt-4 ${bodyClassName}`}>{children}</div>
    </section>
  )
}

export default function PosReports() {
  const { canReports } = usePosAccess()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setLoading(true)
      setData(await fetchPosReports())
    } catch {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const paymentData = useMemo(() => (data?.today?.paymentsByMethod || []).map((row) => ({
    name: row._id || 'Unknown',
    total: row.total,
  })), [data])

  const statusData = useMemo(() => (data?.today?.statusBreakdown || []).map((row) => ({
    name: row._id || 'Unknown',
    count: row.count,
    total: row.total,
  })), [data])

  const channelData = useMemo(() => (data?.today?.channelBreakdown || []).map((row) => ({
    name: String(row._id || 'Unknown').replace('_', ' '),
    count: row.count,
    total: row.total,
  })), [data])

  const weekData = useMemo(() => data?.week?.daily || [], [data])

  const hourlyData = useMemo(() => {
    const byHour = new Map((data?.today?.hourly || []).map((row) => [Number(row._id), row]))
    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      orders: byHour.get(hour)?.orders || 0,
      revenue: byHour.get(hour)?.revenue || 0,
    }))
  }, [data])

  if (!canReports) return <Navigate to=".." replace />
  if (loading) return <div className="flex h-full items-center justify-center text-primary-700">Loading reports...</div>

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary-700">
                <FiBarChart2 className="h-4 w-4" />
                Analytics
              </span>
              <h1 className="mt-3 text-3xl font-black text-gray-950">POS analytics</h1>
              <p className="mt-1 text-sm text-gray-500">Register performance, payment mix, item velocity, shifts, and unpaid balance.</p>
            </div>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-surface-50"
            >
              <FiRefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Today orders" value={data?.today?.orders ?? 0} sub={`${data?.week?.orders || 0} last 7 days`} icon={FiShoppingBag} />
          <Metric label="Paid revenue" value={money(data?.today?.revenue)} sub={`${money(data?.week?.revenue)} last 7 days`} icon={FiDollarSign} tone="bg-emerald-600" />
          <Metric label="Average ticket" value={money(data?.today?.averageTicket)} sub="Paid revenue / orders" icon={FiTrendingUp} tone="bg-blue-600" />
          <Metric label="Unpaid balance" value={money(data?.today?.unpaidBalance)} sub={`${data?.today?.unpaidOrders || 0} unpaid orders`} icon={FiCreditCard} tone="bg-amber-600" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
          <Panel title="7-day revenue and orders" bodyClassName="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value, name) => name === 'revenue' ? money(value) : value} />
                <Area type="monotone" dataKey="revenue" stroke="#8f2800" fill="#fed7aa" strokeWidth={2} />
                <Line type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Payment method mix" bodyClassName="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentData} dataKey="total" nameKey="name" outerRadius={110} label>
                  {paymentData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => money(value)} />
              </PieChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Hourly orders today" bodyClassName="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" interval={2} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="#8f2800" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Order status breakdown" bodyClassName="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8f2800" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Revenue by channel" bodyClassName="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(value) => money(value)} />
                <Bar dataKey="total" fill="#f59e0b" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Top items by quantity">
            <div className="divide-y divide-surface-200">
              {(data?.today?.topItems || []).map((row, index) => (
                <div key={row._id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-xs font-black text-primary-700">{index + 1}</span>
                    <span className="truncate font-semibold text-gray-800">{row._id}</span>
                  </div>
                  <span className="shrink-0 font-black text-primary-700">{row.qty} - {money(row.revenue)}</span>
                </div>
              ))}
              {(data?.today?.topItems || []).length === 0 && (
                <p className="py-6 text-center text-sm text-gray-500">No item data yet.</p>
              )}
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Staff collections">
            <div className="divide-y divide-surface-200">
              {(data?.today?.staffCollections || []).map((row) => (
                <div key={row._id || row.name} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-black text-gray-900">{row.name}</p>
                    <p className="text-xs text-gray-500">{row.role || 'owner'} - {row.payments} payment{row.payments === 1 ? '' : 's'}</p>
                  </div>
                  <span className="shrink-0 font-black text-primary-700">{money(row.total)}</span>
                </div>
              ))}
              {(data?.today?.staffCollections || []).length === 0 && <p className="py-6 text-center text-sm text-gray-500">No collections yet.</p>}
            </div>
          </Panel>

          <Panel title="Open shifts">
            <div className="space-y-3">
              {(data?.shifts?.open || []).map((shift) => (
                <div key={shift._id} className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-gray-950">{shift.operatorName}</p>
                      <p className="text-xs font-semibold capitalize text-gray-500">{shift.operatorRole} - {shift.operatorType}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <FiClock className="h-3.5 w-3.5" />
                        Opened {new Date(shift.openedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black uppercase text-gray-500">Float</p>
                      <p className="text-lg font-black text-primary-700">{money(shift.openingCash)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {(data?.shifts?.open || []).length === 0 && <p className="py-6 text-center text-sm text-gray-500">No open shifts.</p>}
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Metric label="Refunds today" value={money(data?.today?.refunds)} sub="Approved POS refunds and voids" icon={FiRefreshCw} tone="bg-red-600" />
          <Metric label="Open shifts" value={data?.shifts?.openCount || 0} sub="Owner/cashier shifts currently open" icon={FiUsers} tone="bg-slate-700" />
        </div>
      </div>
    </div>
  )
}
