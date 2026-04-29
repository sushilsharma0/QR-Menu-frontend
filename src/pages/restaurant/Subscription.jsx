import React, { useState, useEffect } from 'react'
import { FiCheck, FiClock, FiCalendar } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'

const Subscription = () => {
  const [plans, setPlans] = useState([])
  const [currentPlan, setCurrentPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [plansRes, statusRes] = await Promise.all([
        api.get('/platform/subscriptions/plans'),
        api.get('/restaurant/package/status')
      ])
      setPlans(plansRes.data.data)
      setCurrentPlan(statusRes.data.data)
    } catch (error) {
      toast.error('Failed to fetch subscription data')
    } finally {
      setLoading(false)
    }
  }

  const requestPlan = async (planId) => {
    try {
      setRequesting(true)
      await api.post('/restaurant/package/request', { packageId: planId })
      toast.success('Plan request submitted for approval')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Request failed')
    } finally {
      setRequesting(false)
    }
  }

  const getDaysLeft = () => {
    if (!currentPlan?.planEndDate) return 0
    const days = Math.ceil((new Date(currentPlan.planEndDate) - new Date()) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-500 mt-1">Choose the best plan for your restaurant</p>
      </div>

      {/* Current Plan Status */}
      {currentPlan?.currentPlan && (
        <Card title="Current Plan">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-bold text-primary-600">{currentPlan.currentPlan.name}</h3>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-sm text-gray-600">
                  <FiCalendar /> Expires: {new Date(currentPlan.planEndDate).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-600">
                  <FiClock /> {getDaysLeft()} days left
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Auto-renew</p>
              <span className={`px-2 py-1 text-xs rounded-full ${currentPlan.autoRenew ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {currentPlan.autoRenew ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {currentPlan.requestedPlan && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                Request pending: <strong>{currentPlan.requestedPlan.name}</strong> - Awaiting platform approval
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan._id} className={`${plan.isPopular ? 'border-2 border-primary-500 relative' : ''}`}>
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary-600 text-white px-3 py-1 rounded-full text-xs">
                Most Popular
              </div>
            )}
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-500">{plan.durationLabel}</p>
              <p className="text-3xl font-bold text-primary-600 mt-2">${plan.price}</p>
            </div>
            <div className="space-y-2 mb-6">
              {plan.features?.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <FiCheck className="text-green-500 flex-shrink-0" />
                  <span className="text-gray-600">{feature}</span>
                </div>
              ))}
            </div>
            <Button
              className="w-full"
              variant={currentPlan?.currentPlan?._id === plan._id ? 'secondary' : 'primary'}
              disabled={currentPlan?.currentPlan?._id === plan._id || currentPlan?.requestedPlan?._id === plan._id || requesting}
              onClick={() => requestPlan(plan._id)}
            >
              {currentPlan?.currentPlan?._id === plan._id ? 'Current Plan' :
               currentPlan?.requestedPlan?._id === plan._id ? 'Request Pending' : 'Select Plan'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Subscription