import React, { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiShoppingBag,
  FiTrendingDown,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { TbCurrencyRupee } from "react-icons/tb";
import { motion } from "framer-motion";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import toast from "react-hot-toast";
import api from "../../services/api";
import Button from "../../components/common/Button";
import { useSocket } from "../../hooks/useSocket";
import {
  RestaurantPageLoader,
  RestaurantStatusPill,
  formatRestaurantCurrency,
  formatRestaurantShortDate,
  orderStatusStyles,
} from "../../components/restaurant/RestaurantUI";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

const formatPctTrend = (pct) => {
  if (pct === null || pct === undefined) return { text: "New", up: true };
  const rounded = Math.round(Number(pct) * 10) / 10;
  return {
    text: `${rounded >= 0 ? "+" : ""}${rounded}%`,
    up: rounded >= 0,
  };
};

function getOrderCustomerLabel(order) {
  const name = String(order?.customerName || "").trim();
  if (order?.guestId && (!name || name.toLowerCase() === "guest" || name.toLowerCase() === "qr customer")) {
    return order.guestId;
  }
  return name || order?.guestId || "Guest";
}

function SalesTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const revenue = payload.find((item) => item.dataKey === "revenue")?.value || 0;
  const orders = payload.find((item) => item.dataKey === "orders")?.value || 0;

  return (
    <div className="rounded-2xl border border-surface-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {formatRestaurantShortDate(label)}
      </p>
      <div className="mt-2 space-y-1">
        <p className="flex items-center justify-between gap-6 text-sm">
          <span className="text-gray-500">Revenue</span>
          <span className="font-bold text-primary-700">{formatRestaurantCurrency(revenue)}</span>
        </p>
        <p className="flex items-center justify-between gap-6 text-sm">
          <span className="text-gray-500">Orders</span>
          <span className="font-bold text-emerald-700">{orders}</span>
        </p>
      </div>
    </div>
  );
}

function MetricCard({ title, value, sub, icon: Icon, accent, trend }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -5, transition: { duration: 0.18 } }}
      className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-xl"
    >
      <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${accent} opacity-10`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-950">{value}</p>
          {sub && <p className="mt-1 text-sm text-gray-500">{sub}</p>}
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-md`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {trend && (
        <div className="relative mt-4 flex items-center gap-1 text-sm">
          {trend.up ? (
            <FiTrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <FiTrendingDown className="h-4 w-4 text-red-600" />
          )}
          <span className={`font-semibold ${trend.up ? "text-green-700" : "text-red-700"}`}>
            {trend.text}
          </span>
          <span className="text-gray-500">{trend.label}</span>
        </div>
      )}
    </motion.div>
  );
}

