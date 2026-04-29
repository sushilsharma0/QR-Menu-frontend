import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import PlanCard from '../../components/platform/PlanCard'
import Modal from '../../components/common/Modal'

const Subscriptions = () => {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ open: false, plan: null })

  useEffect(() => {
    fetchPlans()
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
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-500 mt-1">Manage subscription plans for restaurants</p>
        </div>
        <Button onClick={() => navigate('/platform/subscriptions/create')}>
          <FiPlus className="mr-2" /> Create Plan
        </Button>
      </div>

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
          <p className="text-gray-700">
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