import React, { useEffect, useMemo, useState } from 'react'
import {
  FiCheckCircle,
  FiEye,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiShoppingBag,
  FiUserCheck,
  FiUserX,
  FiUsers,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { RestaurantPageLoader, RestaurantStatusPill } from '../../components/restaurant/RestaurantUI'

const statusStyles = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-red-100 text-red-800',
}

const kycStatusStyles = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  not_submitted: 'bg-gray-100 text-gray-700',
}

const requestStatusStyles = {
  none: 'bg-gray-100 text-gray-700',
  awaiting_proof: 'bg-blue-100 text-blue-800',
  pending_review: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
}

const planRequestLabels = {
  none: 'No request',
  awaiting_proof: 'Awaiting proof',
  pending_review: 'Pending review',
  rejected: 'Rejected',
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return parsed.toLocaleDateString('en-IN', { dateStyle: 'medium' })
}

const getPlanLabel = (restaurant) => {
  if (restaurant?.currentPlan?.name) return restaurant.currentPlan.name
  if (restaurant?.trialEndsAt && new Date(restaurant.trialEndsAt) > new Date()) return 'Trial'
  return 'No plan'
}

function StatTile({ label, value, sub, icon: Icon, accent }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-gray-100">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  )
}

const Restaurants = () => {
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState([])
  const [stats, setStats] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [kycStatus, setKycStatus] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchRestaurants(false)
  }, [search, status, kycStatus, page])

  const fetchRestaurants = async (quiet = true) => {
    try {
      if (quiet) setRefreshing(true)
      else setLoading(true)

      const [restaurantsRes, statsRes] = await Promise.all([
        api.get('/platform/restaurants', {
          params: {
            search: search.trim() || undefined,
            status: status !== 'all' ? status : undefined,
            kycStatus: kycStatus !== 'all' ? kycStatus : undefined,
            page,
            limit: 20,
          },
        }),
        api.get('/platform/restaurants/stats').catch(() => null),
      ])

      setRestaurants(restaurantsRes.data.data.restaurants || [])
      setPagination(restaurantsRes.data.data.pagination || { page, limit: 20, total: 0, pages: 1 })
      setStats(statsRes?.data?.data || null)
    } catch (error) {
      toast.error('Failed to fetch restaurants')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/platform/restaurants/${id}/toggle-status`)
      toast.success(`Restaurant ${currentStatus ? 'deactivated' : 'activated'}`)
      fetchRestaurants(true)
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setKycStatus('all')
    setPage(1)
  }

  const statTiles = useMemo(
    () => [
      {
        label: 'Total restaurants',
        value: stats?.total ?? pagination.total ?? restaurants.length,
        sub: 'Onboarded tenants',
        icon: FiUsers,
        accent: 'from-blue-500 to-indigo-500',
      },
      {
        label: 'Active',
        value: stats?.active ?? restaurants.filter((item) => item.isActive).length,
        sub: `${stats?.inactive ?? restaurants.filter((item) => !item.isActive).length} inactive`,
        icon: FiShoppingBag,
        accent: 'from-emerald-500 to-teal-500',
      },
      {
        label: 'KYC approved',
        value: stats?.kyc?.approved ?? restaurants.filter((item) => item.kycStatus === 'approved').length,
        sub: `${stats?.kyc?.pending ?? restaurants.filter((item) => item.kycStatus === 'pending').length} pending review`,
        icon: FiShield,
        accent: 'from-amber-500 to-orange-500',
      },
      {
        label: 'Attention',
        value: stats?.kyc?.rejected ?? restaurants.filter((item) => item.kycStatus === 'rejected').length,
        sub: 'Rejected KYC applications',
        icon: FiCheckCircle,
        accent: 'from-rose-500 to-red-500',
      },
    ],
    [pagination.total, restaurants, stats],
  )

  if (loading) return <RestaurantPageLoader />

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-primary-50 via-surface-50 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
        <div className="relative p-5 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-primary-300">
                <FiShoppingBag className="h-4 w-4" />
                Restaurant Operations
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 dark:text-gray-100">Restaurants</h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
                Monitor restaurant accounts, KYC status, subscriptions, and operational readiness from one platform view.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => fetchRestaurants(true)} disabled={refreshing}>
                <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statTiles.map((tile) => (
              <StatTile key={tile.label} {...tile} />
            ))}
          </div>
        </div>
      </motion.section>

      <Card title="Restaurant Directory" icon={FiUsers}>
        <div className="mb-5 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_180px_200px_auto] xl:items-end">
          <Input
            label="Search restaurants"
            placeholder="Search name, email, or phone"
            icon={FiSearch}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setPage(1)
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">KYC</label>
            <select
              value={kycStatus}
              onChange={(event) => {
                setKycStatus(event.target.value)
                setPage(1)
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="all">All KYC</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="not_submitted">Not submitted</option>
            </select>
          </div>
          <Button type="button" variant="outline" onClick={clearFilters}>
            Clear
          </Button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-gray-800">
          <table className="min-w-full divide-y divide-surface-200 text-sm dark:divide-gray-800">
            <thead className="bg-surface-50 dark:bg-gray-800/70">
              <tr>
                {['Restaurant', 'Contact', 'Plan', 'KYC', 'Request', 'Joined', 'Status', 'Actions'].map((header) => (
                  <th key={header} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
              {restaurants.map((restaurant) => (
                <tr key={restaurant._id} className="transition hover:bg-surface-50 dark:hover:bg-gray-800/70">
                  <td className="px-5 py-4">
                    <div className="flex min-w-64 items-center gap-3">
                      {restaurant.logo ? (
                        <img src={restaurant.logo} alt={restaurant.name} className="h-11 w-11 rounded-2xl object-cover shadow-sm" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 font-bold text-primary-700 dark:bg-gray-800 dark:text-primary-300">
                          {restaurant.name?.charAt(0) || 'R'}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-950 dark:text-gray-100">{restaurant.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{restaurant.slug || 'No slug'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-gray-700 dark:text-gray-200">{restaurant.email}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{restaurant.phone || 'No phone'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-950 dark:text-gray-100">{getPlanLabel(restaurant)}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Ends {formatDate(restaurant.planEndDate || restaurant.trialEndsAt)}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <RestaurantStatusPill value={restaurant.kycStatus || 'not_submitted'} styles={kycStatusStyles} />
                  </td>
                  <td className="px-5 py-4">
                    <RestaurantStatusPill
                      value={planRequestLabels[restaurant.planRequestStatus || 'none']}
                      styles={{
                        [planRequestLabels[restaurant.planRequestStatus || 'none']]: requestStatusStyles[restaurant.planRequestStatus || 'none'],
                      }}
                    />
                  </td>
                  <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{formatDate(restaurant.createdAt)}</td>
                  <td className="px-5 py-4">
                    <RestaurantStatusPill value={restaurant.isActive ? 'active' : 'inactive'} styles={statusStyles} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/platform/restaurants/${restaurant._id}`)}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-gray-800"
                        title="View operations"
                      >
                        <FiEye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(restaurant._id, restaurant.isActive)}
                        className={`rounded-lg p-2 transition ${
                          restaurant.isActive
                            ? 'text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-gray-800'
                            : 'text-green-500 hover:bg-green-50 hover:text-green-700 dark:hover:bg-gray-800'
                        }`}
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
                  <td colSpan={8} className="px-6 py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100 text-primary-600 dark:bg-gray-800">
                        <FiSearch className="h-7 w-7" />
                      </div>
                      <p className="mt-4 font-semibold text-gray-950 dark:text-gray-100">No restaurants found</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try changing the search or filter selection.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing page <span className="font-semibold text-gray-900 dark:text-gray-100">{pagination.page || page}</span> of{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{pagination.pages || 1}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page <= 1 || refreshing}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Prev
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page >= (pagination.pages || 1) || refreshing}
              onClick={() => setPage((current) => Math.min(pagination.pages || 1, current + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Restaurants
