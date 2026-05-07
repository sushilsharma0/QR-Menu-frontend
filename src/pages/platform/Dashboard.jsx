import React, { useState, useEffect } from 'react'
import {
  FiUsers,
  FiShoppingBag,
  FiClock,
  FiTrendingUp,
} from 'react-icons/fi'
import { TbCurrencyRupee } from 'react-icons/tb'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import toast from 'react-hot-toast'
import api from '../../services/api'
import StatsCard from '../../components/platform/StatsCard'
import Card from '../../components/common/Card'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [revenueData, setRevenueData] = useState([])
  const [subscriptionData, setSubscriptionData] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, analyticsRes, subscriptionRes] = await Promise.all([
        api.get('/platform/dashboard/stats'),
        api.get('/platform/dashboard/analytics/revenue?period=monthly&year=2024'),
        api.get('/platform/dashboard/analytics/subscriptions'),
      ])

      setStats(statsRes.data.data)
      
      const revenue = analyticsRes.data.data.data || []
      setRevenueData(revenue.map(item => ({
        name: item._id,
        revenue: item.revenue,
        orders: item.orders,
      })))

      const subscriptions = subscriptionRes.data.data || []
      setSubscriptionData(subscriptions.map(s => ({
        name: s.name,
        value: s.count,
      })))
    } catch (error) {
      toast.error('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const overviewStats = [
    {
      title: 'Total Restaurants',
      value: stats?.overview?.totalRestaurants || 0,
      icon: FiUsers,
      color: 'bg-blue-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Active Restaurants',
      value: stats?.overview?.activeRestaurants || 0,
      icon: FiShoppingBag,
      color: 'bg-green-500',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Total Revenue',
      value: `${DEFAULT_CURRENCY_SYMBOL} ${(stats?.revenue?.total || 0).toLocaleString('en-IN')}`,
      icon: TbCurrencyRupee,
      color: 'bg-yellow-500',
      trend: '+23%',
      trendUp: true,
    },
    {
      title: 'Pending KYC',
      value: stats?.overview?.pendingKYCs || 0,
      icon: FiClock,
      color: 'bg-red-500',
      trend: '-5%',
      trendUp: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening with your platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Revenue Overview" icon={FiTrendingUp}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#93c5fd" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Subscription Distribution" icon={FiTrendingUp}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Recent Orders">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Restaurant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats?.recentOrders?.map((order) => (
                <tr key={order._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{order.orderNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.restaurant?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {DEFAULT_CURRENCY_SYMBOL} {Number(order.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'served' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard