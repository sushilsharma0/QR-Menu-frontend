import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Sparkles,
  CircleDot,
  Edit3,
  X,
  Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import Feedback from "../../components/customer/homepage/Feedback";
import CustomerPostServePayment from "../../components/customer/CustomerPostServePayment";
import Navigation from "../../components/customer/Navigation";
import OrderTrackingFab from "../../components/customer/order/OrderTrackingFab";
import { OrderTrackingSkeleton } from "../../components/customer/order/OrderTrackingSkeleton";
import { getSocketOrigin } from "../../utils/runtimeConfig";
import { rememberCustomerPortal } from "../../utils/customerPortalContext";
import { getStoredGuestId, rememberCustomerOrderToken } from "../../services/customer";
import toast from "../../utils/toast";

const formatMoney = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

/** 5-step customer-facing flow (maps backend statuses). */
const TRACK_STEPS = [
  {
    key: "placed",
    label: "Order placed",
    caption: "We received your order",
    statuses: ["pending"],
    Icon: Sparkles,
  },
  {
    key: "accepted",
    label: "Restaurant accepted",
    caption: "Kitchen queue updated",
    statuses: ["confirmed"],
    Icon: Check,
  },
  {
    key: "preparing",
    label: "Preparing food",
    caption: "Chef team is on it",
    statuses: ["preparing", "cooking"],
    Icon: ChefHat,
  },
  {
    key: "ready",
    label: "Ready to serve",
    caption: "Head to the counter or wait at table",
    statuses: ["ready"],
    Icon: Utensils,
  },
  {
    key: "done",
    label: "Served / completed",
    caption: "Enjoy, pay when you are ready",
    statuses: ["served", "completed"],
    Icon: PackageCheck,
  },
];

const getTrackStepIndex = (status) => {
  if (status === "cancelled") return -1;
  if (status === "pending") return 0;
  if (status === "confirmed") return 1;
  if (status === "preparing" || status === "cooking") return 2;
  if (status === "ready") return 3;
  if (status === "served" || status === "completed") return 4;
  return 0;
};

const getStatusHeadline = (order) => {
  const status = order?.status;
  const paymentStatus = order?.paymentStatus;
  if (status === "cancelled") return "Order cancelled";
  if (status === "completed" || (status === "served" && paymentStatus === "paid"))
    return "Thank you, all set!";
  if (status === "pending") return "Order received";
  if (status === "confirmed") return "Restaurant accepted";
  if (status === "preparing" || status === "cooking") return "Preparing your food";
  if (status === "ready") return "Ready for you";
  if (status === "served" && paymentStatus !== "paid" && order?.guestPaymentPreferenceAt)
    return "Served, payment choice sent";
  if (status === "served") return "Served at your table";
  return "Live order tracking";
};

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
  canEdit: payload?.canEdit ?? current?.canEdit,
  editDeadline: payload?.editDeadline ?? current?.editDeadline,
  editSecondsRemaining: payload?.editSecondsRemaining ?? current?.editSecondsRemaining,
});

