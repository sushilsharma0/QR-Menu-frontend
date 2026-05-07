import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Tabs from '../../components/common/Tabs'

const RestaurantDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRestaurant()
  }, [id])

  const fetchRestaurant = async () => {
    try {
      const res = await api.get(`/platform/restaurants/${id}`)
      setRestaurant(res.data.data)
    } catch (error) {
      toast.error('Failed to fetch restaurant details')
      navigate('/platform/restaurants')
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async () => {
    try {
      await api.patch(`/platform/restaurants/${id}/toggle-status`)
      toast.success(`Restaurant ${restaurant.isActive ? 'deactivated' : 'activated'}`)
      fetchRestaurant()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const tabs = [
    {
      key: 'info',
      label: 'Information',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Restaurant Name</p>
              <p className="font-medium">{restaurant?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{restaurant?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{restaurant?.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Slug</p>
              <p className="font-medium">{restaurant?.slug}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{restaurant?.address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">City</p>
              <p className="font-medium">{restaurant?.city}</p>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'kyc',
      label: 'KYC Details',
      content: (
        <div className="space-y-6">
          {restaurant?.kyc ? (
            <div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Owner Name</p>
                  <p className="font-medium">{restaurant.kyc.ownerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ID Type</p>
                  <p className="font-medium">{restaurant.kyc.idType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ID Number</p>
                  <p className="font-medium">{restaurant.kyc.idNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">PAN Number</p>
                  <p className="font-medium">{restaurant.kyc.panNumber || 'N/A'}</p>
                </div>
              </div>
              {restaurant.kyc.status === 'rejected' && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-800">Rejection Reason</p>
                  <p className="text-sm text-red-600">{restaurant.kyc.rejectionReason}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No KYC submitted yet</p>
          )}
        </div>
      )
    },
    {
      key: 'subscription',
      label: 'Subscription',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Current Plan</p>
              <p className="font-medium">{restaurant?.currentPlan?.name || 'No Plan'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Plan Start Date</p>
              <p className="font-medium">{restaurant?.planStartDate ? new Date(restaurant.planStartDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Plan End Date</p>
              <p className="font-medium">{restaurant?.planEndDate ? new Date(restaurant.planEndDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Auto Renew</p>
              <p className="font-medium">{restaurant?.autoRenew ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
          {restaurant?.requestedPlan && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                Requested Plan: <strong>{restaurant.requestedPlan.name}</strong> - Awaiting approval
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'limits',
      label: 'Plan Limits',
      content: (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Max Tables</p>
            <p className="font-medium">{restaurant?.planLimits?.maxTables || 'Trial Plan'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Max Employees</p>
            <p className="font-medium">{restaurant?.planLimits?.maxEmployees || 'Trial Plan'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Max Categories</p>
            <p className="font-medium">{restaurant?.planLimits?.maxCategories || 'Trial Plan'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Max Menu Items</p>
            <p className="font-medium">{restaurant?.planLimits?.maxMenuItems || 'Trial Plan'}</p>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{restaurant?.name}</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Restaurant Details</p>
        </div>
        <div className="flex gap-3">
          <Button variant={restaurant?.isActive ? 'danger' : 'success'} onClick={toggleStatus}>
            {restaurant?.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/platform/restaurants')}>
            Back
          </Button>
        </div>
      </div>

      <Tabs tabs={tabs} />
    </div>
  )
}

export default RestaurantDetail