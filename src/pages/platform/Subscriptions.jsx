import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCheckCircle, FiCreditCard, FiExternalLink, FiPlus, FiRefreshCw, FiShield } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import { usePlatformPageLoad } from '../../hooks/usePlatformPageLoad'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import PlanCard from '../../components/platform/PlanCard'
import Modal from '../../components/common/Modal'
import { RestaurantPageLoader } from '../../components/restaurant/RestaurantUI'
import { PlatformEmptyState, PlatformMetric, PlatformPageHeader } from '../../components/platform/PlatformUI'

const formatDateTime = (value) => {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleString()
}

const Subscriptions = () => {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingLoading, setPendingLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ open: false, plan: null })

  usePlatformPageLoad(() => {
    fetchPlans()
    fetchPendingRequests()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
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

  if (loading) return <RestaurantPageLoader />

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        badge="Plans & Approvals"
        title="Subscription Plans"
        description="Create restaurant packages, review payment proof, and approve active subscriptions from one billing workspace."
        icon={FiCreditCard}
        actions={
          <>
            <Button variant="secondary" onClick={() => { fetchPlans(); fetchPendingRequests() }}>
              <FiRefreshCw className="mr-2" /> Refresh
            </Button>
            <Button onClick={() => navigate('/platform/subscriptions/create')}>
              <FiPlus className="mr-2" /> Create Plan
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PlatformMetric label="Active plans" value={plans.length} sub="Available subscription tiers" icon={FiCreditCard} accent="from-blue-500 to-indigo-500" />
        <PlatformMetric label="Pending requests" value={pendingRequests.length} sub="Payment proof queue" icon={FiShield} accent="from-yellow-500 to-amber-500" />
        <PlatformMetric label="Popular plan" value={plans.find((plan) => plan.isPopular)?.name || 'Not set'} sub="Highlighted for restaurants" icon={FiCheckCircle} accent="from-emerald-500 to-teal-500" />
      </div>

      <Card title="Pending Plan Requests">
        {pendingLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        ) : pendingRequests.length === 0 ? (
          <PlatformEmptyState title="No requests awaiting approval" description="Restaurants with uploaded payment proof will appear here." icon={FiShield} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-gray-800">
            <table className="min-w-full divide-y divide-surface-200 text-sm dark:divide-gray-800">
              <thead className="bg-surface-50 dark:bg-gray-800/70">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-3">Restaurant</th>
                  <th className="px-5 py-3">Requested plan & price</th>
                  <th className="px-5 py-3">Proof</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {pendingRequests.map((row) => (
                  <tr key={row._id} className="transition hover:bg-surface-50 dark:hover:bg-gray-800/70">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{row.name}</div>
                      <div className="text-gray-500 dark:text-gray-400">{row.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{row.requestedPlan?.name || 'N/A'}</div>
                      {row.requestedPlan?.pricing && (
                        <div className="mt-1 space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
                          <div>Excl. VAT: {row.requestedPlan.pricing.currencySymbol}{Number(row.requestedPlan.pricing.priceExclVat).toFixed(2)}</div>
                          <div>VAT: {row.requestedPlan.pricing.currencySymbol}{Number(row.requestedPlan.pricing.vatAmount).toFixed(2)}</div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            Total: {row.requestedPlan.pricing.currencySymbol}{Number(row.requestedPlan.pricing.totalInclVat).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {row.planPaymentProofPath ? (
                        <a href={row.planPaymentProofPath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-600 hover:underline">
                          View <FiExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">No file</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{formatDateTime(row.planRequestDate)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => approveRequest(row._id)}>Approve</Button>
                        <Button size="sm" variant="secondary" onClick={() => rejectRequest(row._id)}>Reject</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {plans.length === 0 ? (
        <PlatformEmptyState title="No subscription plans yet" description="Create a plan to start assigning paid packages to restaurants." icon={FiCreditCard} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan._id}
              plan={plan}
              onEdit={() => navigate(`/platform/subscriptions/edit/${plan._id}`)}
              onDelete={() => setDeleteModal({ open: true, plan })}
            />
          ))}
        </div>
      )}

      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, plan: null })} title="Delete Plan">
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete <strong>{deleteModal.plan?.name}</strong>?
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, plan: null })}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Subscriptions
