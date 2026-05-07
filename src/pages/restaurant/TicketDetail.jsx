import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiSend } from 'react-icons/fi'
import ticketService from '../../services/ticket'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

const TicketDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { restaurantBase } = useTenantRoutes()
  const [isCreating] = useState(!id)
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(!!id)
  const [submitting, setSubmitting] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    if (id) {
      fetchTicket()
    }
  }, [id])

  const fetchTicket = async () => {
    try {
      setLoading(true)
      const res = await ticketService.getRestaurantTicketDetail(id)
      setTicket(res.data.data)
    } catch (error) {
      toast.error('Failed to load ticket')
      navigate('..')
    } finally {
      setLoading(false)
    }
  }

  const onCreateSubmit = async (data) => {
    try {
      setSubmitting(true)
      const res = await ticketService.createTicket(data)
      toast.success('Ticket created successfully')
      navigate(`${restaurantBase}/tickets/${res.data.data._id}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddReply = async () => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply message')
      return
    }

    try {
      setReplyLoading(true)
      const res = await ticketService.addRestaurantReply(id, replyText)
      setTicket(res.data.data)
      setReplyText('')
      toast.success('Reply added successfully')
    } catch (error) {
      toast.error('Failed to add reply')
    } finally {
      setReplyLoading(false)
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

  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => navigate('..')}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
        >
          <FiArrowLeft size={18} />
          Back to Tickets
        </button>

        <Card title="Create Support Ticket">
          <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
            <Input
              label="Subject"
              placeholder="Brief description of your issue"
              {...register('subject', { required: 'Subject is required' })}
              error={errors.subject?.message}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <select
                {...register('category')}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
              >
                <option value="other">Other</option>
                <option value="technical">Technical Issue</option>
                <option value="billing">Billing</option>
                <option value="feature_request">Feature Request</option>
                <option value="account">Account</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
              <select
                {...register('priority')}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                placeholder="Detailed description of your issue"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 h-32"
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>

            <Button type="submit" loading={submitting}>Create Ticket</Button>
          </form>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Ticket not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate('..')}
        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
      >
        <FiArrowLeft size={18} />
        Back to Tickets
      </button>

      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ticket Number</p>
              <p className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100">{ticket.ticketNumber}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[ticket.status]}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityColors[ticket.priority]}`}>
                {ticket.priority}
              </span>
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

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-300">Category</p>
              <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{ticket.category.replace('_', ' ')}</p>
            </div>
            {ticket.assignedTo && (
              <div>
                <p className="text-gray-600 dark:text-gray-300">Assigned To</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{ticket.assignedTo.name}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card title="Conversation">
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {ticket.replies.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No replies yet</p>
          ) : (
            ticket.replies.map((reply, idx) => (
              <div key={idx} className={`p-4 rounded-lg ${reply.responder.model === 'Platform' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{reply.responder.name}</p>
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
              placeholder="Write your reply..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 h-24"
            />
            <Button
              onClick={handleAddReply}
              loading={replyLoading}
              className="flex items-center gap-2"
            >
              <FiSend size={16} />
              Send Reply
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default TicketDetail
