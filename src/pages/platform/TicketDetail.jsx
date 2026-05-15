import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from '@utils/toast'
import { FiArrowLeft, FiSend, FiCheck, FiMessageSquare, FiUserCheck } from 'react-icons/fi'
import ticketService from '../../services/ticket'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { RestaurantPageLoader } from '../../components/restaurant/RestaurantUI'
import { PlatformEmptyState, PlatformMetric, PlatformPageHeader, PlatformPill, platformStatusStyles } from '../../components/platform/PlatformUI'

const PlatformTicketDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)

  useEffect(() => {
    fetchTicket()
  }, [id])

  const fetchTicket = async () => {
    try {
      setLoading(true)
      const res = await ticketService.getAdminTicketDetail(id)
      setTicket(res.data.data)
    } catch (error) {
      toast.error('Failed to load ticket')
      navigate('..')
    } finally {
      setLoading(false)
    }
  }

  const handleAddReply = async () => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply message')
      return
    }

    try {
      setReplyLoading(true)
      const res = await ticketService.addAdminReply(id, replyText)
      setTicket(res.data.data)
      setReplyText('')
      toast.success('Reply sent successfully')
    } catch (error) {
      toast.error('Failed to send reply')
    } finally {
      setReplyLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      setStatusLoading(true)
      const res = await ticketService.updateTicketStatus(id, newStatus)
      setTicket(res.data.data)
      toast.success(`Ticket marked as ${newStatus}`)
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setStatusLoading(false)
    }
  }

  const handleAssign = async () => {
    try {
      setAssignLoading(true)
      const res = await ticketService.assignTicket(id)
      setTicket(res.data.data)
      toast.success('Ticket assigned to you')
    } catch (error) {
      toast.error('Failed to assign ticket')
    } finally {
      setAssignLoading(false)
    }
  }

  if (loading) {
    return <RestaurantPageLoader />
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Ticket not found</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PlatformPageHeader
        badge="Support Conversation"
        title={ticket.subject}
        description={`Ticket ${ticket.ticketNumber} from ${ticket.restaurant?.name || 'restaurant'}`}
        icon={FiMessageSquare}
        actions={<Button variant="secondary" onClick={() => navigate('..')}><FiArrowLeft className="mr-2" />Back to Tickets</Button>}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PlatformMetric label="Status" value={ticket.status.replace('_', ' ')} sub="Current ticket state" icon={FiMessageSquare} accent="from-blue-500 to-indigo-500" />
        <PlatformMetric label="Priority" value={ticket.priority} sub={ticket.category?.replace('_', ' ')} icon={FiCheck} accent="from-amber-500 to-orange-500" />
        <PlatformMetric label="Assigned" value={ticket.assignedTo?.name || 'Unassigned'} sub="Support owner" icon={FiUserCheck} accent="from-emerald-500 to-teal-500" />
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ticket Number</p>
              <p className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100">{ticket.ticketNumber}</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <PlatformPill className={platformStatusStyles[ticket.status]}>
                {ticket.status.replace('_', ' ')}
              </PlatformPill>
              <PlatformPill className={platformStatusStyles[ticket.priority]}>
                {ticket.priority}
              </PlatformPill>
            </div>
          </div>

          <div className="border-t dark:border-gray-800 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">From</p>
            <div className="mt-2">
              <p className="font-medium text-gray-900 dark:text-gray-100">{ticket.restaurant?.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{ticket.restaurant?.email}</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{ticket.subject}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Created on {new Date(ticket.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-300">Category</p>
              <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{ticket.category.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-300">Status</p>
              <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{ticket.status.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-300">Assigned To</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{ticket.assignedTo?.name || 'Unassigned'}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Actions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Change Status</label>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={statusLoading || ticket.status === 'closed'}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 disabled:opacity-50"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          {!ticket.assignedTo && (
            <Button
              onClick={handleAssign}
              loading={assignLoading}
              className="mt-6 flex items-center justify-center gap-2"
            >
              <FiCheck size={16} />
              Assign to Me
            </Button>
          )}
        </div>
      </Card>

      <Card title="Conversation">
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {ticket.replies.length === 0 ? (
            <PlatformEmptyState title="No replies yet" description="Send the first response to start the support conversation." icon={FiMessageSquare} />
          ) : (
            ticket.replies.map((reply, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg ${
                  reply.responder.model === 'Platform'
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'bg-gray-50 border-l-4 border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{reply.responder.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {reply.responder.model === 'Platform' ? 'Admin' : 'Restaurant'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(reply.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{reply.message}</p>
              </div>
            ))
          )}
        </div>

        {ticket.status !== 'closed' && (
          <div className="space-y-3 pt-4 border-t dark:border-gray-800">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your response..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 h-24"
            />
            <Button
              onClick={handleAddReply}
              loading={replyLoading}
              className="flex items-center gap-2"
            >
              <FiSend size={16} />
              Send Response
            </Button>
          </div>
        )}
      </Card>

      {ticket.status === 'closed' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-300">
            This ticket has been closed on {new Date(ticket.closedAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  )
}

export default PlatformTicketDetail
