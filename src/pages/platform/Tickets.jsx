import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from '@utils/toast'
import { FiActivity, FiAlertCircle, FiCheckCircle, FiClock, FiFilter, FiRefreshCw } from 'react-icons/fi'
import ticketService from '../../services/ticket'
import Card from '../../components/common/Card'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import { PlatformEmptyState, PlatformMetric, PlatformPageHeader, PlatformPill, platformStatusStyles } from '../../components/platform/PlatformUI'

const PlatformTickets = () => {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState({ status: '', priority: '', category: '' })
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchTickets()
    fetchStats()
  }, [filters, page])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 10,
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.category && { category: filters.category })
      }
      const res = await ticketService.getAllTickets(params)
      setTickets(res.data.data.tickets)
      setPagination(res.data.data.pagination)
    } catch (error) {
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await ticketService.getTicketStats()
      setStats(res.data.data)
    } catch (error) {
      console.error('Failed to load stats')
    }
  }

  const columns = [
    { header: 'Ticket #', accessor: 'ticketNumber', render: (row) => <span className="font-mono text-sm font-semibold">{row.ticketNumber}</span> },
    { header: 'Restaurant', accessor: 'restaurant', render: (row) => (
      <div>
        <p className="font-medium">{row.restaurant?.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{row.restaurant?.email}</p>
      </div>
    )},
    { header: 'Subject', accessor: 'subject', render: (row) => <div className="max-w-xs truncate">{row.subject}</div> },
    { header: 'Status', accessor: 'status', render: (row) => (
      <PlatformPill className={platformStatusStyles[row.status]}>
        {row.status.replace('_', ' ')}
      </PlatformPill>
    )},
    { header: 'Priority', accessor: 'priority', render: (row) => (
      <PlatformPill className={platformStatusStyles[row.priority]}>
        {row.priority}
      </PlatformPill>
    )},
    { header: 'Last Reply', accessor: 'lastReplyAt', render: (row) => (
      row.lastReplyAt ? new Date(row.lastReplyAt).toLocaleDateString() : 'No replies'
    )},
    { header: 'Actions', accessor: '_id', render: (row) => (
      <button
        onClick={() => navigate(`/platform/tickets/${row._id}`)}
        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
      >
        View
      </button>
    )}
  ]

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        badge="Support Queue"
        title="Support Tickets"
        description="Manage and respond to restaurant support requests with priority, status, and category filters."
        icon={FiActivity}
        actions={
          <Button type="button" variant="secondary" onClick={() => { fetchTickets(); fetchStats() }} disabled={loading}>
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {stats && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PlatformMetric label="Total tickets" value={stats.totalTickets?.[0]?.count || 0} sub="All support requests" icon={FiActivity} accent="from-blue-500 to-indigo-500" />
          <PlatformMetric label="Open" value={stats.byStatus?.find(s => s._id === 'open')?.count || 0} sub="Needs first response" icon={FiAlertCircle} accent="from-sky-500 to-blue-500" />
          <PlatformMetric label="In progress" value={stats.byStatus?.find(s => s._id === 'in_progress')?.count || 0} sub="Being handled" icon={FiClock} accent="from-yellow-500 to-amber-500" />
          <PlatformMetric label="Resolved" value={stats.byStatus?.find(s => s._id === 'resolved')?.count || 0} sub="Completed requests" icon={FiCheckCircle} accent="from-emerald-500 to-teal-500" />
        </div>
      )}

      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="platform-ticket-status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              id="platform-ticket-status-filter"
              value={filters.status}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, status: e.target.value }))
                setPage(1)
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label htmlFor="platform-ticket-priority-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
            <select
              id="platform-ticket-priority-filter"
              value={filters.priority}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, priority: e.target.value }))
                setPage(1)
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label htmlFor="platform-ticket-category-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
            <select
              id="platform-ticket-category-filter"
              value={filters.category}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, category: e.target.value }))
                setPage(1)
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="feature_request">Feature Request</option>
              <option value="account">Account</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </Card>

      <Card title={`Tickets (${pagination.total || 0})`}>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : tickets.length === 0 ? (
          <PlatformEmptyState title="No tickets found" description="Try clearing filters or check back when restaurants submit support requests." icon={FiFilter} />
        ) : (
          <>
            <Table columns={columns} data={tickets} />
            {pagination.pages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Page {pagination.page} of {pagination.pages}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((prev) => prev - 1)}
                    className="px-4 py-2 border dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === pagination.pages}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="px-4 py-2 border dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

export default PlatformTickets
