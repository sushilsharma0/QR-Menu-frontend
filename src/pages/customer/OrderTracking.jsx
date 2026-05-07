import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  ChefHat,
  Bell,
  PackageCheck,
  Utensils,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

const OrderTracking = () => {
  const { qrToken } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!qrToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await api.get(`/customer/order/${qrToken}`);
        setOrder(res?.data?.data || null);
      } catch (err) {
        console.error("Failed to fetch order tracking", err);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    const intervalId = setInterval(fetchOrder, 10000);
    return () => clearInterval(intervalId);
  }, [qrToken]);

  const statusOrder = ["pending", "confirmed", "preparing", "ready", "served"];
  const currentStatusIndex = statusOrder.indexOf(order?.status || "pending");

  const steps = useMemo(
    () => [
      {
        id: 1,
        status: "pending",
        label: "Order Placed",
        icon: <Clock size={16} />,
      },
      {
        id: 2,
        status: "confirmed",
        label: "Confirmed",
        icon: <Check size={16} />,
      },
      {
        id: 3,
        status: "preparing",
        label: "Preparing",
        icon: <ChefHat size={16} />,
      },
      {
        id: 4,
        status: "ready",
        label: "Ready",
        icon: <Utensils size={16} />,
      },
      {
        id: 5,
        status: "served",
        label: "Completed",
        icon: <PackageCheck size={16} />,
      },
    ].map((step, idx) => {
      const historyEntry = (order?.statusHistory || []).find(
        (entry) => entry.status === step.status
      );
      const isCompleted = idx <= currentStatusIndex;
      const isActive = idx === currentStatusIndex && order?.status !== "served";
      return {
        ...step,
        completed: isCompleted,
        active: isActive,
        time: historyEntry?.timestamp
          ? new Date(historyEntry.timestamp).toLocaleString()
          : isCompleted
            ? "Completed"
            : "Waiting...",
      };
    }),
    [currentStatusIndex, order]
  );

  const statusLabel = order?.status
    ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
    : "Pending";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">
        Loading tracking...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center dark:bg-gray-950">
        <p className="text-gray-700 dark:text-gray-300 font-semibold">Order not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-10 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between border-b border-gray-50 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-950 z-10">
        <button
          className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-200" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">
          Order Tracking
        </h1>
        <div className="w-10"></div> {/* Placeholder to center the title */}
      </header>

      <div className="p-8 flex flex-col items-center">
        {/* Order Info Card */}
        <div className="text-center mb-10">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
            Order #{order.orderNumber}
          </p>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Table {order.tableNumber}</h2>

          <div className="mt-4 inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-5 py-2 rounded-full text-xs font-bold border border-orange-100 animate-pulse">
            <ChefHat size={14} /> {statusLabel}
          </div>
        </div>

        {/* Timeline Container */}
        <div className="w-full max-w-xs relative ml-4">
          {/* Main Vertical Track */}
          <div className="absolute left-4.75 top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-gray-700"></div>

          <div className="space-y-12">
            {steps.map((step) => (
              <div key={step.id} className="relative flex items-start gap-6">
                {/* Step Circle */}
                <div
                  className={`z-10 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-all duration-500
                  ${
                    step.completed
                      ? "bg-green-500 text-white"
                      : step.active
                        ? "bg-orange-500 text-white scale-110 ring-4 ring-orange-100"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {step.completed ? (
                    <Check size={18} strokeWidth={3} />
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Step Text Content */}
                <div className="flex-1 pt-1">
                  <h4
                    className={`text-sm font-bold transition-colors ${step.active ? "text-gray-900 dark:text-gray-100" : step.completed ? "text-gray-800 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}`}
                  >
                    {step.label}
                  </h4>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">
                    {step.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Alert Box */}
        <div className="mt-16 w-full max-w-sm bg-orange-50 p-6 rounded-4xl flex items-center gap-5 border border-orange-100 shadow-sm shadow-orange-50">
          <div className="p-4 bg-white rounded-2xl shadow-sm text-orange-500">
            <Bell size={24} className="animate-bounce" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
              We will notify you
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
              Your order is being handled with care and will be ready shortly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
