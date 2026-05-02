import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock, CheckCircle2, ShoppingBag } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import Navigation from "../../components/customer/Navigation";

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
        const res = await api.get(`/customer/orders/${token}`);
        setOrders(res?.data?.data?.orders || []);
      } catch (err) {
        console.error("Failed to fetch customer orders", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  const isCurrentOrder = (status) =>
    ["pending", "confirmed", "preparing", "ready"].includes(status);

  const filteredOrders = useMemo(() => {
    if (activeTab === "Current") {
      return orders.filter((order) => isCurrentOrder(order.status));
    }
    return orders.filter((order) => !isCurrentOrder(order.status));
  }, [activeTab, orders]);

  const statusBadgeClass = (status) => {
    if (isCurrentOrder(status)) {
      return "bg-orange-50 text-orange-600";
    }
    if (status === "served") {
      return "bg-green-50 text-green-600";
    }
    return "bg-red-50 text-red-600";
  };

  const formatStatus = (status) =>
    status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending";

  const formatOrderDate = (value) => {
    if (!value) return "Just now";
    return new Date(value).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* List Header */}
      <header className="px-6 pt-12 pb-4 flex items-center gap-4">
        <button
          className="p-2 bg-gray-50 rounded-xl hover:bg-red-300 transition-colors"
          onClick={() => navigate(`/menu/${slug}/${token}`)}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-800">My Orders</h1>
      </header>

      {/* Tabs */}
      <div className="px-6 py-4 flex gap-2">
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
      <div className="px-6 mt-4 space-y-6">
        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-200 rounded-3xl">
            <ShoppingBag size={26} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-500">No {activeTab.toLowerCase()} orders</p>
            <p className="text-xs text-gray-400 mt-1">Your orders will appear here.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order._id} className="border border-gray-100 rounded-3xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    Order #{order.orderNumber}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Table {order?.table?.tableNumber || "--"} • {formatOrderDate(order.createdAt)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${statusBadgeClass(order.status)}`}
                >
                  {formatStatus(order.status)}
                </span>
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
                <span className="font-black text-orange-500">Rs. {order.grandTotal}</span>
              </div>

              {isCurrentOrder(order.status) && (
                <button
                  onClick={() => navigate(`/order/track/${order.qrToken}`)}
                  className="w-full mt-4 py-2.5 bg-gray-50 text-gray-700 rounded-xl text-xs font-bold hover:bg-orange-50 hover:text-orange-600 transition-all"
                >
                  Track Order
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default MyOrders;
