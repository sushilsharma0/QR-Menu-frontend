import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiExternalLink } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import PlanCard from '../../components/platform/PlanCard'
import Modal from '../../components/common/Modal'

const Subscriptions = () => {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingLoading, setPendingLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ open: false, plan: null })

  useEffect(() => {
    fetchPlans()
    fetchPendingRequests()
  }, [])

  const fetchPlans = async () => {
    try {
      const res = await api.get('/platform/subscriptions/plans')
      setPlans(res.data.data)
    } catch (error) {
      toast.error('Failed to fetch plans')
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingRequests = async () => {
    try {
      setPendingLoading(true)
      const res = await api.get('/platform/subscriptions/requests/pending')
      setPendingRequests(res.data.data || [])
    } catch (error) {
      toast.error('Failed to fetch plan requests')
    } finally {
      setPendingLoading(false)
    }
  }

  const approveRequest = async (restaurantId) => {
    try {
      await api.post(`/platform/subscriptions/requests/${restaurantId}/approve`, { notes: '' })
      toast.success('Plan approved and activated')
      fetchPendingRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approve failed')
    }
  }

  const rejectRequest = async (restaurantId) => {
    const reason = window.prompt('Rejection reason for the restaurant:')
    if (reason === null) return
    try {
      await api.post(`/platform/subscriptions/requests/${restaurantId}/reject`, { reason: reason || 'Rejected' })
      toast.success('Request rejected')
      fetchPendingRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reject failed')
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/platform/subscriptions/plans/${deleteModal.plan._id}`)
      toast.success('Plan deleted')
      fetchPlans()
      setDeleteModal({ open: false, plan: null })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete plan')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Subscription Plans</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Manage subscription plans for restaurants</p>
        </div>
        <Button onClick={() => navigate('/platform/subscriptions/create')}>
          <FiPlus className="mr-2" /> Create Plan
        </Button>
      </div>

      <Card title="Pending plan requests (payment verified queue)">
        {pendingLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : pendingRequests.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No requests awaiting approval.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="py-2 pr-4">Restaurant</th>
                  <th className="py-2 pr-4">Requested plan &amp; price</th>
                  <th className="py-2 pr-4">Proof</th>
                  <th className="py-2 pr-4">Submitted</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {pendingRequests.map((row) => (
                  <tr key={row._id}>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{row.name}</div>
                      <div className="text-gray-500 dark:text-gray-400">{row.email}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{row.requestedPlan?.name || '—'}</div>
                      {row.requestedPlan?.pricing && (
                        <div className="mt-1 space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
                          <div>
                            Excl. VAT: {row.requestedPlan.pricing.currencySymbol}
                            {Number(row.requestedPlan.pricing.priceExclVat).toFixed(2)}
                          </div>
                          <div>
                            VAT: {row.requestedPlan.pricing.currencySymbol}
                            {Number(row.requestedPlan.pricing.vatAmount).toFixed(2)}
                          </div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            Total: {row.requestedPlan.pricing.currencySymbol}
                            {Number(row.requestedPlan.pricing.totalInclVat).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {row.planPaymentProofPath ? (
                        <a
                          href={row.planPaymentProofPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 inline-flex items-center gap-1 hover:underline"
                        >
                          View <FiExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Legacy / no file</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">
                      {row.planRequestDate ? new Date(row.planRequestDate).toLocaleString() : '—'}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => approveRequest(row._id)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => rejectRequest(row._id)}>
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan._id}
            plan={plan}
            onEdit={() => navigate(`/platform/subscriptions/edit/${plan._id}`)}
            onDelete={() => setDeleteModal({ open: true, plan })}
          />
        ))}
      </div>

      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, plan: null })} title="Delete Plan">
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete <strong>{deleteModal.plan?.name}</strong>?
          </p>
          <div className="flex gap-3 mt-6">
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, plan: null })}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Subscriptions