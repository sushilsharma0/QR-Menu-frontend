import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from '@utils/toast'
import { motion } from 'framer-motion'
import {
  FiArrowLeft,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiGrid,
  FiGift,
  FiLock,
  FiRefreshCw,
  FiShoppingBag,
  FiUsers,
} from 'react-icons/fi'
import { TbCurrencyRupee } from 'react-icons/tb'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api from '../../services/api'
import { usePlatformPageLoad } from '../../hooks/usePlatformPageLoad'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Tabs from '../../components/common/Tabs'
import PlanFeatureSelector from '../../components/platform/PlanFeatureSelector'
import {
  RestaurantPageLoader,
  RestaurantStatusPill,
  formatRestaurantCurrency,
  formatRestaurantShortDate,
  orderStatusStyles,
  paymentStatusStyles,
} from '../../components/restaurant/RestaurantUI'

const kycStatusStyles = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  not_submitted: 'bg-gray-100 text-gray-700',
}

const availabilityStyles = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-red-100 text-red-800',
  available: 'bg-green-100 text-green-800',
  unavailable: 'bg-red-100 text-red-800',
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return parsed.toLocaleDateString('en-IN', { dateStyle: 'medium' })
}

const formatDateTime = (date) => {
  if (!date) return 'N/A'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return parsed.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function MetricTile({ label, value, sub, icon: Icon, accent }) {
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

function SalesTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const revenue = payload.find((item) => item.dataKey === 'revenue')?.value || 0
  const transactions = payload.find((item) => item.dataKey === 'transactions')?.value || 0

  return (
    <div className="rounded-2xl border border-surface-200 bg-white/95 px-4 py-3 shadow-xl dark:border-gray-800 dark:bg-gray-900/95">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {formatRestaurantShortDate(label)}
      </p>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Revenue: <span className="font-bold text-primary-700 dark:text-primary-300">{formatRestaurantCurrency(revenue)}</span>
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Transactions: <span className="font-bold text-emerald-700 dark:text-emerald-300">{transactions}</span>
      </p>
    </div>
  )
}

const RestaurantDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [restaurant, setRestaurant] = useState(null)
  const [operations, setOperations] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [planFeatureDefs, setPlanFeatureDefs] = useState([])
  const [planFeatureGroups, setPlanFeatureGroups] = useState([])
  const [customSubmitting, setCustomSubmitting] = useState(false)
  const [customForm, setCustomForm] = useState({
    planLabel: '',
    durationDays: 30,
    limits: {
      maxTables: 10,
      maxEmployees: 5,
      maxCategories: 20,
      maxMenuItems: 100,
    },
    features: {},
  })

  const loadRestaurant = async (quiet = false) => {
    try {
      if (quiet) setRefreshing(true)
      else setLoading(true)

      const [restaurantRes, operationsRes] = await Promise.all([
        api.get(`/platform/restaurants/${id}`),
        api.get(`/platform/restaurants/${id}/operations`).catch(() => null),
      ])

      setRestaurant(restaurantRes.data.data)
      setOperations(operationsRes?.data?.data || null)
    } catch (error) {
      toast.error('Failed to fetch restaurant details')
      navigate('/platform/restaurants')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  usePlatformPageLoad(() => {
    loadRestaurant(false)
  }, [id])

  useEffect(() => {
    const loadFeatureOptions = async () => {
      if (user?.role !== 'super_admin') return
      try {
        const res = await api.get('/platform/subscriptions/plan-feature-options')
        const features = res.data?.data?.features || []
        const groups = res.data?.data?.groups || []
        setPlanFeatureDefs(features)
        setPlanFeatureGroups(groups)
        const initialFlags = {}
        features.forEach((f) => {
          initialFlags[f.key] = true
        })
        setCustomForm((prev) => ({
          ...prev,
          features: { ...initialFlags, ...prev.features },
        }))
      } catch {
        toast.error('Could not load plan feature options')
      }
    }
    loadFeatureOptions()
  }, [user?.role])

  const canAssignCustomPlan = restaurant?.canAssignCustomPlan !== false
  const customPlanBlockedReason = restaurant?.customPlanBlockedReason || null

  const submitCustomPlan = async (e) => {
    e.preventDefault()
    if (!id) return
    if (!canAssignCustomPlan) {
      toast.error(customPlanBlockedReason || 'Cannot assign a custom plan while a catalog subscription is active.')
      return
    }
    setCustomSubmitting(true)
    try {
      await api.post('/platform/subscriptions/assign-custom', {
        restaurantId: id,
        planLabel: customForm.planLabel || undefined,
        durationDays: Number(customForm.durationDays),
        limits: {
          maxTables: Number(customForm.limits.maxTables),
          maxEmployees: Number(customForm.limits.maxEmployees),
          maxCategories: Number(customForm.limits.maxCategories),
          maxMenuItems: Number(customForm.limits.maxMenuItems),
        },
        features: customForm.features,
      })
      toast.success('Custom plan assigned')
      loadRestaurant(true)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Assignment failed')
    } finally {
      setCustomSubmitting(false)
    }
  }

  const toggleStatus = async () => {
    try {
      await api.patch(`/platform/restaurants/${id}/toggle-status`)
      toast.success(`Restaurant ${restaurant.isActive ? 'deactivated' : 'activated'}`)
      loadRestaurant(true)
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const sales = operations?.sales || {}
  const tables = operations?.tables || {}
  const menu = operations?.menu || {}
  const activeOrders = sales.activeOrders || {}
  const activeOrderTotal = Object.values(activeOrders).reduce((sum, value) => sum + Number(value || 0), 0)
  const chartData = sales.daily || []
  const hasSalesData = chartData.some((item) => Number(item.revenue || 0) > 0 || Number(item.transactions || 0) > 0)

  const summaryTiles = useMemo(
    () => [
      {
        label: 'Month revenue',
        value: formatRestaurantCurrency(sales.monthRevenue),
        sub: `${sales.monthTransactions || 0} successful payments`,
        icon: TbCurrencyRupee,
        accent: 'from-primary-600 to-secondary-500',
      },
      {
        label: 'Orders today',
        value: sales.todayOrders || 0,
        sub: `${activeOrderTotal} active right now`,
        icon: FiShoppingBag,
        accent: 'from-emerald-500 to-teal-500',
      },
      {
        label: 'Tables',
        value: tables.total || 0,
        sub: `${tables.active || 0} active, ${tables.capacity || 0} seats`,
        icon: FiGrid,
        accent: 'from-indigo-500 to-violet-500',
      },
      {
        label: 'Menu items',
        value: menu.totalMenuItems || 0,
        sub: `${menu.availableMenuItems || 0} available across ${menu.totalCategories || 0} categories`,
        icon: FiBarChart2,
        accent: 'from-amber-500 to-orange-500',
      },
    ],
    [activeOrderTotal, menu, sales, tables],
  )

  if (loading) return <RestaurantPageLoader />

  const tabs = [
    {
      key: 'operations',
      label: 'Operations',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryTiles.map((tile) => (
              <MetricTile key={tile.label} {...tile} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card title="Sales Activity" icon={FiBarChart2} className="xl:col-span-2">
              {hasSalesData ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 6" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatRestaurantShortDate}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <YAxis
                        yAxisId="revenue"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickFormatter={(value) => `Rs. ${Math.round(Number(value || 0) / 1000)}k`}
                        width={58}
                      />
                      <YAxis yAxisId="transactions" orientation="right" axisLine={false} tickLine={false} width={34} />
                      <Tooltip content={<SalesTooltip />} cursor={{ fill: '#fffcf1' }} />
                      <Bar yAxisId="revenue" dataKey="revenue" fill="#8f2800" radius={[10, 10, 4, 4]} barSize={34} />
                      <Bar yAxisId="transactions" dataKey="transactions" fill="#10b981" radius={[10, 10, 4, 4]} barSize={16} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl bg-surface-50 px-4 text-center dark:bg-gray-800/60">
                  <FiBarChart2 className="h-8 w-8 text-primary-600" />
                  <p className="mt-3 font-semibold text-gray-950 dark:text-gray-100">No sales activity yet</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Successful restaurant payments will appear here.</p>
                </div>
              )}
            </Card>

            <Card title="Active Order Flow" icon={FiClock}>
              <div className="space-y-3">
                {['pending', 'confirmed', 'preparing', 'ready'].map((status) => (
                  <div key={status} className="flex items-center justify-between rounded-2xl bg-surface-50 px-4 py-3 dark:bg-gray-800/60">
                    <RestaurantStatusPill value={status} styles={orderStatusStyles} />
                    <span className="text-xl font-bold text-gray-950 dark:text-gray-100">{activeOrders[status] || 0}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card title="Recent Orders" icon={FiShoppingBag}>
              <div className="space-y-3">
                {(sales.recentOrders || []).map((order) => (
                  <div key={order._id} className="rounded-2xl border border-surface-200 p-4 dark:border-gray-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-950 dark:text-gray-100">#{order.orderNumber}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {order.customerName || 'Guest'} - Table {order.table?.tableNumber || 'N/A'}
                        </p>
                      </div>
                      <p className="font-bold text-primary-700 dark:text-primary-300">{formatRestaurantCurrency(order.grandTotal)}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <RestaurantStatusPill value={order.status} styles={orderStatusStyles} />
                      <RestaurantStatusPill value={order.paymentStatus} styles={paymentStatusStyles} />
                    </div>
                  </div>
                ))}
                {(sales.recentOrders || []).length === 0 && (
                  <div className="rounded-2xl bg-surface-50 p-6 text-center text-sm text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                    No recent orders.
                  </div>
                )}
              </div>
            </Card>

            <Card title="Menu Snapshot" icon={FiCheckCircle}>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-surface-50 p-4 dark:bg-gray-800/60">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Categories</p>
                  <p className="mt-1 text-2xl font-bold text-gray-950 dark:text-gray-100">{menu.totalCategories || 0}</p>
                </div>
                <div className="rounded-2xl bg-surface-50 p-4 dark:bg-gray-800/60">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Unavailable</p>
                  <p className="mt-1 text-2xl font-bold text-gray-950 dark:text-gray-100">{menu.unavailableMenuItems || 0}</p>
                </div>
              </div>
              <div className="space-y-3">
                {(menu.recentItems || []).map((item) => (
                  <div key={item._id} className="flex items-center justify-between gap-3 rounded-2xl border border-surface-200 p-3 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-12 w-12 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 text-xs text-gray-400 dark:bg-gray-800">
                          Menu
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-950 dark:text-gray-100">{item.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.category?.name || 'Uncategorized'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-700 dark:text-primary-300">{formatRestaurantCurrency(item.price)}</p>
                      <RestaurantStatusPill value={item.isAvailable ? 'available' : 'unavailable'} styles={availabilityStyles} />
                    </div>
                  </div>
                ))}
                {(menu.recentItems || []).length === 0 && (
                  <div className="rounded-2xl bg-surface-50 p-6 text-center text-sm text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                    No menu items available.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      ),
    },
    {
      key: 'profile',
      label: 'Profile',
      content: (
        <Card title="Restaurant Information" icon={FiUsers}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['Restaurant Name', restaurant?.name],
              ['Email', restaurant?.email],
              ['Phone', restaurant?.phone],
              ['Slug', restaurant?.slug],
              ['Address', restaurant?.address || 'N/A'],
              ['City', restaurant?.city || 'N/A'],
              ['Opening Time', restaurant?.openingTime || 'N/A'],
              ['Closing Time', restaurant?.closingTime || 'N/A'],
              ['Joined', formatDate(restaurant?.createdAt)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-surface-50 p-4 dark:bg-gray-800/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
                <p className="mt-1 font-semibold text-gray-950 dark:text-gray-100">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      ),
    },
    {
      key: 'compliance',
      label: 'KYC & Plan',
      content: (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card title="KYC Details" icon={FiCheckCircle}>
            {restaurant?.kyc ? (
              <div className="space-y-4">
                <RestaurantStatusPill value={restaurant.kyc.status} styles={kycStatusStyles} />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    ['Owner Name', restaurant.kyc.ownerName],
                    ['ID Type', restaurant.kyc.idType],
                    ['ID Number', restaurant.kyc.idNumber],
                    ['PAN Number', restaurant.kyc.panNumber || 'N/A'],
                    ['Submitted', formatDateTime(restaurant.kyc.createdAt)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-surface-50 p-4 dark:bg-gray-800/60">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
                      <p className="mt-1 font-semibold text-gray-950 dark:text-gray-100">{value}</p>
                    </div>
                  ))}
                </div>
                {restaurant.kyc.status === 'rejected' && (
                  <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                    {restaurant.kyc.rejectionReason || 'No rejection reason provided.'}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-surface-50 p-6 text-center text-sm text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                No KYC submitted yet.
              </div>
            )}
          </Card>

          <Card title="Subscription & Limits" icon={FiCreditCard}>
            <div className="space-y-4">
              <div className="rounded-2xl bg-surface-50 p-4 dark:bg-gray-800/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Current Plan</p>
                <p className="mt-1 text-xl font-bold text-gray-950 dark:text-gray-100">
                  {restaurant?.planAssignmentSource === 'custom'
                    ? restaurant?.customPlanLabel || 'Custom plan'
                    : restaurant?.currentPlan?.name || 'Trial / No Plan'}
                </p>
                {restaurant?.planAssignmentSource === 'custom' && (
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary-600 dark:text-primary-400">
                    Custom assignment (super admin)
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Ends {formatDate(restaurant?.planEndDate || restaurant?.trialEndsAt)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Tables', restaurant?.planLimits?.maxTables || 'Trial'],
                  ['Employees', restaurant?.planLimits?.maxEmployees || 'Trial'],
                  ['Categories', restaurant?.planLimits?.maxCategories || 'Trial'],
                  ['Menu Items', restaurant?.planLimits?.maxMenuItems || 'Trial'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-surface-200 p-4 dark:border-gray-800">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="mt-1 text-xl font-bold text-gray-950 dark:text-gray-100">{value}</p>
                  </div>
                ))}
              </div>
              {restaurant?.requestedPlan && (
                <div className="rounded-2xl bg-yellow-50 p-4 text-sm text-yellow-800">
                  Requested plan: <strong>{restaurant.requestedPlan.name}</strong>
                </div>
              )}
              {['pending', 'qualified'].includes(restaurant?.referralBenefit?.status) && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
                  <div className="flex gap-3">
                    <FiGift className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Referral benefit pending</p>
                      <p className="mt-1">
                        {restaurant.referralBenefit.message}
                      </p>
                      <p className="mt-2 text-xs">
                        {restaurant.referralBenefit.role === 'referrer'
                          ? `Referred restaurant: ${restaurant.referralBenefit.referredRestaurantName || 'N/A'}`
                          : `Referral from: ${restaurant.referralBenefit.referrerRestaurantName || 'N/A'}`}
                        {restaurant.referralBenefit.referralCode ? ` - Code: ${restaurant.referralBenefit.referralCode}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {restaurant?.planFeatureFlags && Object.keys(restaurant.planFeatureFlags).length > 0 && (
                <div className="rounded-2xl border border-surface-200 p-4 text-sm dark:border-gray-700">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Feature access
                  </p>
                  <ul className="mt-2 grid gap-1 text-gray-700 dark:text-gray-300 sm:grid-cols-2">
                    {planFeatureDefs.map((def) => (
                      <li key={def.key} className="flex items-center gap-2">
                        <span
                          className={
                            restaurant.planFeatureFlags[def.key] === false
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }
                        >
                          {restaurant.planFeatureFlags[def.key] === false ? '✗' : '✓'}
                        </span>
                        {def.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          {user?.role === 'super_admin' && (
            <Card title="Assign custom plan" icon={FiCreditCard} className="xl:col-span-2">
              {!canAssignCustomPlan ? (
                <motion.div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/30">
                  <div className="flex gap-3">
                    <FiLock className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700 dark:text-amber-400" />
                    <div>
                      <p className="font-semibold text-amber-950 dark:text-amber-100">Custom plan unavailable</p>
                      <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-200/90">
                        {customPlanBlockedReason ||
                          'This restaurant has an active catalog subscription. Custom plans are only for trial, expired, or partner accounts without a paid plan.'}
                      </p>
                      <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-300/80">
                        To change access, approve or assign a different catalog plan under{' '}
                        <button
                          type="button"
                          onClick={() => navigate('/platform/subscription-payments')}
                          className="font-semibold underline hover:no-underline"
                        >
                          Subscription payments
                        </button>
                        , or wait until the current plan expires.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {restaurant?.planAssignmentSource === 'custom'
                  ? 'Update this restaurant’s custom access (duration, limits, and modules).'
                  : 'Set duration, resource limits, and modules. Use this for trial extensions or partner pilots—not when they already pay for a catalog plan.'}
              </p>
              <form onSubmit={submitCustomPlan} className="mt-4 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Plan label
                    <input
                      type="text"
                      placeholder="e.g. Partner pilot"
                      className="mt-1 w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-gray-950 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      value={customForm.planLabel}
                      onChange={(ev) => setCustomForm((p) => ({ ...p, planLabel: ev.target.value }))}
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Duration (days)
                    <input
                      type="number"
                      min={1}
                      max={3650}
                      required
                      className="mt-1 w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-gray-950 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      value={customForm.durationDays}
                      onChange={(ev) => setCustomForm((p) => ({ ...p, durationDays: ev.target.value }))}
                    />
                  </label>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Limits
                  </p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ['maxTables', 'Max tables'],
                      ['maxEmployees', 'Max employees'],
                      ['maxCategories', 'Max categories'],
                      ['maxMenuItems', 'Max menu items'],
                    ].map(([key, label]) => (
                      <label key={key} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                        <input
                          type="number"
                          min={0}
                          max={999999}
                          required
                          className="mt-1 w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-gray-950 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                          value={customForm.limits[key]}
                          onChange={(ev) =>
                            setCustomForm((p) => ({
                              ...p,
                              limits: { ...p.limits, [key]: ev.target.value },
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <PlanFeatureSelector
                    options={planFeatureDefs}
                    groups={planFeatureGroups}
                    flags={customForm.features}
                    onChange={(features) => setCustomForm((p) => ({ ...p, features }))}
                    disabled={customSubmitting}
                  />
                </div>
                <Button type="submit" disabled={customSubmitting || planFeatureDefs.length === 0}>
                  {customSubmitting
                    ? 'Saving…'
                    : restaurant?.planAssignmentSource === 'custom'
                      ? 'Update custom plan'
                      : 'Assign custom plan'}
                </Button>
              </form>
                </>
              )}
            </Card>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-r from-primary-50 via-surface-50 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
        <div className="relative p-5 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {restaurant?.logo ? (
                <img src={restaurant.logo} alt={restaurant.name} className="h-20 w-20 rounded-3xl object-cover shadow-md" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-100 text-3xl font-bold text-primary-700">
                  {restaurant?.name?.charAt(0) || 'R'}
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-primary-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-primary-300">
                    Platform Restaurant Control
                  </span>
                  <RestaurantStatusPill value={restaurant?.isActive ? 'active' : 'inactive'} styles={availabilityStyles} />
                  <RestaurantStatusPill value={restaurant?.kyc?.status || 'not_submitted'} styles={kycStatusStyles} />
                </div>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 dark:text-gray-100">{restaurant?.name}</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {restaurant?.email} - {restaurant?.phone} - {restaurant?.slug}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => navigate('/platform/restaurants')}>
                <FiArrowLeft className="mr-2" />
                Back
              </Button>
              <Button variant="secondary" onClick={() => loadRestaurant(true)} disabled={refreshing}>
                <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant={restaurant?.isActive ? 'danger' : 'success'} onClick={toggleStatus}>
                {restaurant?.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      <Tabs tabs={tabs} />
    </div>
  )
}

export default RestaurantDetail
