import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiFilter } from 'react-icons/fi'
import ticketService from '../../services/ticket'
import Card from '../../components/common/Card'
import Table from '../../components/common/Table'

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

  const statusColors = {
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800'
  }

  const priorityColors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  }

  const columns = [
    { header: 'Ticket #', accessor: 'ticketNumber', render: (row) => <span className="font-mono text-sm font-semibold">{row.ticketNumber}</span> },
    { header: 'Restaurant', accessor: 'restaurant', render: (row) => (
      <div>
        <p className="font-medium">{row.restaurant?.name}</p>
        <p className="text-xs text-gray-500">{row.restaurant?.email}</p>
      </div>
    )},
    { header: 'Subject', accessor: 'subject', render: (row) => <div className="max-w-xs truncate">{row.subject}</div> },
    { header: 'Status', accessor: 'status', render: (row) => (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[row.status]}`}>
        {row.status.replace('_', ' ')}
      </span>
    )},
    { header: 'Priority', accessor: 'priority', render: (row) => (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityColors[row.priority]}`}>
        {row.priority}
      </span>
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-500 mt-1">Manage and respond to restaurant support requests</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Tickets</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTickets?.[0]?.count || 0}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Open</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.byStatus?.find(s => s._id === 'open')?.count || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.byStatus?.find(s => s._id === 'in_progress')?.count || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.byStatus?.find(s => s._id === 'resolved')?.count || 0}
              </p>
            </div>
          </Card>
        </div>
      )}

      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value })
                setPage(1)
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => {
                setFilters({ ...filters, priority: e.target.value })
                setPage(1)
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => {
                setFilters({ ...filters, category: e.target.value })
                setPage(1)
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
          <div className="text-center py-12">
            <p className="text-gray-500">No tickets found</p>
          </div>
        ) : (
          <>
            <Table columns={columns} data={tickets} />
            {pagination.pages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === pagination.pages}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
