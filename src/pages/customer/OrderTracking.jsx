import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  ChefHat,
  Clock,
  Flame,
  PackageCheck,
  Plus,
  Radio,
  ReceiptText,
  UtensilsCrossed,
  Utensils,
} from "lucide-react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import Feedback from "../../components/customer/homepage/Feedback";
import CustomerPostServePayment from "../../components/customer/CustomerPostServePayment";
import Navigation from "../../components/customer/Navigation";
import { getSocketOrigin } from "../../utils/runtimeConfig";
import { rememberCustomerPortal } from "../../utils/customerPortalContext";
import { getStoredGuestId, rememberCustomerOrderToken } from "../../services/customer";

const getActiveStepIndex = (status, paymentStatus) => {
  if (status === "cancelled") return -1;
  if (status === "completed") return 5;
  if (status === "served" && paymentStatus === "paid") return 5;
  if (status === "pending" || status === "confirmed") return 0;
  if (status === "preparing") return 1;
  if (status === "cooking") return 2;
  if (status === "ready") return 3;
  if (status === "served") return 4;
  return 0;
};

const getStatusText = (order) => {
  const status = order?.status
  const paymentStatus = order?.paymentStatus
  if (status === "cancelled") return "Order cancelled";
  if (status === "completed" || (status === "served" && paymentStatus === "paid")) return "Order completed — thank you!";
  if (status === "pending") return "Order received by the restaurant";
  if (status === "confirmed") return "Restaurant confirmed your order";
  if (status === "preparing") return "Kitchen is preparing your order";
  if (status === "cooking") return "Your food is cooking now";
  if (status === "ready") return "Your order is ready for pickup";
  if (status === "served" && paymentStatus !== "paid" && order?.guestPaymentPreferenceAt) {
    return "Served — your payment choice was sent to staff";
  }
  if (status === "served") return "Served at your table";
  return "Tracking your order";
};

const formatMoney = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const normalizeRealtimeOrder = (payload, current) => ({
  ...current,
  ...payload,
  orderId: payload?._id || payload?.orderId || current?.orderId,
  tableNumber: payload?.table?.tableNumber || payload?.tableNumber || current?.tableNumber,
  totalAmount: payload?.grandTotal || payload?.totalAmount || current?.totalAmount,
  orderTime: payload?.createdAt || payload?.orderTime || current?.orderTime,
  kitchenDelayMinutes: payload?.kitchenDelayMinutes ?? current?.kitchenDelayMinutes,
  kitchenDelayMessage: payload?.kitchenDelayMessage ?? current?.kitchenDelayMessage,
  kitchenDelayUpdatedAt: payload?.kitchenDelayUpdatedAt ?? current?.kitchenDelayUpdatedAt,
  estimatedWaitTime: payload?.estimatedWaitTime ?? current?.estimatedWaitTime,
  guestPaymentPreferenceAt: payload?.guestPaymentPreferenceAt ?? current?.guestPaymentPreferenceAt,
  guestPaymentPreferenceCash: payload?.guestPaymentPreferenceCash ?? current?.guestPaymentPreferenceCash,
  guestPaymentPreferenceOnline: payload?.guestPaymentPreferenceOnline ?? current?.guestPaymentPreferenceOnline,
  customerPaymentDeferred: payload?.customerPaymentDeferred ?? current?.customerPaymentDeferred,
});

