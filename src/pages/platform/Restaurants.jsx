import React, { useState, useEffect } from 'react'
import { FiSearch, FiEye, FiMoreVertical, FiUserCheck, FiUserX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

const Restaurants = () => {
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  useEffect(() => {
    fetchRestaurants()
  }, [search, status])

  const fetchRestaurants = async () => {
    try {
      setLoading(true)
      const response = await api.get('/platform/restaurants', {
        params: { search, status: status !== 'all' ? status : undefined }
      })
      setRestaurants(response.data.data.restaurants)
    } catch (error) {
      toast.error('Failed to fetch restaurants')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/platform/restaurants/${id}/toggle-status`)
      toast.success(`Restaurant ${currentStatus ? 'deactivated' : 'activated'}`)
      fetchRestaurants()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const getKYCStatusBadge = (status) => {
    const styles = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      not_submitted: 'bg-gray-100 text-gray-800'
    }
    const labels = {
      approved: 'Approved',
      pending: 'Pending',
      rejected: 'Rejected',
      not_submitted: 'Not Submitted'
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || styles.not_submitted}`}>
        {labels[status] || 'Not Submitted'}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Restaurants</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Manage all restaurants on the platform</p>
        </div>
        <Button onClick={() => navigate('/platform/restaurants/create')}>
          Add Restaurant
        </Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search restaurants..."
              icon={FiSearch}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Restaurant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
              {restaurants.map((restaurant) => (
                <tr key={restaurant._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/70">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {restaurant.logo ? (
                        <img src={restaurant.logo} alt={restaurant.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium">{restaurant.name?.charAt(0)}</span>
                        </div>
                      )}
                      <span className="font-medium text-gray-900 dark:text-gray-100">{restaurant.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{restaurant.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{restaurant.phone}</td>
                  <td className="px-6 py-4">{getKYCStatusBadge(restaurant.kycStatus)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      restaurant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {restaurant.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(restaurant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/platform/restaurants/${restaurant._id}`)}
                        className="p-1 text-gray-400 transition-colors hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400"
                        title="View Details"
                      >
                        <FiEye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(restaurant._id, restaurant.isActive)}
                        className={`p-1 transition-colors ${restaurant.isActive ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'}`}
                        title={restaurant.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {restaurant.isActive ? <FiUserX className="h-4 w-4" /> : <FiUserCheck className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {restaurants.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No restaurants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default Restaurants