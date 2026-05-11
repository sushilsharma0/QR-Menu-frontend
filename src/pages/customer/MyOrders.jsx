import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock, CheckCircle2, ShoppingBag, Radio, ChefHat } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import Navigation from "../../components/customer/Navigation";
import { ensureGuestSession, getGuestOrders } from "../../services/customer";
import { rememberCustomerPortal } from "../../utils/customerPortalContext";

const MyOrders = () => {
  const { slug, token } = useParams();
  const [activeTab, setActiveTab] = useState("Current");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const session = await ensureGuestSession(token);
        const guestOrders = await getGuestOrders({ guestId: session.guestId, qrToken: token });
        setOrders(guestOrders);
      } catch (err) {
        console.error("Failed to fetch customer orders", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const intervalId = setInterval(fetchOrders, 12000);
    return () => clearInterval(intervalId);
  }, [token]);

  useEffect(() => {
    if (slug && token) rememberCustomerPortal(slug, token);
  }, [slug, token]);

  const isCurrentOrder = (status) =>
    ["pending", "confirmed", "preparing", "cooking", "ready"].includes(status);

  const filteredOrders = useMemo(() => {
    if (activeTab === "Current") {
      return orders.filter((order) => isCurrentOrder(order.status));
    }
    return orders.filter((order) => !isCurrentOrder(order.status));
  }, [activeTab, orders]);

  const statusBadgeClass = (status) => {
    if (isCurrentOrder(status)) {
      return "bg-primary-50 text-primary-700";
    }
    if (status === "served" || status === "completed") {
      return "bg-emerald-50 text-emerald-700";
    }
    if (status === "cancelled") {
      return "bg-red-50 text-red-600";
    }
    return "bg-surface-100 text-accent-800";
  };

  const paymentBadgeClass = (paymentStatus) => {
    if (paymentStatus === "paid") return "bg-emerald-50 text-emerald-700";
    if (paymentStatus === "failed") return "bg-red-50 text-red-600";
    return "bg-amber-50 text-amber-800";
  };

  const formatStatus = (status) =>
    status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending";

  const formatOrderDate = (value) => {
    if (!value) return "Just now";
    return new Date(value).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-28 text-gray-950">
      {/* List Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-5 pb-5 pt-12 backdrop-blur">
        <button
          className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          onClick={() => navigate(`/menu/${slug}/${token}`)}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black text-gray-900">My Orders</h1>
          <p className="text-[11px] font-semibold text-gray-400">Live kitchen progress</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Radio size={18} className="animate-pulse" />
        </div>
      </header>

      <section className="px-5 pt-5">
        <div className="rounded-[2rem] bg-primary-900 p-5 text-white shadow-xl shadow-primary-900/10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 text-primary-800">
              <ChefHat size={24} />
            </div>
            <div>
              <p className="text-sm font-black">Track without asking</p>
              <p className="text-xs font-semibold text-slate-300">When restaurant updates status, your order card refreshes automatically.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="px-5 py-4 flex gap-2">
        {["Current", "Past"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab
                ? "bg-orange-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Order Cards */}
      <div className="px-5 mt-2 space-y-4">
        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-200 rounded-3xl">
            <ShoppingBag size={26} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-500">No {activeTab.toLowerCase()} orders</p>
            <p className="text-xs text-gray-400 mt-1">Your orders will appear here.</p>
          </div>
        ) : (
          filteredOrders.map((order, index) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="border border-gray-100 bg-white rounded-3xl p-5 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    Order #{order.orderNumber}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Table {order?.table?.tableNumber || "--"} • {formatOrderDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-lg px-3 py-1 text-[10px] font-bold uppercase ${statusBadgeClass(order.status)}`}
                  >
                    {formatStatus(order.status)}
                  </span>
                  {order.paymentStatus && (
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase ${paymentBadgeClass(order.paymentStatus)}`}
                    >
                      {order.paymentStatus}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 border-b border-gray-50 pb-4 mb-4">
                {(order.items || []).map((item, idx) => (
                  <p key={`${order._id}-${idx}`} className="text-xs text-gray-600">
                    {item.name} x{item.quantity}
                    <span className="float-right font-bold text-gray-800">
                      Rs. {item.subtotal}
                    </span>
                  </p>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Total</span>
                <span className="font-black text-primary-600">Rs. {order.grandTotal}</span>
              </div>

              {isCurrentOrder(order.status) && order.qrToken && (
                <button
                  type="button"
                  onClick={() => navigate(`/order/track/${order.qrToken}`)}
                  className="mt-4 w-full rounded-2xl bg-primary-600 py-3 text-xs font-black text-white transition-all hover:bg-primary-700"
                >
                  Open live tracking
                </button>
              )}
              {(order.status === "served" || order.status === "completed") && order.qrToken && (
                <button
                  type="button"
                  onClick={() => navigate(`/order/bill/${order.qrToken}`)}
                  className="mt-3 w-full rounded-2xl bg-gray-950 py-3 text-xs font-black text-white transition-all hover:bg-gray-800"
                >
                  View bill
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default MyOrders;