const OrderTracking = () => {
  const { qrToken } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showEditOrder, setShowEditOrder] = useState(false);
  const [editSecondsRemaining, setEditSecondsRemaining] = useState(0);
  const timelineRef = useRef(null);

  const fetchOrder = useCallback(async () => {
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
  }, [qrToken]);

  useEffect(() => {
    fetchOrder();
    const intervalId = setInterval(fetchOrder, 15000);
    return () => clearInterval(intervalId);
  }, [fetchOrder]);

  useEffect(() => {
    if (!order?.orderId) return undefined;

    const socket = io(getSocketOrigin(), {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    const handleConnect = () => {
      setIsLive(true);
      socket.emit("join:order", { orderId: order.orderId, orderToken: qrToken });
    };
    const handleDisconnect = () => setIsLive(false);
    const handleOrderStatus = (payload) => {
      setOrder((current) => normalizeRealtimeOrder(payload, current));
      setLastUpdatedAt(new Date());
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("order_status", handleOrderStatus);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("order_status", handleOrderStatus);
      socket.disconnect();
      setIsLive(false);
    };
  }, [order?.orderId, qrToken]);

  useEffect(() => {
    if (!order?.restaurantSlug || !order?.tableQrToken) return;
    rememberCustomerPortal(order.restaurantSlug, order.tableQrToken);
    rememberCustomerOrderToken(order.tableQrToken, qrToken);
  }, [order?.restaurantSlug, order?.tableQrToken, qrToken]);

  useEffect(() => {
    if (!order?.editDeadline) {
      setEditSecondsRemaining(Number(order?.editSecondsRemaining || 0));
      return undefined;
    }

    const tick = () => {
      const deadline = new Date(order.editDeadline).getTime();
      setEditSecondsRemaining(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [order?.editDeadline, order?.editSecondsRemaining]);

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

  const stepIndex = getTrackStepIndex(order?.status);
  const progressPct =
    stepIndex < 0 ? 0 : Math.min(100, Math.round(((stepIndex + 1) / TRACK_STEPS.length) * 100));

  const canShowBill = order?.status === "served" || order?.status === "completed";
  const canAddMoreItems = Boolean(
    order?.tableQrToken &&
      (order?.restaurantSlug || order?.restaurant?.slug) &&
      !["served", "completed", "cancelled"].includes(order?.status),
  );
  const canEditOrder = Boolean(order?.canEdit && editSecondsRemaining > 0);
  const guestIdForPay = order?.guestId || getStoredGuestId();
  const showPostServePay =
    ["served", "completed"].includes(order?.status) &&
    order?.customerPaymentDeferred &&
    order?.paymentStatus !== "paid";

  const subtotal = Number(
    order?.subtotal ??
      order?.totalAmount ??
      (order?.items || []).reduce(
        (sum, item) =>
          sum + Number(item.subtotal || Number(item.price || 0) * Number(item.quantity || 0)),
        0,
      ),
  );
  const taxAmount = Number(order?.taxAmount || 0);
  const discountAmount = Number(order?.discountAmount || 0);
  const serviceChargeAmount = Number(order?.serviceChargeAmount || 0);
  const grandTotal = Number(
    order?.grandTotal ??
      order?.totalAmount ??
      Math.max(0, subtotal + taxAmount + serviceChargeAmount - discountAmount),
  );

  const estimatedPrepLabel = order?.estimatedCompletionTime
    ? `Ready around ${new Date(order.estimatedCompletionTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : order?.estimatedWaitTime
      ? `About ${order.estimatedWaitTime} min`
      : "Estimate will appear when the kitchen confirms";

  const menuHref =
    canAddMoreItems &&
    `/menu/${order.restaurantSlug || order.restaurant?.slug}/${order.tableQrToken}`;

  const timelineSteps = useMemo(() => {
    if (!order) return [];
    const cancelled = order.status === "cancelled";
    const current = stepIndex;
    const terminalDone =
      order.status === "completed" ||
      (order.status === "served" && order.paymentStatus === "paid");

    return TRACK_STEPS.map((def, idx) => {
      const historyEntry = (order.statusHistory || []).find((entry) =>
        def.statuses.includes(entry.status),
      );
      const completed =
        !cancelled &&
        current >= 0 &&
        (idx < current || (idx === current && terminalDone && idx === TRACK_STEPS.length - 1));
      const active = !cancelled && idx === current && !completed;

      let timeLabel = "Waiting";
      if (historyEntry?.timestamp) {
        timeLabel = new Date(historyEntry.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (completed) {
        timeLabel = "Done";
      } else if (terminalDone && idx === TRACK_STEPS.length - 1) {
        timeLabel = "Paid";
      }

      return { ...def, completed, active, timeLabel, idx };
    });
  }, [order, stepIndex]);

  const scrollToTimeline = () => {
    timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleOrderEdited = (updatedOrder) => {
    setOrder((current) => normalizeRealtimeOrder(updatedOrder, current));
    setLastUpdatedAt(new Date());
    setShowEditOrder(false);
    toast.success("Order updated. Kitchen has been notified.");
    fetchOrder();
  };

  if (loading) {
    return <OrderTrackingSkeleton />;
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50/80 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-100 text-gray-400">
          <ReceiptText size={36} />
        </div>
        <p className="mt-4 text-base font-black text-gray-900">Order not found</p>
        <p className="mt-1 max-w-xs text-sm text-gray-500">
          This link may have expired or the order was removed.
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-6 rounded-2xl bg-primary-600 px-6 py-3 text-sm font-black text-white shadow-lg transition active:scale-95"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 via-white to-surface-50/90 pb-44 text-gray-950">
      {/* Sticky tracking header */}
      <div className="sticky top-0 z-40 bg-white shadow-[0_8px_24px_-22px_rgba(15,23,42,0.45)]">
      <header className="border-b border-gray-100 bg-white px-4 pb-3 pt-12">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-800 transition hover:bg-gray-200"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate text-sm font-semibold tracking-tight text-gray-900">
              Track order
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              #{order.orderNumber} · Table {order.tableNumber || "—"}
            </p>
          </div>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              isLive
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
            title={isLive ? "Live updates" : "Polling"}
          >
            <Radio size={18} className={isLive ? "animate-pulse" : ""} />
          </div>
        </div>
      </header>

      <div className="border-b border-gray-100/80 bg-white/95 px-4 py-3 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <motion.div
            layout
            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-900 text-white shadow-md"
          >
            {order.restaurant?.logo ? (
              <img
                src={order.restaurant.logo}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <ReceiptText size={20} />
            )}
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-black text-gray-900">
              {order.restaurant?.name || "Restaurant"}
            </p>
            <p className="truncate text-[11px] font-semibold text-primary-700">
              {getStatusHeadline(order)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase text-gray-400">Total</p>
            <p className="text-sm font-black text-gray-900">{formatMoney(grandTotal)}</p>
          </div>
        </div>
        <div className="mx-auto mt-3 max-w-lg">
          <div className="mb-1 flex justify-between text-[10px] font-bold text-gray-500">
            <span>Progress</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary-600 via-secondary-500 to-accent-500"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
          {lastUpdatedAt && (
            <p className="mt-1.5 text-center text-[10px] font-semibold text-gray-400">
              Updated {lastUpdatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      </div>
      </div>

      <main className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        {/* Hero card */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-700 p-6 text-white shadow-2xl shadow-primary-900/25"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/60">
                Current status
              </p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight">
                {getStatusHeadline(order)}
              </h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-white/85">
                {order.estimatedCompletionTime
                  ? `Estimated ready around ${new Date(order.estimatedCompletionTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
                  : order.estimatedWaitTime
                    ? `Typical prep window: about ${order.estimatedWaitTime} minutes.`
                    : "Stay on this screen, we update every stage in real time."}
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Flame size={26} className="text-attention-200" />
            </div>
          </div>
          {order.kitchenDelayMessage ? (
            <div className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-500/20 px-4 py-3 text-sm font-semibold text-amber-50">
              {order.kitchenDelayMessage}
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold backdrop-blur">
              <CircleDot size={12} className="text-emerald-300" />
              {order.paymentStatus === "paid" ? "Paid" : "Pay after meal"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold capitalize backdrop-blur">
              {order.status?.replace(/_/g, " ") || "—"}
            </span>
          </div>
        </motion.section>

        {/* ETA */}
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
              <Clock size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Estimated preparation
              </p>
              <p className="text-sm font-black text-gray-900">{estimatedPrepLabel}</p>
            </div>
          </div>
        </section>

        {canAddMoreItems && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              navigate(
                `/menu/${order.restaurantSlug || order.restaurant?.slug}/${order.tableQrToken}`,
              )
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 py-4 text-sm font-black text-white shadow-lg shadow-primary-900/25"
          >
            <Plus size={18} />
            Add more items
            <UtensilsCrossed size={18} />
          </motion.button>
        )}

        {canEditOrder && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm">
                <Edit3 size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-amber-950">Check your items now</p>
                <p className="mt-1 text-xs font-bold leading-relaxed text-amber-800">
                  Mistake in the order? You can update quantities for the next {Math.floor(editSecondsRemaining / 60)}:{String(editSecondsRemaining % 60).padStart(2, "0")} before preparation starts.
                </p>
                <button
                  type="button"
                  onClick={() => setShowEditOrder(true)}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2 text-xs font-black text-white shadow-sm transition active:scale-95"
                >
                  <Edit3 size={14} />
                  Edit order
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Timeline */}
        <section
          ref={timelineRef}
          className="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Order timeline</h3>
              <p className="text-xs font-semibold text-gray-400">
                {isLive ? "Connected, live" : "Reconnecting…"}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                isLive ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
              }`}
            >
              {isLive ? "Live" : "Polling"}
            </span>
          </div>

          <ol className="relative space-y-0">
            {timelineSteps.map((row, i) => {
              const Icon = row.Icon;
              const isLast = i === timelineSteps.length - 1;
              return (
                <li key={row.key} className="relative flex gap-4 pb-8 last:pb-0">
                  {!isLast && (
                    <span
                      className="absolute left-[22px] top-12 h-[calc(100%-0.5rem)] w-0.5 rounded-full bg-gray-100"
                      aria-hidden
                    />
                  )}
                  <div className="relative z-10 flex shrink-0 flex-col items-center">
                    <motion.div
                      layout
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl border-2 shadow-sm ${
                        row.completed
                          ? "border-primary-600 bg-primary-600 text-white"
                          : row.active
                            ? "border-secondary-500 bg-secondary-500 text-white ring-4 ring-secondary-500/25"
                            : "border-gray-200 bg-gray-50 text-gray-400"
                      }`}
                    >
                      {row.completed ? (
                        <Check size={18} strokeWidth={3} />
                      ) : (
                        <Icon size={18} />
                      )}
                    </motion.div>
                    {row.active && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary-400 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-secondary-500" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p
                      className={`text-sm font-black ${
                        row.active || row.completed ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {row.label}
                    </p>
                    <p className="text-xs font-semibold text-gray-500">{row.caption}</p>
                    <p className="mt-1 text-[11px] font-bold text-gray-400">{row.timeLabel}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Order items */}
        <section className="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Your order</h3>
          <p className="text-xs font-semibold text-gray-400">
            {order.items?.length || 0} line{(order.items?.length || 0) !== 1 ? "s" : ""}
          </p>
          <ul className="mt-4 divide-y divide-gray-100">
            {(order.items || []).map((item, index) => {
              const lineTotal = Number(
                item.subtotal || Number(item.price || 0) * Number(item.quantity || 0),
              );
              return (
                <motion.li
                  key={item._id || item.id || item.itemId || `${item.name}-${item.quantity}-${lineTotal}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="flex items-start justify-between gap-3 py-3 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="font-black text-gray-900">{item.name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-gray-500">
                      {item.quantity} × {formatMoney(item.price)}
                    </p>
                    {item.specialInstructions ? (
                      <p className="mt-1 text-[11px] text-gray-500">{item.specialInstructions}</p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-sm font-black text-gray-900">
                    {formatMoney(lineTotal)}
                  </p>
                </motion.li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-primary-100 bg-primary-50/50 p-4">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm">
              <Bell size={20} className="transition-transform duration-500 ease-out" />
            </div>
            <p className="text-xs font-semibold leading-relaxed text-primary-900">
              No need to flag down staff for status, this screen refreshes when the kitchen
              moves your order forward.
            </p>
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
          <section className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-lg">
            <div className="bg-gradient-to-r from-gray-950 to-gray-900 p-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Bill preview
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">Order #{order.orderNumber}</h3>
                </div>
                <ReceiptText size={26} className="text-surface-100" />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {order.restaurant?.name} · Table {order.tableNumber || "—"}
              </p>
            </div>
            <div className="space-y-2 p-5 text-sm">
              <div className="flex justify-between font-semibold text-gray-500">
                <span>Subtotal</span>
                <span className="font-black text-gray-900">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-500">
                <span>Tax</span>
                <span className="font-black text-gray-900">{formatMoney(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-500">
                <span>Service</span>
                <span className="font-black text-gray-900">{formatMoney(serviceChargeAmount)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>Discount</span>
                  <span className="font-black">− {formatMoney(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-3 text-base">
                <span className="font-black text-gray-900">Grand total</span>
                <span className="font-black text-primary-700">{formatMoney(grandTotal)}</span>
              </div>
            </div>
            <div className="border-t border-gray-100 px-5 pb-5">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/order/bill/${qrToken}`)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 text-sm font-black text-gray-900 transition hover:bg-gray-100"
              >
                Open full receipt
              </motion.button>
            </div>
          </section>
        )}
      </main>

      <OrderTrackingFab
        qrToken={qrToken}
        showBill={canShowBill}
        menuHref={menuHref || undefined}
        onScrollToTimeline={scrollToTimeline}
      />

      <Feedback
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        qrToken={qrToken}
        onSubmitted={() => {
          if (order?.restaurantSlug && order?.tableQrToken) {
            navigate(`/menu/${order.restaurantSlug}/${order.tableQrToken}`);
          }
        }}
      />
      <EditOrderModal
        open={showEditOrder}
        order={order}
        guestId={guestIdForPay}
        editSecondsRemaining={editSecondsRemaining}
        onClose={() => setShowEditOrder(false)}
        onSaved={handleOrderEdited}
      />
      <Navigation
        restaurantSlug={order?.restaurantSlug}
        tableQrToken={order?.tableQrToken}
        hidden={showFeedback}
      />
    </div>
  );
};

function EditOrderModal({ open, order, guestId, editSecondsRemaining, onClose, onSaved }) {
  const [draftItems, setDraftItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraftItems(
      (order?.items || []).map((item, index) => ({
        itemId: item._id || item.menuItem || `${item.name}-${index}`,
        menuItemId: item.menuItem?._id || item.menuItem || "",
        name: item.name || "Item",
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
      })),
    );
  }, [open, order?.items]);

  useEffect(() => {
    if (!open || !order?.restaurantSlug || !order?.tableQrToken) return undefined;
    let cancelled = false;
    (async () => {
      try {
        setLoadingMenu(true);
        if (cancelled) return;
        const res = await api.get(`/restaurant/menu/public/${order.restaurantSlug}`, {
          params: { qrToken: order.tableQrToken },
          skipErrorToast: true,
        });
        if (cancelled) return;
        const flatItems = (res?.data?.data?.menu || []).reduce((items, category) => {
          for (const item of category.items || []) {
            if (item?._id && item?.name) items.push(item);
          }
          return items;
        }, []);
        setMenuItems(flatItems);
      } catch (err) {
        console.error("Failed to load menu for edit", err);
        setMenuItems([]);
      } finally {
        if (!cancelled) setLoadingMenu(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, order?.restaurantSlug, order?.tableQrToken]);

  if (!open) return null;

  const setQuantity = (itemId, quantity) => {
    setDraftItems((current) =>
      current.map((item) =>
        item.itemId === itemId ? { ...item, quantity: Math.max(0, Math.min(99, quantity)) } : item,
      ),
    );
  };

  const replaceMenuItem = (itemId, menuItemId) => {
    const selected = menuItems.find((item) => String(item._id) === String(menuItemId));
    if (!selected) return;
    setDraftItems((current) =>
      current.map((item) =>
        item.itemId === itemId
          ? {
              ...item,
              menuItemId: selected._id,
              name: selected.name,
              price: Number(selected.price || 0),
            }
          : item,
      ),
    );
  };

  const activeItems = draftItems.filter((item) => Number(item.quantity || 0) > 0);
  const total = activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const save = async () => {
    if (!activeItems.length) {
      toast.error("Keep at least one item, or ask staff to cancel the order.");
      return;
    }
    try {
      setSaving(true);
      const res = await api.patch(`/customer/order/${order.qrToken}/items`, {
        guestId,
        items: draftItems.map((item) => ({
          itemId: item.itemId,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      });
      onSaved(res?.data?.data || {});
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not update order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-end bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      >
        <motion.div
          initial={{ y: 32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 32, opacity: 0 }}
          className="max-h-[88vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-w-lg sm:rounded-[2rem]"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <p className="text-base font-black text-gray-950">Edit order</p>
              <p className="text-xs font-bold text-amber-700">
                Time left {Math.floor(editSecondsRemaining / 60)}:{String(editSecondsRemaining % 60).padStart(2, "0")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[56vh] overflow-y-auto px-5 py-4">
            <p className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-relaxed text-amber-900">
              Please check all order items correctly before the kitchen starts preparing. You can change a mistaken item to another available menu item.
            </p>
            <ul className="divide-y divide-gray-100">
              {draftItems.map((item) => (
                <li key={item.itemId} className="flex flex-col gap-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-gray-900">{item.name}</p>
                    <p className="text-xs font-bold text-gray-500">Rs. {item.price}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 rounded-xl border border-primary-100 bg-primary-50 px-2 py-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.itemId, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary-700 shadow-sm"
                      aria-label={`Decrease ${item.name}`}
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm font-black tabular-nums text-primary-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.itemId, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-700 text-white shadow-sm"
                      aria-label={`Increase ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-400">
                      Change menu item
                    </span>
                    <select
                      value={item.menuItemId}
                      disabled={loadingMenu || !menuItems.length}
                      onChange={(event) => replaceMenuItem(item.itemId, event.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:border-primary-400 focus:bg-white disabled:opacity-60"
                    >
                      <option value={item.menuItemId}>{loadingMenu ? "Loading menu..." : item.name}</option>
                      {menuItems.map((menuItem) => (
                        <option key={menuItem._id} value={menuItem._id}>
                          {menuItem.name} - Rs. {Number(menuItem.price || 0).toFixed(0)}
                        </option>
                      ))}
                    </select>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-gray-100 bg-white px-5 py-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-bold text-gray-500">Updated subtotal</span>
              <span className="font-black text-gray-950">Rs. {total.toFixed(2)}</span>
            </div>
            <button
              type="button"
              onClick={save}
              disabled={saving || editSecondsRemaining <= 0}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-700 py-3 text-sm font-black text-white shadow-lg shadow-primary-900/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default OrderTracking;
