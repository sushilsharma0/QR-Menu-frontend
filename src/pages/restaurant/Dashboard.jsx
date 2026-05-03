import React, { useState, useEffect } from "react";
import {
  FiShoppingBag,
  FiDollarSign,
  FiUsers,
  FiGrid,
  FiTrendingUp,
  FiTrendingDown,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import toast from "react-hot-toast";
import api from "../../services/api";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { useSocket } from "../../hooks/useSocket";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const STAT_ICON_BG = [
  "bg-gradient-to-br from-blue-500 to-indigo-600",
  "bg-gradient-to-br from-emerald-500 to-green-600",
  "bg-gradient-to-br from-violet-500 to-purple-600",
  "bg-gradient-to-br from-amber-500 to-orange-500",
];

const fmtRs = (v) =>
  `Rs. ${Number(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatPctTrend = (pct) => {
  if (pct === null || pct === undefined) return { text: "New", up: true };
  const n = Number(pct);
  const rounded = Math.round(n * 10) / 10;
  return {
    text: `${rounded >= 0 ? "+" : ""}${rounded}%`,
    up: rounded >= 0,
  };
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchRestaurantProfile();
    fetchDashboardData();

    // Listen for real-time order updates
    if (socket) {
      socket.on("new_order", handleNewOrder);
      socket.on("order_updated", handleOrderUpdate);
      socket.on("payment_updated", handlePaymentUpdate);

      return () => {
        socket.off("new_order", handleNewOrder);
        socket.off("order_updated", handleOrderUpdate);
        socket.off("payment_updated", handlePaymentUpdate);
      };
    }
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, salesRes, popularRes] = await Promise.all([
        api.get("/restaurant/dashboard/stats"),
        api.get("/restaurant/dashboard/analytics/sales?days=7"),
        api.get(
          "/restaurant/dashboard/analytics/popular-items?days=30&limit=5",
        ),
      ]);

      setStats(statsRes.data.data);

      const sales = salesRes.data.data.data || [];
      setSalesData(
        sales.map((item) => ({
          date: item._id,
          revenue: item.revenue,
          orders: item.orders,
        })),
      );

      setPopularItems(popularRes.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = (order) => {
    toast.success(`New order #${order.orderNumber} received!`, {
      duration: 5000,
    });
    fetchDashboardData();
  };

  const handleOrderUpdate = (order) => {
    toast(`Order #${order.orderNumber} status updated to ${order.status}`);
    fetchDashboardData();
  };

  const handlePaymentUpdate = (payment) => {
    toast.success(`Payment updated for order #${payment.orderNumber}`);
    fetchDashboardData();
  };

  const fetchRestaurantProfile = async () => {
    try {
      const res = await api.get('/restaurant/auth/profile')
      setRestaurant(res.data.data)
    } catch (error) {
      console.error('Failed to fetch restaurant profile', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const todayTrend = formatPctTrend(stats?.overview?.todayVsYesterdayPercent);
  const weekTrend = formatPctTrend(stats?.overview?.weekVsPrevWeekPercent);

  const statsCards = [
    {
      title: "Today's Orders",
      value: stats?.overview?.todayOrders || 0,
      icon: FiShoppingBag,
      trend: null,
      trendLabel: null,
    },
    {
      title: "Today's Revenue",
      value: fmtRs(stats?.overview?.todayRevenue),
      icon: FiDollarSign,
      trend: todayTrend,
      trendLabel: "vs yesterday (paid)",
    },
    {
      title: "This Week's Revenue",
      value: fmtRs(stats?.overview?.weekRevenue),
      icon: FiTrendingUp,
      trend: weekTrend,
      trendLabel: "vs last week (paid)",
    },
    {
      title: "Total Revenue",
      value: fmtRs(stats?.overview?.totalRevenue),
      icon: FiDollarSign,
      trend: null,
      trendLabel: null,
    },
  ];

  const activeOrders = stats?.activeOrders || {};
  const activeOrdersTotal = Object.values(activeOrders).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 p-6 md:p-8 text-white shadow-[0_22px_55px_-18px_rgba(15,23,42,0.8)]">
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative flex justify-between items-center gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {restaurant?.logo && (
              <img
                src={restaurant.logo}
                alt={restaurant.name || 'Restaurant Logo'}
                className="h-16 w-16 rounded-2xl object-cover border border-white/20"
              />
            )}
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-200 font-medium">
                Operational Overview
              </p>
              <h1 className="text-3xl md:text-4xl font-bold mt-2">
                {restaurant?.name || 'Restaurant Dashboard'}
              </h1>
              <p className="text-indigo-100/90 mt-2 max-w-2xl">
                Track live orders, revenue trends, and service performance from one place.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/15 border border-white/20">
              Live Orders
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/15 border border-white/20">
              Revenue Tracking
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/15 border border-white/20">
              Real-time Updates
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
              <p className="text-xs text-indigo-100">Active Orders</p>
              <p className="text-2xl font-bold">{activeOrdersTotal}</p>
            </div>
            <Button
              variant="secondary"
              onClick={fetchDashboardData}
              className="!bg-white !text-slate-900 hover:!bg-slate-100 !border-0"
            >
              <FiTrendingUp className="mr-2" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className="relative overflow-hidden bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <div className="absolute -top-10 -right-8 h-24 w-24 rounded-full bg-slate-100/70" />
            <div className="flex items-center justify-between">
              <div className="relative">
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">
                  {stat.value}
                </p>
              </div>
              <div className={`${STAT_ICON_BG[index % STAT_ICON_BG.length]} p-3 rounded-xl text-white shadow-md relative`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            {stat.trend && stat.trendLabel && (
              <div className="flex items-center gap-1 mt-4">
                {stat.trend.up ? (
                  <FiTrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <FiTrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm font-medium ${stat.trend.up ? "text-green-600" : "text-red-600"}`}
                >
                  {stat.trend.text}
                </span>
                <span className="text-sm text-gray-500">{stat.trendLabel}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Active Orders" icon={FiClock}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 text-center border border-yellow-100 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FiClock className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-600">
                    Pending
                  </span>
                </div>
                <p className="text-2xl font-bold text-yellow-700">
                  {activeOrders.pending || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-4 text-center border border-blue-100 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FiTrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">
                    Preparing
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {activeOrders.preparing || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center border border-green-100 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FiCheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    Ready to Serve
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {activeOrders.ready || 0}
                </p>
              </div>
            </div>
            {activeOrdersTotal === 0 && (
              <p className="text-center text-gray-500 py-5 rounded-xl bg-gray-50 mt-4">
                No active orders at the moment
              </p>
            )}
          </Card>
        </div>

        <Card title="Quick Stats" icon={FiUsers}>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-1 border-b border-gray-100">
              <span className="text-gray-600">Total Orders</span>
              <span className="font-bold text-lg">
                {stats?.overview?.totalOrders || 0}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-100">
              <span className="text-gray-600">Total Tables</span>
              <span className="font-bold text-lg">
                {stats?.resources?.totalTables || 0}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-100">
              <span className="text-gray-600">Active Tables</span>
              <span className="font-bold text-lg">
                {stats?.resources?.activeTables || 0}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-100">
              <span className="text-gray-600">Total Employees</span>
              <span className="font-bold text-lg">
                {stats?.resources?.totalEmployees || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Low Stock Items</span>
              <span className="font-bold text-lg text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">
                {stats?.resources?.lowStockCount || 0}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Sales Overview (Last 7 Days)" icon={FiTrendingUp}>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                name="Revenue (Rs.)"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#10b981"
                name="Orders"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Popular Items" icon={FiTrendingUp}>
          <div className="space-y-3">
            {popularItems.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 via-gray-50 to-indigo-50/40 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow"
              >
                <div>
                  <span className="font-medium text-gray-900">
                    {idx + 1}. {item.name}
                  </span>
                  <p className="text-sm text-gray-500">
                    {item.totalQuantity} orders
                  </p>
                </div>
                <span className="font-bold text-primary-600">
                  ${item.totalRevenue?.toFixed(2)}
                </span>
              </div>
            ))}
            {popularItems.length === 0 && (
              <p className="text-center text-gray-500 py-6 rounded-xl bg-gray-50">
                No data available
              </p>
            )}
          </div>
        </Card>

        <Card title="Recent Orders">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats?.recentOrders?.slice(0, 5).map((order) => (
              <div
                key={order._id}
                className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-white/80 hover:border-indigo-100 hover:shadow-sm transition-all"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    #{order.orderNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.customerName} • Table {order.table?.tableNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-600">
                    ${order.grandTotal}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === "served"
                        ? "bg-green-100 text-green-800"
                        : order.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "preparing"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
              <p className="text-center text-gray-500 py-6 rounded-xl bg-gray-50">No recent orders</p>
            )}
          </div>
        </Card>
      </div>

      {stats?.lowStockItemsList && stats.lowStockItemsList.length > 0 && (
        <Card title="Low Stock Alert" icon={FiAlertCircle}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stats.lowStockItemsList.map((item, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-3 border border-red-200 shadow-sm"
              >
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-red-600">
                  Only {item.currentStock} {item.unit} left
                </p>
                <p className="text-xs text-gray-500">
                  Min stock: {item.minStock}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
