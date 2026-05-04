import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiPlus, FiFilter, FiSearch } from 'react-icons/fi'
import api from '../../services/api'
import ticketService from '../../services/ticket'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Table from '../../components/common/Table'
import Input from '../../components/common/Input'

const RestaurantTickets = () => {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' })
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchTickets()
  }, [filters, page])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 10,
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority })
      }
      const res = await ticketService.getRestaurantTickets(params)
      setTickets(res.data.data.tickets)
      setPagination(res.data.data.pagination)
    } catch (error) {
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
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
    { header: 'Ticket #', accessor: 'ticketNumber', render: (row) => <span className="font-mono text-sm">{row.ticketNumber}</span> },
    { header: 'Subject', accessor: 'subject', render: (row) => <div className="max-w-xs truncate">{row.subject}</div> },
    { header: 'Category', accessor: 'category', render: (row) => <span className="capitalize text-sm">{row.category.replace('_', ' ')}</span> },
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
    { header: 'Created', accessor: 'createdAt', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    { header: 'Actions', accessor: '_id', render: (row) => (
      <button
        onClick={() => navigate(`${row._id}`)}
        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
      >
        View
      </button>
    )}
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-500 mt-1">Manage your support requests and track resolutions</p>
        </div>
        <Button
          onClick={() => navigate('create')}
          className="flex items-center gap-2"
        >
          <FiPlus size={18} />
          Create Ticket
        </Button>
      </div>

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
            <Button onClick={() => navigate('create')} className="mt-4">
              Create Your First Ticket
            </Button>
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

export default RestaurantTickets
