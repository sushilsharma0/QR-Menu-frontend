import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from '@utils/toast'
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiLifeBuoy,
  FiMessageSquare,
  FiSend,
  FiTag,
  FiUserCheck,
} from 'react-icons/fi'
import ticketService from '../../services/ticket'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

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

const formatDateTime = (value) => {
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

const InfoBlock = ({ label, value, icon: Icon }) => (
  <div className="rounded-2xl bg-surface-50/70 px-4 py-3">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {Icon && <Icon className="h-4 w-4 text-primary-600" />}
      {label}
    </div>
    <p className="mt-2 break-words text-sm font-bold capitalize text-gray-950">{value || 'N/A'}</p>
  </div>
)

const TicketDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { restaurantBase } = useTenantRoutes()
  const isCreating = !id
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(!!id)
  const [submitting, setSubmitting] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      category: 'technical',
      priority: 'medium',
    },
  })

  useEffect(() => {
    if (id) fetchTicket()
  }, [id])

  const fetchTicket = async () => {
    try {
      setLoading(true)
      const res = await ticketService.getRestaurantTicketDetail(id)
      setTicket(res.data.data)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load ticket')
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
    const message = replyText.trim()
    if (!message) {
      toast.error('Please enter a reply message')
      return
    }

    try {
      setReplyLoading(true)
      const res = await ticketService.addRestaurantReply(id, message)
      setTicket(res.data.data)
      setReplyText('')
      toast.success('Reply added successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add reply')
    } finally {
      setReplyLoading(false)
    }
  }

  const replies = useMemo(() => ticket?.replies || [], [ticket])
  const canReply = ticket && ticket.status !== 'closed'

  if (isCreating) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          onClick={() => navigate('..')}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-950"
        >
          <FiArrowLeft />
          Back to Tickets
        </button>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm"
        >
          <div className="bg-gradient-to-r from-primary-50 via-surface-50 to-emerald-50 p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 shadow-sm">
              <FiLifeBuoy className="h-4 w-4" />
              New Support Request
            </div>
            <h1 className="mt-3 text-3xl font-bold text-gray-950">Create Support Ticket</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Share the issue, choose the urgency, and the platform team can reply directly in this thread.
            </p>
          </div>

          <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-5 p-6 md:p-8">
            <Input
              label="Subject"
              placeholder="Example: Online payment is not updating order status"
              {...register('subject', { required: 'Subject is required' })}
              error={errors.subject?.message}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                <select
                  {...register('category')}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="account">Account</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
                <select
                  {...register('priority')}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                placeholder="Add what happened, what you expected, and any order number or screen where you saw it."
                className="min-h-40 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>

            <div className="flex flex-col gap-3 border-t border-surface-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">A clear subject and steps to reproduce usually gets the fastest answer.</p>
              <Button type="submit" loading={submitting} className="shrink-0">
                <FiSend className="mr-2" />
                Create Ticket
              </Button>
            </div>
          </form>
        </motion.section>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="rounded-3xl border border-surface-200 bg-white py-12 text-center shadow-sm">
        <p className="text-gray-500">Ticket not found</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <button
        onClick={() => navigate('..')}
        className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-950"
      >
        <FiArrowLeft />
        Back to Tickets
      </button>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm"
      >
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-r from-primary-50 via-surface-50 to-emerald-50" />
        <div className="relative p-5 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-primary-700">{ticket.ticketNumber || 'TKT-N/A'}</span>
                <Pill value={ticket.status || 'open'} styles={statusStyles} />
                <Pill value={ticket.priority || 'medium'} styles={priorityStyles} />
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">{ticket.subject || 'Untitled ticket'}</h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-500">
                Created {formatDateTime(ticket.createdAt)} - Last activity {formatDateTime(ticket.lastReplyAt || ticket.updatedAt || ticket.createdAt)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/90 px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Conversation</p>
              <p className="mt-1 text-3xl font-bold text-primary-700">{replies.length}</p>
              <p className="text-xs text-gray-500">replies</p>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="rounded-2xl border-surface-200 shadow-sm">
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-950">Issue Description</h2>
                <div className="mt-3 rounded-2xl bg-surface-50/70 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{ticket.description || 'No description provided.'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoBlock label="Category" value={formatLabel(ticket.category)} icon={FiTag} />
                <InfoBlock label="Assigned to" value={ticket.assignedTo?.name || 'Unassigned'} icon={FiUserCheck} />
              </div>
            </div>
          </Card>

          <Card title="Conversation" icon={FiMessageSquare} className="rounded-2xl border-surface-200 shadow-sm">
            <div className="space-y-4">
              {replies.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50/60 px-4 py-10 text-center">
                  <p className="text-sm font-semibold text-gray-900">No replies yet</p>
                  <p className="mt-1 text-sm text-gray-500">Support replies and your follow-ups will appear here.</p>
                </div>
              ) : (
                replies.map((reply, idx) => {
                  const isPlatform = reply?.responder?.model === 'Platform'
                  const name = reply?.responder?.name || (isPlatform ? 'Support Team' : 'Restaurant')
                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl border px-4 py-4 ${
                        isPlatform
                          ? 'border-blue-100 bg-blue-50'
                          : 'border-surface-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${isPlatform ? 'bg-blue-600 text-white' : 'bg-primary-600 text-white'}`}>
                            {name.slice(0, 1).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-950">{name}</p>
                            <p className="text-xs capitalize text-gray-500">{reply?.responder?.role || (isPlatform ? 'support' : 'restaurant')}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">{formatDateTime(reply?.createdAt)}</p>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{reply?.message || 'No message content.'}</p>
                    </div>
                  )
                })
              )}
            </div>

            {canReply ? (
              <div className="mt-6 space-y-3 border-t border-surface-200 pt-5">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  className="min-h-28 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex justify-end">
                  <Button onClick={handleAddReply} loading={replyLoading}>
                    <FiSend className="mr-2" />
                    Send Reply
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                This ticket is closed. Create a new ticket if you need more help.
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Ticket Summary" icon={FiLifeBuoy} className="rounded-2xl border-surface-200 shadow-sm lg:sticky lg:top-6">
            <div className="space-y-3">
              <InfoBlock label="Status" value={formatLabel(ticket.status)} icon={ticket.status === 'resolved' ? FiCheckCircle : FiClock} />
              <InfoBlock label="Priority" value={formatLabel(ticket.priority)} icon={ticket.priority === 'urgent' ? FiAlertCircle : FiTag} />
              <InfoBlock label="Created" value={formatDateTime(ticket.createdAt)} icon={FiClock} />
              <InfoBlock label="Updated" value={formatDateTime(ticket.updatedAt || ticket.lastReplyAt)} icon={FiMessageSquare} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default TicketDetail
