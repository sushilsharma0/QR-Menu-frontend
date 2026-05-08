import React, { useEffect, useMemo, useState } from 'react'
import { FiCheckCircle, FiCreditCard, FiRefreshCw, FiXCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Modal from '../../components/common/Modal'
import { PlatformEmptyState, PlatformMetric, PlatformPageHeader, PlatformPill } from '../../components/platform/PlatformUI'

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  pending_verification: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
}

const formatDate = (value) => {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleString()
}

const formatMoney = (value) => `Rs. ${Number(value || 0).toFixed(2)}`

const SubscriptionPayments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('review_queue')
  const [method, setMethod] = useState('all')
  const [review, setReview] = useState({ open: false, payment: null, action: null, note: '' })
  const [saving, setSaving] = useState(false)

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const res = await api.get('/platform/subscription-payments', {
        params: { status, method, limit: 50 },
      })
      setPayments(res.data.data?.payments || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [status, method])

  const metrics = useMemo(() => ({
    pending: payments.filter((payment) => ['pending', 'paid', 'pending_verification'].includes(payment.status)).length,
    approved: payments.filter((payment) => payment.status === 'approved').length,
    total: payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
  }), [payments])

  const submitReview = async () => {
    if (!review.payment || !review.action) return
    try {
      setSaving(true)
      await api.patch(
        `/platform/subscription-payments/${review.payment._id}/${review.action}`,
        { adminNote: review.note },
      )
      toast.success(review.action === 'approve' ? 'Payment approved' : 'Payment rejected')
      setReview({ open: false, payment: null, action: null, note: '' })
      fetchPayments()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Review failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        badge="Gateway Verification"
        title="Subscription Payments"
        description="Review gateway and manual subscription payments before activating restaurant plans."
        icon={FiCreditCard}
        actions={
          <Button variant="secondary" onClick={fetchPayments}>
            <FiRefreshCw className="mr-2" /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PlatformMetric label="In this view" value={payments.length} sub="Filtered payment records" icon={FiCreditCard} accent="from-primary-600 to-secondary-500" />
        <PlatformMetric label="Needs review" value={metrics.pending} sub="Pending, paid, or verified" icon={FiCheckCircle} accent="from-amber-500 to-orange-500" />
        <PlatformMetric label="Visible amount" value={formatMoney(metrics.total)} sub="Across current filters" icon={FiCreditCard} accent="from-emerald-500 to-teal-500" />
      </div>

      <Card
        title="Payment Requests"
        actions={
          <div className="flex flex-wrap gap-2">
            <select className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm dark:bg-gray-900" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="review_queue">Needs review</option>
              <option value="all">All statuses</option>
              <option value="pending">Pending checkout</option>
              <option value="paid">Gateway paid</option>
              <option value="pending_verification">Pending verification</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="failed">Failed</option>
            </select>
            <select className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm dark:bg-gray-900" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="all">All methods</option>
              <option value="esewa">eSewa</option>
              <option value="khalti">Khalti</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        }
      >
        {loading ? (
          <p className="text-sm text-gray-500">Loading payments...</p>
        ) : payments.length === 0 ? (
          <PlatformEmptyState title="No payment requests found" description="Gateway payments submitted by restaurants will appear here." icon={FiCreditCard} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-gray-800">
            <table className="min-w-full divide-y divide-surface-200 text-sm dark:divide-gray-800">
              <thead className="bg-surface-50 dark:bg-gray-800/70">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Restaurant</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Transaction</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {payments.map((payment) => (
                  <tr key={payment._id} className="transition hover:bg-surface-50 dark:hover:bg-gray-800/70">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{payment.restaurantId?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{payment.restaurantId?.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{payment.planId?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{payment.planId?.durationLabel || `${payment.planId?.duration || 0} days`}</div>
                    </td>
                    <td className="px-5 py-4 capitalize">{payment.paymentMethod}</td>
                    <td className="px-5 py-4 font-mono text-xs">{payment.transactionId}</td>
                    <td className="px-5 py-4">{formatMoney(payment.amount)}</td>
                    <td className="px-5 py-4">
                      <PlatformPill className={statusStyles[payment.status] || 'bg-gray-100 text-gray-700'}>
                        {payment.status.replace(/_/g, ' ')}
                      </PlatformPill>
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{formatDate(payment.createdAt)}</td>
                    <td className="px-5 py-4">
                      {['paid', 'pending_verification'].includes(payment.status) ? (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => setReview({ open: true, payment, action: 'approve', note: '' })}>
                            <FiCheckCircle className="mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setReview({ open: true, payment, action: 'reject', note: '' })}>
                            <FiXCircle className="mr-1" /> Reject
                          </Button>
                        </div>
                      ) : payment.status === 'pending' ? (
                        <div className="space-y-2">
                          <Button size="sm" variant="secondary" onClick={() => setReview({ open: true, payment, action: 'reject', note: 'Payment checkout was not completed or verified.' })}>
                            <FiXCircle className="mr-1" /> Reject
                          </Button>
                          <p className="text-xs text-gray-500">Waiting for gateway verification</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">{payment.adminNote || 'Reviewed'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={review.open}
        onClose={() => setReview({ open: false, payment: null, action: null, note: '' })}
        title={review.action === 'approve' ? 'Approve payment' : 'Reject payment'}
      >
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {review.payment?.restaurantId?.name} - {review.payment?.planId?.name} - {formatMoney(review.payment?.amount)}
          </p>
          <label className="mt-4 block text-sm font-semibold text-gray-700 dark:text-gray-200">Admin note</label>
          <textarea
            className="mt-2 min-h-28 w-full rounded-xl border border-surface-300 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
            value={review.note}
            onChange={(e) => setReview((prev) => ({ ...prev, note: e.target.value }))}
            placeholder={review.action === 'approve' ? 'Optional approval note' : 'Reason shown to restaurant'}
          />
          <div className="mt-5 flex gap-2">
            <Button loading={saving} variant={review.action === 'approve' ? 'primary' : 'danger'} onClick={submitReview}>
              {review.action === 'approve' ? 'Approve and activate' : 'Reject payment'}
            </Button>
            <Button variant="secondary" onClick={() => setReview({ open: false, payment: null, action: null, note: '' })}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SubscriptionPayments
