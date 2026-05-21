import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from '@utils/toast'
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiFilter,
  FiGrid,
  FiLifeBuoy,
  FiList,
  FiMessageSquare,
  FiPlus,
  FiRefreshCw,
  FiSearch,
} from 'react-icons/fi'
import ticketService from '../../services/ticket'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'All priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const statusStyles = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-100 text-gray-700',
}

const priorityStyles = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const formatLabel = (value, fallback = 'N/A') => String(value || fallback).replace(/_/g, ' ')

const formatDate = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

const Pill = ({ value, styles }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[value] || 'bg-gray-100 text-gray-700'}`}>
    {formatLabel(value)}
  </span>
)

const MetricTile = ({ label, value, sub, icon: Icon, accent }) => (
  <motion.div whileHover={{ y: -3 }} className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-gray-950">{value}</p>
        {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </motion.div>
)

const RestaurantTickets = () => {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 })
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' })
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState('table')
  const hasLoadedTicketsRef = useRef(false)

  useEffect(() => {
    fetchTickets()
  }, [filters.status, filters.priority, filters.search, page])

  const fetchTickets = async (quiet = false) => {
    try {
      if (quiet || hasLoadedTicketsRef.current) setRefreshing(true)
      else setLoading(true)

      const params = {
        page,
        limit: 10,
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search.trim() && { search: filters.search.trim() }),
      }
      const res = await ticketService.getRestaurantTickets(params)
      setTickets(res.data.data.tickets || [])
      setPagination(res.data.data.pagination || { page, pages: 1, total: 0, limit: 10 })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load tickets')
    } finally {
      hasLoadedTicketsRef.current = true
      setLoading(false)
      setRefreshing(false)
    }
  }

  const counts = useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1
        if (ticket.priority === 'urgent' || ticket.priority === 'high') acc.needsAttention += 1
        return acc
      },
      { open: 0, in_progress: 0, resolved: 0, closed: 0, needsAttention: 0 },
    )
  }, [tickets])

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  const resetFilters = () => {
    setFilters({ status: '', priority: '', search: '' })
    setPage(1)
  }

  const goToTicket = (ticket) => {
    if (!ticket?._id) {
      toast.error('Ticket id missing')
      return
    }
    navigate(ticket._id)
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm"
      >
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-primary-50 via-surface-50 to-emerald-50" />
        <div className="relative p-5 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 shadow-sm">
                <FiLifeBuoy className="h-4 w-4" />
                Support Desk
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">Support Tickets</h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-500">
                Track issues, reply to support, and keep every request moving from open to resolved.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => fetchTickets(true)} disabled={refreshing}>
                <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button type="button" onClick={() => navigate('create')}>
                <FiPlus className="mr-2" />
                Create Ticket
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Visible tickets" value={tickets.length} sub={`${pagination.total || 0} total matched`} icon={FiMessageSquare} accent="from-primary-600 to-secondary-500" />
            <MetricTile label="Open" value={counts.open + counts.in_progress} sub="Awaiting action" icon={FiClock} accent="from-blue-500 to-indigo-500" />
            <MetricTile label="High priority" value={counts.needsAttention} sub="High and urgent" icon={FiAlertCircle} accent="from-red-500 to-orange-500" />
            <MetricTile label="Resolved" value={counts.resolved + counts.closed} sub="Completed on page" icon={FiCheckCircle} accent="from-emerald-500 to-teal-500" />
          </div>
        </div>
      </motion.section>

      <Card
        title="Filters"
        icon={FiFilter}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={resetFilters} className="text-sm font-semibold text-primary-700 hover:underline">
              Reset
            </button>
            <div className="flex overflow-hidden rounded-xl border border-surface-200 bg-white">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition ${
                  viewMode === 'card' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-surface-50'
                }`}
              >
                <FiGrid className="h-4 w-4" />
                Card
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition ${
                  viewMode === 'table' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-surface-50'
                }`}
              >
                <FiList className="h-4 w-4" />
                Table
              </button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Input
            icon={FiSearch}
            label="Search"
            placeholder="Ticket no, subject, or description"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            >
              {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => updateFilter('priority', e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            >
              {PRIORITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-surface-200 bg-white shadow-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-surface-200 bg-white px-4 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-50 text-primary-600">
            <FiLifeBuoy className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-950">No tickets found</h3>
          <p className="mt-1 max-w-md text-sm text-gray-500">Create a ticket or adjust your filters to see previous support requests.</p>
          <Button onClick={() => navigate('create')} className="mt-5">
            <FiPlus className="mr-2" />
            Create Ticket
          </Button>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 gap-4">
          {tickets.map((ticket, index) => (
            <motion.article
              key={ticket._id || index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.035, 0.18) }}
              className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-primary-700">{ticket.ticketNumber || 'TKT-N/A'}</span>
                    <Pill value={ticket.status || 'open'} styles={statusStyles} />
                    <Pill value={ticket.priority || 'medium'} styles={priorityStyles} />
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-gray-950">{ticket.subject || 'Untitled ticket'}</h2>
                  <p className="mt-1 line-clamp-2 max-w-4xl text-sm text-gray-500">{ticket.description || 'No description provided.'}</p>
                </div>
                <Button type="button" variant="secondary" onClick={() => goToTicket(ticket)} className="shrink-0">
                  <FiEye className="mr-2" />
                  View
                </Button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-surface-50/70 p-4 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="mt-1 font-semibold capitalize text-gray-950">{formatLabel(ticket.category)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Replies</p>
                  <p className="mt-1 font-semibold text-gray-950">{ticket.replies?.length || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Assigned to</p>
                  <p className="mt-1 truncate font-semibold text-gray-950">{ticket.assignedTo?.name || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last activity</p>
                  <p className="mt-1 font-semibold text-gray-950">{formatDate(ticket.lastReplyAt || ticket.updatedAt || ticket.createdAt)}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-surface-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-surface-200 text-sm">
            <thead className="bg-surface-50">
              <tr>
                {['Ticket', 'Subject', 'Status', 'Priority', 'Category', 'Replies', 'Last Activity', 'Actions'].map((header) => (
                  <th key={header} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 bg-white">
              {tickets.map((ticket) => (
                <tr key={ticket._id} className="transition hover:bg-surface-50">
                  <td className="whitespace-nowrap px-5 py-4 font-mono text-sm font-semibold text-primary-700">
                    {ticket.ticketNumber || 'TKT-N/A'}
                  </td>
                  <td className="px-5 py-4">
                    <p className="max-w-sm truncate font-semibold text-gray-950">{ticket.subject || 'Untitled ticket'}</p>
                    <p className="max-w-sm truncate text-xs text-gray-500">{ticket.description || 'No description provided.'}</p>
                  </td>
                  <td className="px-5 py-4"><Pill value={ticket.status || 'open'} styles={statusStyles} /></td>
                  <td className="px-5 py-4"><Pill value={ticket.priority || 'medium'} styles={priorityStyles} /></td>
                  <td className="px-5 py-4 capitalize text-gray-600">{formatLabel(ticket.category)}</td>
                  <td className="px-5 py-4 font-semibold text-gray-950">{ticket.replies?.length || 0}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-gray-600">{formatDate(ticket.lastReplyAt || ticket.updatedAt || ticket.createdAt)}</td>
                  <td className="px-5 py-4">
                    <Button type="button" size="sm" variant="secondary" onClick={() => goToTicket(ticket)}>
                      <FiEye className="mr-1" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tickets.length > 0 && pagination.pages > 1 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-surface-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-500">
            Page <span className="font-semibold text-gray-900">{pagination.page}</span> of{' '}
            <span className="font-semibold text-gray-900">{pagination.pages}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
              Previous
            </Button>
            <Button variant="secondary" disabled={page === pagination.pages} onClick={() => setPage((current) => current + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RestaurantTickets