const OrderTracking = () => {
  const { qrToken } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const fetchOrder = async () => {
    if (!qrToken) {
      setLoading(false);
      return null;
    }

    try {
      const res = await api.get(`/customer/order/${qrToken}`, { skipErrorToast: true });
      const nextOrder = res?.data?.data || null;
      setOrder(nextOrder);
      setLastUpdatedAt(new Date());
      return nextOrder;
    } catch (err) {
      console.error("Failed to fetch order tracking", err);
      setOrder(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const intervalId = setInterval(fetchOrder, 15000);
    return () => clearInterval(intervalId);
  }, [qrToken]);

  useEffect(() => {
    if (!order?.orderId) return undefined;

    const socket = io(getSocketOrigin(), {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      setIsLive(true);
      socket.emit("join:order", order.orderId);
    });

    socket.on("disconnect", () => setIsLive(false));

    socket.on("order_status", (payload) => {
      setOrder((current) => normalizeRealtimeOrder(payload, current));
      setLastUpdatedAt(new Date());
    });

    return () => {
      socket.disconnect();
      setIsLive(false);
    };
  }, [order?.orderId]);

  useEffect(() => {
    if (!order?.restaurantSlug || !order?.tableQrToken) return;
    rememberCustomerPortal(order.restaurantSlug, order.tableQrToken);
    rememberCustomerOrderToken(order.tableQrToken, qrToken);
  }, [order?.restaurantSlug, order?.tableQrToken, qrToken]);

  useEffect(() => {
    const paid = order?.paymentStatus === "paid";
    const done =
      order?.status === "completed" || (order?.status === "served" && paid);
    if (!qrToken || !paid || !done || !order?.orderId) return;
    const storageKey = `feedback_prompt_order_${order.orderId}`;
    if (localStorage.getItem(storageKey)) return;
    const timer = setTimeout(() => {
      setShowFeedback(true);
      localStorage.setItem(storageKey, "true");
    }, 900);
    return () => clearTimeout(timer);
  }, [order?.paymentStatus, order?.status, order?.orderId, qrToken]);

  const currentStatusIndex = getActiveStepIndex(order?.status, order?.paymentStatus);
  const progressPct =
    currentStatusIndex < 0 ? 0 : Math.min(100, Math.round(((currentStatusIndex + 1) / 6) * 100));
  const canShowBill = order?.status === "served" || order?.status === "completed";
  const canAddMoreItems = Boolean(
    order?.tableQrToken &&
      (order?.restaurantSlug || order?.restaurant?.slug) &&
      !["served", "completed", "cancelled"].includes(order?.status),
  );
  const guestIdForPay = order?.guestId || getStoredGuestId();
  const showPostServePay =
    order?.status === "served" &&
    order?.customerPaymentDeferred &&
    order?.paymentStatus !== "paid";
  const subtotal = Number(
    order?.subtotal ??
      order?.totalAmount ??
      (order?.items || []).reduce((sum, item) => sum + Number(item.subtotal || Number(item.price || 0) * Number(item.quantity || 0)), 0)
  );
  const taxAmount = Number(order?.taxAmount || 0);
  const discountAmount = Number(order?.discountAmount || 0);
  const serviceChargeAmount = Number(order?.serviceChargeAmount || 0);
  const grandTotal = Number(order?.grandTotal ?? order?.totalAmount ?? Math.max(0, subtotal + taxAmount + serviceChargeAmount - discountAmount));
  const estimatedPrepLabel = order?.estimatedCompletionTime
    ? `Ready around ${new Date(order.estimatedCompletionTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : order?.estimatedWaitTime
      ? `About ${order.estimatedWaitTime} min`
      : "Waiting for restaurant estimate";

  const steps = useMemo(() => {
    const defs = [
      { stepIndex: 0, statuses: ["pending", "confirmed"], label: "Order received", icon: Radio },
      { stepIndex: 1, statuses: ["preparing"], label: "Preparing", icon: ChefHat },
      { stepIndex: 2, statuses: ["cooking"], label: "Cooking", icon: Flame },
      { stepIndex: 3, statuses: ["ready"], label: "Ready", icon: Utensils },
      { stepIndex: 4, statuses: ["served"], label: "Served", icon: PackageCheck },
      {
        stepIndex: 5,
        statuses: ["completed"],
        label: "Completed",
        icon: Check,
        paymentComplete: true,
      },
    ];

    return defs.map((step, idx) => {
      const historyEntry = (order?.statusHistory || []).find((entry) =>
        step.statuses.includes(entry.status),
      );
      const isCancelled = order?.status === "cancelled";
      const isCompleted =
        !isCancelled &&
        currentStatusIndex >= 0 &&
        (idx < currentStatusIndex || (currentStatusIndex === 5 && idx === 5));
      const isActive =
        !isCancelled && idx === currentStatusIndex && currentStatusIndex < 5;

      let time = "Waiting";
      if (historyEntry?.timestamp) {
        time = new Date(historyEntry.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (idx === 5 && order?.paymentStatus === "paid") {
        time = "Paid";
      } else if (isCompleted) {
        time = "Done";
      }

      return {
        ...step,
        completed: isCompleted,
        active: isActive,
        time,
      };
    });
  }, [currentStatusIndex, order]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf7] text-gray-500">
        Loading live tracking...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf7] px-6 text-center">
        <p className="text-gray-700 font-semibold">Order not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 rounded-xl bg-slate-950 text-white text-sm font-semibold">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-28 text-gray-950">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-5 pb-5 pt-12 backdrop-blur">
        <button className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black tracking-tight">Live Order Track</h1>
          <p className="text-[11px] font-semibold text-gray-400">Updates as kitchen moves</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isLive ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"}`}>
          <Radio size={18} className={isLive ? "animate-pulse" : ""} />
        </div>
      </header>

      <main className="px-5 pt-5">
        <section className="overflow-hidden rounded-[2rem] bg-primary-900 text-white shadow-xl shadow-primary-900/15">
          <div className="p-6">
            <div className="flex items-center gap-3">
              {order.restaurant?.logo ? (
                <img src={order.restaurant.logo} alt={order.restaurant.name} className="h-14 w-14 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                  <ReceiptText size={24} />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{order.restaurant?.name || "Restaurant"}</p>
                <p className="text-xs font-semibold text-slate-300">Table {order.tableNumber} • Order #{order.orderNumber}</p>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-surface-100">Current Status</p>
              <h2 className="mt-2 text-3xl font-black leading-tight">
                {getStatusText(order)}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {order.estimatedCompletionTime
                  ? `Estimated ready around ${new Date(order.estimatedCompletionTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
                  : order.estimatedWaitTime
                    ? `Typical prep window: about ${order.estimatedWaitTime} minutes after confirmation.`
                    : "The restaurant updates each stage live — stay on this screen for Socket.IO updates."}
              </p>
              {order.kitchenDelayMessage ? (
                <div className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-500/15 px-4 py-3 text-sm font-semibold text-amber-100">
                  {order.kitchenDelayMessage}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/10 p-4">
              <span className="text-xs font-bold text-slate-300">Total</span>
              <span className="text-2xl font-black">{formatMoney(grandTotal)}</span>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-1 gap-3">
          <div className="rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <Clock size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-gray-400">Estimated preparation</p>
                <p className="text-sm font-black text-gray-900">{estimatedPrepLabel}</p>
              </div>
            </div>
          </div>
          {canAddMoreItems && (
            <button
              type="button"
              onClick={() => navigate(`/menu/${order.restaurantSlug || order.restaurant?.slug}/${order.tableQrToken}`)}
              className="flex items-center justify-center gap-2 rounded-[1.5rem] bg-primary-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-primary-600/20 transition hover:bg-primary-700"
            >
              <Plus size={18} />
              Add More Items
              <UtensilsCrossed size={18} />
            </button>
          )}
        </section>

        <section className="mt-5 rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black">Kitchen Progress</h3>
              <p className="text-xs font-semibold text-gray-400">
                {lastUpdatedAt ? `Last update ${lastUpdatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Waiting for update"}
              </p>
            </div>
              <span className={`rounded-full px-3 py-1 text-[11px] font-black ${isLive ? "bg-primary-50 text-primary-700" : "bg-amber-50 text-amber-700"}`}>
              {isLive ? "Live" : "Polling"}
            </span>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-[11px] font-bold text-gray-500">
              <span>Progress</span>
              <span>{progressPct}%</span>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-4 rounded-2xl border p-4 ${
                    step.active
                      ? "border-orange-200 bg-orange-50"
                      : step.completed
                        ? "border-primary-100 bg-primary-50/60"
                        : "border-gray-100 bg-gray-50"
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                      step.completed ? "bg-primary-600 text-white" : step.active ? "bg-secondary-500 text-white" : "bg-white text-gray-400"
                    }`}
                  >
                    {step.completed ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-black ${step.completed || step.active ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                    <p className="text-xs font-semibold text-gray-400">{step.time}</p>
                  </div>
                  {step.active && (
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-ping" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-orange-100 bg-orange-50 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm">
              <Bell size={22} className="animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">No need to ask again</p>
              <p className="text-xs leading-5 text-gray-500">Keep this screen open. It updates when the restaurant confirms, prepares, and serves your order.</p>
            </div>
          </div>
        </section>

        {showPostServePay && (
          <CustomerPostServePayment
            restaurantSlug={order?.restaurant?.slug}
            tableQrToken={order?.tableQrToken}
            trackToken={qrToken}
            guestId={guestIdForPay}
            grandTotal={grandTotal}
            customerEmail={order?.customerEmail}
            guestPaymentPreferenceAt={order?.guestPaymentPreferenceAt}
            paymentMethod={order?.paymentMethod}
            guestPaymentPreferenceCash={order?.guestPaymentPreferenceCash}
            guestPaymentPreferenceOnline={order?.guestPaymentPreferenceOnline}
            onSuccess={fetchOrder}
          />
        )}

        {canShowBill && (
          <section className="mt-5 overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
            <div className="bg-gray-950 px-5 py-5 text-white">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Customer Bill</p>
                  <h3 className="mt-1 text-xl font-black">Order #{order.orderNumber}</h3>
                </div>
                <ReceiptText size={28} className="text-surface-100" />
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-300">
                {order.restaurant?.name || "Restaurant"} • Table {order.tableNumber || "N/A"}
              </p>
            </div>

            <div className="p-5">
              <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="font-bold uppercase text-gray-400">Status</p>
                  <p className="mt-1 font-black capitalize text-green-600">{order.status}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="font-bold uppercase text-gray-400">Payment</p>
                  <p className="mt-1 font-black capitalize text-gray-900">{order.paymentStatus || "pending"}</p>
                  {order.paymentStatus !== "paid" && order.guestPaymentPreferenceAt ? (
                    <p className="mt-1 text-[10px] font-semibold leading-relaxed text-gray-500">
                      You chose{" "}
                      <span className="font-bold text-gray-800">
                        {order.paymentMethod === "mixed"
                          ? `split (cash ${formatMoney(order.guestPaymentPreferenceCash)} + online ${formatMoney(order.guestPaymentPreferenceOnline)})`
                          : order.paymentMethod || "—"}
                      </span>
                      . Staff will mark paid when they collect.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-100">
                {(order.items || []).map((item, index) => {
                  const lineTotal = Number(item.subtotal || Number(item.price || 0) * Number(item.quantity || 0));
                  return (
                    <div key={`${item.name}-${index}`} className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0">
                      <div>
                        <p className="text-sm font-black text-gray-900">{item.name}</p>
                        <p className="mt-1 text-xs font-semibold text-gray-400">
                          {item.quantity} x {formatMoney(item.price)}
                        </p>
                        {item.specialInstructions ? (
                          <p className="mt-1 text-[11px] text-gray-500">{item.specialInstructions}</p>
                        ) : null}
                      </div>
                      <p className="text-sm font-black text-gray-900">{formatMoney(lineTotal)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 space-y-2 rounded-2xl bg-gray-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">Subtotal</span>
                  <span className="font-bold text-gray-900">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">Tax</span>
                  <span className="font-bold text-gray-900">{formatMoney(taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">Service charge</span>
                  <span className="font-bold text-gray-900">{formatMoney(serviceChargeAmount)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-500">Discount</span>
                    <span className="font-bold text-green-600">- {formatMoney(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-3 text-base">
                  <span className="font-black text-gray-900">Grand Total</span>
                  <span className="font-black text-orange-500">{formatMoney(grandTotal)}</span>
                </div>
              </div>

              <p className="mt-4 text-center text-xs font-semibold text-gray-400">
                Thank you for dining with us.
              </p>
            </div>
          </section>
        )}
      </main>
      <Feedback
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        qrToken={qrToken}
        onSubmitted={() => {
          if (order?.restaurantSlug && order?.tableQrToken) {
            navigate(`/home/${order.restaurantSlug}/${order.tableQrToken}`);
          }
        }}
      />
      <Navigation restaurantSlug={order?.restaurantSlug} tableQrToken={order?.tableQrToken} />
    </div>
  );
};

export default OrderTracking;