function ActiveOrderTile({ label, value, icon: Icon, classes }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4 }}
      className={`rounded-2xl border p-4 shadow-sm ${classes.wrap}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`text-sm font-semibold ${classes.text}`}>{label}</p>
          <p className={`mt-1 text-3xl font-bold ${classes.value}`}>{value || 0}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${classes.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

function SectionShell({ title, eyebrow, icon: Icon, children, actions, className = "" }) {
  return (
    <motion.section
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={`rounded-3xl border border-surface-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-3 border-b border-surface-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            {eyebrow && <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{eyebrow}</p>}
            <h2 className="text-lg font-bold text-gray-950">{title}</h2>
          </div>
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </motion.section>
  );
}

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { socket } = useSocket();

  const fetchRestaurantProfile = async () => {
    try {
      const res = await api.get("/restaurant/auth/profile");
      setRestaurant(res.data.data);
    } catch (error) {
      console.error("Failed to fetch restaurant profile", error);
    }
  };

  const fetchDashboardData = async (quiet = false) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      const [statsRes, salesRes, popularRes] = await Promise.all([
        api.get("/restaurant/dashboard/stats"),
        api.get("/restaurant/dashboard/analytics/sales?days=7"),
        api.get("/restaurant/dashboard/analytics/popular-items?days=30&limit=5"),
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRestaurantProfile();
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const handleNewOrder = (order) => {
      toast.success(`New order #${order.orderNumber} received`, { duration: 5000 });
      fetchDashboardData(true);
    };
    const handleOrderUpdate = (order) => {
      toast(`Order #${order.orderNumber} moved to ${order.status}`);
      fetchDashboardData(true);
    };
    const handlePaymentUpdate = (payment) => {
      toast.success(`Payment updated for order #${payment.orderNumber}`);
      fetchDashboardData(true);
    };

    socket.on("new_order", handleNewOrder);
    socket.on("order_updated", handleOrderUpdate);
    socket.on("payment_updated", handlePaymentUpdate);
    return () => {
      socket.off("new_order", handleNewOrder);
      socket.off("order_updated", handleOrderUpdate);
      socket.off("payment_updated", handlePaymentUpdate);
    };
  }, [socket]);

  const dashboardModel = useMemo(() => {
    const activeOrders = stats?.activeOrders || {};
    const activeOrdersTotal = Object.values(activeOrders).reduce((a, b) => a + Number(b || 0), 0);
    const totalSalesRevenue = salesData.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
    const totalSalesOrders = salesData.reduce((sum, item) => sum + Number(item.orders || 0), 0);
    const averageOrderValue = totalSalesOrders ? totalSalesRevenue / totalSalesOrders : 0;
    const bestSalesDay = salesData.reduce(
      (best, item) => (Number(item.revenue || 0) > Number(best?.revenue || 0) ? item : best),
      null,
    );
    const hasSalesData = salesData.some(
      (item) => Number(item.revenue || 0) > 0 || Number(item.orders || 0) > 0,
    );

    return {
      activeOrders,
      activeOrdersTotal,
      totalSalesRevenue,
      totalSalesOrders,
      averageOrderValue,
      bestSalesDay,
      hasSalesData,
      todayTrend: formatPctTrend(stats?.overview?.todayVsYesterdayPercent),
      weekTrend: formatPctTrend(stats?.overview?.weekVsPrevWeekPercent),
    };
  }, [salesData, stats]);

  if (loading) return <RestaurantPageLoader />;

  const metricCards = [
    {
      title: "Today's Orders",
      value: stats?.overview?.todayOrders || 0,
      sub: "Orders opened today",
      icon: FiShoppingBag,
      accent: "from-primary-600 to-secondary-500",
    },
    {
      title: "Today's Revenue",
      value: formatRestaurantCurrency(stats?.overview?.todayRevenue),
      sub: "Paid transactions",
      icon: TbCurrencyRupee,
      accent: "from-emerald-500 to-teal-500",
      trend: { ...dashboardModel.todayTrend, label: "vs yesterday" },
    },
    {
      title: "Week Revenue",
      value: formatRestaurantCurrency(stats?.overview?.weekRevenue),
      sub: "Current week paid",
      icon: FiTrendingUp,
      accent: "from-indigo-500 to-violet-500",
      trend: { ...dashboardModel.weekTrend, label: "vs last week" },
    },
    {
      title: "All-Time Revenue",
      value: formatRestaurantCurrency(stats?.overview?.totalRevenue),
      sub: `${stats?.overview?.totalOrders || 0} total orders`,
      icon: TbCurrencyRupee,
      accent: "from-amber-500 to-orange-500",
    },
  ];

  const salesSummary = [
    {
      label: "7-day revenue",
      value: formatRestaurantCurrency(dashboardModel.totalSalesRevenue),
      icon: TbCurrencyRupee,
      accent: "from-primary-600 to-secondary-500",
    },
    {
      label: "Orders",
      value: dashboardModel.totalSalesOrders,
      icon: FiShoppingBag,
      accent: "from-emerald-500 to-teal-500",
    },
    {
      label: "Average order",
      value: formatRestaurantCurrency(dashboardModel.averageOrderValue),
      icon: FiBarChart2,
      accent: "from-amber-500 to-orange-500",
    },
    {
      label: "Best day",
      value: formatRestaurantShortDate(dashboardModel.bestSalesDay?.date),
      icon: FiCalendar,
      accent: "from-indigo-500 to-violet-500",
    },
  ];

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2rem] border border-primary-900/10 bg-[#210b02] p-5 text-white shadow-[0_28px_70px_-28px_rgba(57,16,0,0.75)] md:p-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(231,199,75,0.22),transparent_28%),radial-gradient(circle_at_85%_0%,rgba(16,185,129,0.2),transparent_26%),linear-gradient(135deg,#391000_0%,#641c00_42%,#1f2937_100%)]" />
        <div className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
        <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            {restaurant?.logo ? (
              <img
                src={restaurant.logo}
                alt={restaurant.name || "Restaurant Logo"}
                className="h-20 w-20 rounded-3xl border border-white/20 object-cover shadow-2xl"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/10 shadow-2xl">
                <FiShoppingBag className="h-9 w-9 text-white" />
              </div>
            )}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-surface-100">
                Live Restaurant Command Center
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                {restaurant?.name || "Restaurant Dashboard"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78 md:text-base">
                Watch revenue, orders, table readiness, stock signals, and service movement from one beautiful operational cockpit.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs text-white/65">Active Orders</p>
              <p className="text-3xl font-black">{dashboardModel.activeOrdersTotal}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs text-white/65">Low Stock</p>
              <p className="text-3xl font-black">{stats?.resources?.lowStockCount || 0}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="col-span-2 !border-0 !bg-white !text-primary-900 hover:!bg-surface-50 sm:col-span-1"
            >
              <FiRefreshCw className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </motion.section>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metricCards.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionShell title="Active Order Flow" eyebrow="Kitchen pulse" icon={FiClock} className="xl:col-span-2">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            <ActiveOrderTile
              label="Pending"
              value={dashboardModel.activeOrders.pending}
              icon={FiClock}
              classes={{
                wrap: "border-yellow-100 bg-gradient-to-br from-yellow-50 to-amber-50",
                text: "text-yellow-700",
                value: "text-yellow-800",
                icon: "bg-yellow-100 text-yellow-700",
              }}
            />
            <ActiveOrderTile
              label="Preparing"
              value={dashboardModel.activeOrders.preparing}
              icon={FiTrendingUp}
              classes={{
                wrap: "border-blue-100 bg-gradient-to-br from-blue-50 to-sky-50",
                text: "text-blue-700",
                value: "text-blue-800",
                icon: "bg-blue-100 text-blue-700",
              }}
            />
            <ActiveOrderTile
              label="Ready"
              value={dashboardModel.activeOrders.ready}
              icon={FiCheckCircle}
              classes={{
                wrap: "border-emerald-100 bg-gradient-to-br from-green-50 to-emerald-50",
                text: "text-emerald-700",
                value: "text-emerald-800",
                icon: "bg-emerald-100 text-emerald-700",
              }}
            />
          </motion.div>
          {dashboardModel.activeOrdersTotal === 0 && (
            <div className="mt-4 rounded-2xl bg-surface-50 px-4 py-5 text-center text-sm text-gray-500">
              Calm service right now. New orders will appear here instantly.
            </div>
          )}
        </SectionShell>

        <SectionShell title="Operations Snapshot" eyebrow="Resources" icon={FiUsers}>
          <div className="space-y-3">
            {[
              ["Total Orders", stats?.overview?.totalOrders || 0],
              ["Total Tables", stats?.resources?.totalTables || 0],
              ["Active Tables", stats?.resources?.activeTables || 0],
              ["Employees", stats?.resources?.totalEmployees || 0],
              ["Low Stock Items", stats?.resources?.lowStockCount || 0],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl bg-surface-50 px-4 py-3">
                <span className="text-sm font-medium text-gray-600">{label}</span>
                <span className={`text-lg font-black ${label === "Low Stock Items" && value > 0 ? "text-red-600" : "text-gray-950"}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </SectionShell>
      </div>

      <SectionShell
        title="Sales Performance"
        eyebrow="Last 7 days"
        icon={FiTrendingUp}
        actions={
          <div className="rounded-2xl border border-surface-200 bg-white px-4 py-2 text-sm">
            <span className="text-gray-500">Total:</span>{" "}
            <span className="font-black text-primary-700">
              {formatRestaurantCurrency(dashboardModel.totalSalesRevenue)}
            </span>
          </div>
        }
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {salesSummary.map((item) => (
            <motion.div
              key={item.label}
              variants={cardVariants}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-black text-gray-950">{item.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-md`}>
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-5 rounded-3xl border border-surface-200 bg-gradient-to-b from-white to-surface-50 p-3 md:p-5">
          {dashboardModel.hasSalesData ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={salesData} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8f2800" stopOpacity={0.92} />
                      <stop offset="100%" stopColor="#b64a26" stopOpacity={0.22} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatRestaurantShortDate}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    dy={8}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    tickFormatter={(value) => `Rs. ${Math.round(Number(value || 0) / 1000)}k`}
                    width={58}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    width={34}
                  />
                  <Tooltip content={<SalesTooltip />} cursor={{ fill: "#fffcf1" }} />
                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    name="Revenue"
                    fill="url(#salesRevenueGradient)"
                    radius={[12, 12, 4, 4]}
                    barSize={38}
                    animationDuration={1000}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
                    activeDot={{ r: 7, strokeWidth: 0, fill: "#059669" }}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl bg-surface-50 px-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm">
                <FiBarChart2 className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-950">No sales data yet</h3>
              <p className="mt-1 max-w-md text-sm text-gray-500">
                Paid transactions from the last seven days will appear here as soon as orders are completed.
              </p>
            </div>
          )}
        </div>
      </SectionShell>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionShell title="Popular Items" eyebrow="Top sellers" icon={FiTrendingUp}>
          <div className="space-y-3">
            {popularItems.map((item, idx) => (
              <motion.div
                key={`${item.name}-${idx}`}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ x: 4 }}
                className="flex items-center justify-between gap-4 rounded-2xl border border-surface-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-sm font-black text-primary-700">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-gray-950">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.totalQuantity} sold</p>
                  </div>
                </div>
                <p className="font-black text-primary-700">{formatRestaurantCurrency(item.totalRevenue)}</p>
              </motion.div>
            ))}
            {popularItems.length === 0 && (
              <div className="rounded-2xl bg-surface-50 py-8 text-center text-sm text-gray-500">No item data available yet.</div>
            )}
          </div>
        </SectionShell>

        <SectionShell title="Recent Orders" eyebrow="Latest activity" icon={FiShoppingBag}>
          <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
            {stats?.recentOrders?.slice(0, 6).map((order) => (
              <motion.div
                key={order._id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ x: 4 }}
                className="flex items-center justify-between gap-4 rounded-2xl border border-surface-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="font-bold text-gray-950">#{order.orderNumber}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {getOrderCustomerLabel(order)} - Table {order.table?.tableNumber || "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary-700">{formatRestaurantCurrency(order.grandTotal)}</p>
                  <RestaurantStatusPill value={order.status} styles={orderStatusStyles} />
                </div>
              </motion.div>
            ))}
            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
              <div className="rounded-2xl bg-surface-50 py-8 text-center text-sm text-gray-500">No recent orders.</div>
            )}
          </div>
        </SectionShell>
      </div>

      {stats?.lowStockItemsList && stats.lowStockItemsList.length > 0 && (
        <SectionShell title="Low Stock Alert" eyebrow="Inventory attention" icon={FiAlertCircle}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.lowStockItemsList.map((item, idx) => (
              <motion.div
                key={`${item.name}-${idx}`}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-4 shadow-sm"
              >
                <p className="font-bold text-gray-950">{item.name}</p>
                <p className="mt-2 text-sm font-semibold text-red-700">
                  Only {item.currentStock} {item.unit} left
                </p>
                <p className="mt-1 text-xs text-gray-500">Minimum stock: {item.minStock}</p>
              </motion.div>
            ))}
          </div>
        </SectionShell>
      )}
    </div>
  );
};

export default Dashboard;
