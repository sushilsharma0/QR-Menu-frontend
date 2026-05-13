import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ShoppingBag,
  Radio,
  ChefHat,
  MapPin,
  Sparkles,
  Check,
  Utensils,
  PackageCheck,
  Receipt,
  Clock,
  XCircle,
  CreditCard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navigation from "../../components/customer/Navigation";
import {
  ensureGuestSession,
  getGuestOrders,
  getStoredCustomerOrders,
  rememberCustomerOrderToken,
} from "../../services/customer";
import { rememberCustomerPortal } from "../../utils/customerPortalContext";

/**
 * Order status flow used in the mini progress timeline rendered on each
 * order card. Keep this in sync with `OrderTracking.jsx` so the customer
 * sees a consistent journey from the list view to the live tracker.
 */
const TRACK_STEPS = [
  { key: "placed", label: "Placed", Icon: Sparkles },
  { key: "accepted", label: "Accepted", Icon: Check },
  { key: "preparing", label: "Cooking", Icon: ChefHat },
  { key: "ready", label: "Ready", Icon: Utensils },
  { key: "done", label: "Served", Icon: PackageCheck },
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

/**
 * Friendly relative timestamps — "2 min ago", "Today, 7:34 PM", etc.
 * Keeps the order cards human and immediate without a heavy date lib.
 */
const formatRelativeTime = (value) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSec < 30) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) {
    return `Today, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  if (diffSec < 172800) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const isCurrentOrder = (status) =>
  ["pending", "confirmed", "preparing", "cooking", "ready"].includes(status);

const MyOrders = () => {
  const { slug, token } = useParams();
  const [activeTab, setActiveTab] = useState("current");
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
        const [guestOrders, storedOrders] = await Promise.all([
          getGuestOrders({ guestId: session.guestId, qrToken: token }),
          getStoredCustomerOrders({ qrToken: token }),
        ]);
        const mergedOrders = [...guestOrders, ...storedOrders].reduce(
          (acc, order) => {
            const key = String(order?._id || order?.qrToken || "");
            if (!key || acc.has(key)) return acc;
            acc.set(key, order);
            return acc;
          },
          new Map(),
        );
        const nextOrders = Array.from(mergedOrders.values()).sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );
        nextOrders.forEach((order) =>
          rememberCustomerOrderToken(token, order.qrToken),
        );
        setOrders(nextOrders);
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

  const partition = useMemo(() => {
    const current = orders.filter((order) => isCurrentOrder(order.status));
    const past = orders.filter((order) => !isCurrentOrder(order.status));
    return { current, past };
  }, [orders]);

  const filteredOrders =
    activeTab === "current" ? partition.current : partition.past;

  const trackFabHref = useMemo(() => {
    const first = orders.find(
      (o) => isCurrentOrder(o.status) && o.qrToken,
    );
    return first?.qrToken ? `/order/track/${first.qrToken}` : null;
  }, [orders]);

  const summary = useMemo(() => {
    const totalSpent = partition.past.reduce(
      (acc, o) => acc + Number(o.grandTotal || 0),
      0,
    );
    const cookingNow = partition.current.filter((o) =>
      ["preparing", "cooking"].includes(o.status),
    ).length;
    const readyNow = partition.current.filter(
      (o) => o.status === "ready",
    ).length;
    return {
      activeCount: partition.current.length,
      pastCount: partition.past.length,
      cookingNow,
      readyNow,
      totalSpent,
    };
  }, [partition]);

  return (
    <div className="min-h-screen bg-surface-50/60 pb-44 text-gray-950">
      <Header onBack={() => navigate(`/menu/${slug}/${token}`)} />

      <SummaryBanner summary={summary} loading={loading} />

      <Tabs
        active={activeTab}
        onChange={setActiveTab}
        currentCount={summary.activeCount}
        pastCount={summary.pastCount}
      />

      <div className="px-4 mt-3 space-y-3 max-w-md mx-auto">
        {loading && orders.length === 0 ? (
          <SkeletonCardList />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            tab={activeTab}
            onBrowse={() => navigate(`/menu/${slug}/${token}`)}
          />
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredOrders.map((order, index) => (
              <OrderCard
                key={order._id || order.qrToken || index}
                order={order}
                index={index}
                onTrack={() => navigate(`/order/track/${order.qrToken}`)}
                onBill={() => navigate(`/order/bill/${order.qrToken}`)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {trackFabHref && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          style={{
            bottom: "calc(6.25rem + env(safe-area-inset-bottom, 0px))",
          }}
          className="fixed right-4 z-[95] print:hidden"
        >
          <Link
            to={trackFabHref}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 px-4 py-3 text-sm font-black text-white shadow-[0_16px_40px_-12px_rgba(122,34,0,0.5)] ring-1 ring-white/20 transition active:scale-95"
          >
            <span className="relative flex h-5 w-5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-attention-300/70" />
              <MapPin size={16} className="relative" />
            </span>
            Track order
          </Link>
        </motion.div>
      )}

      <Navigation />
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
   Header
   ────────────────────────────────────────────────────────────────────── */

function Header({ onBack }) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 px-4 pt-12 pb-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between gap-2">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition active:bg-gray-200"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div className="text-center">
          <h1 className="text-base font-black tracking-tight text-gray-900">
            My Orders
          </h1>
          <p className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live updates
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Radio size={18} className="animate-pulse" />
        </div>
      </div>
    </header>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Summary banner — replaces the old dark "Track without asking" card with
   a warm, light gradient surface that surfaces meaningful stats.
   ────────────────────────────────────────────────────────────────────── */

function SummaryBanner({ summary, loading }) {
  const { activeCount, cookingNow, readyNow, pastCount, totalSpent } = summary;

  const headline =
    activeCount === 0
      ? "Nothing on the stove right now"
      : readyNow > 0
      ? `${readyNow} order${readyNow > 1 ? "s" : ""} ready to serve`
      : cookingNow > 0
      ? `${cookingNow} order${cookingNow > 1 ? "s" : ""} in the kitchen`
      : `${activeCount} order${activeCount > 1 ? "s" : ""} placed — awaiting chef`;

  return (
    <section className="px-4 pt-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-primary-100 bg-gradient-to-br from-surface-50 via-white to-primary-50/50 p-4 shadow-[0_12px_30px_-18px_rgba(122,34,0,0.25)]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-attention-300/20 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-primary-200/30 blur-2xl"
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-900/30">
            <ChefHat size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-700">
              Kitchen status
            </p>
            <p className="mt-0.5 line-clamp-2 text-sm font-black leading-snug text-gray-900">
              {loading && activeCount === 0
                ? "Checking with the kitchen…"
                : headline}
            </p>
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-3 gap-2">
          <StatPill
            label="Active"
            value={activeCount}
            tone="primary"
            highlight={activeCount > 0}
          />
          <StatPill label="Past" value={pastCount} tone="accent" />
          <StatPill
            label="Spent"
            value={`Rs. ${Math.round(totalSpent)}`}
            tone="emerald"
            small
          />
        </div>
      </motion.div>
    </section>
  );
}

function StatPill({ label, value, tone = "primary", highlight, small }) {
  const tones = {
    primary: {
      bg: "bg-white",
      ring: "ring-primary-100",
      value: "text-primary-800",
      label: "text-primary-600",
    },
    accent: {
      bg: "bg-white",
      ring: "ring-amber-100",
      value: "text-amber-900",
      label: "text-amber-700",
    },
    emerald: {
      bg: "bg-white",
      ring: "ring-emerald-100",
      value: "text-emerald-800",
      label: "text-emerald-700",
    },
  }[tone];

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-2xl ${tones.bg} px-2 py-2.5 ring-1 ${tones.ring} ${
        highlight ? "shadow-sm" : ""
      }`}
    >
      <span
        className={`${small ? "text-sm" : "text-lg"} font-black tabular-nums ${tones.value}`}
      >
        {value}
      </span>
      <span className={`mt-0.5 text-[9px] font-black uppercase tracking-wider ${tones.label}`}>
        {label}
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Tabs
   ────────────────────────────────────────────────────────────────────── */

function Tabs({ active, onChange, currentCount, pastCount }) {
  const tabs = [
    { id: "current", label: "Current", count: currentCount },
    { id: "past", label: "Past", count: pastCount },
  ];
  return (
    <div className="mx-auto mt-4 flex max-w-md gap-2 px-4">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <motion.button
            key={tab.id}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(tab.id)}
            className={`relative flex-1 overflow-hidden rounded-2xl border px-3 py-2.5 text-sm font-black transition-all ${
              isActive
                ? "border-primary-200 bg-gradient-to-br from-primary-700 to-primary-600 text-white shadow-[0_10px_24px_-14px_rgba(122,34,0,0.6)]"
                : "border-gray-100 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {tab.label}
              <span
                className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Order Card
   ────────────────────────────────────────────────────────────────────── */

function statusMeta(status) {
  switch (status) {
    case "pending":
      return {
        label: "Placed",
        Icon: Sparkles,
        chipClass: "bg-amber-50 text-amber-800 ring-amber-200",
        accent: "from-amber-500 to-amber-600",
      };
    case "confirmed":
      return {
        label: "Accepted",
        Icon: Check,
        chipClass: "bg-sky-50 text-sky-700 ring-sky-200",
        accent: "from-sky-500 to-sky-600",
      };
    case "preparing":
    case "cooking":
      return {
        label: "Cooking",
        Icon: ChefHat,
        chipClass: "bg-primary-50 text-primary-700 ring-primary-200",
        accent: "from-primary-600 to-primary-700",
      };
    case "ready":
      return {
        label: "Ready",
        Icon: Utensils,
        chipClass: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        accent: "from-emerald-500 to-emerald-600",
      };
    case "served":
    case "completed":
      return {
        label: status === "served" ? "Served" : "Completed",
        Icon: PackageCheck,
        chipClass: "bg-emerald-50 text-emerald-800 ring-emerald-200",
        accent: "from-emerald-600 to-emerald-700",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        Icon: XCircle,
        chipClass: "bg-red-50 text-red-700 ring-red-200",
        accent: "from-red-500 to-red-600",
      };
    default:
      return {
        label: status ? status[0].toUpperCase() + status.slice(1) : "Pending",
        Icon: Clock,
        chipClass: "bg-gray-50 text-gray-700 ring-gray-200",
        accent: "from-gray-500 to-gray-600",
      };
  }
}

function paymentMeta(paymentStatus) {
  if (paymentStatus === "paid") {
    return { label: "Paid", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  }
  if (paymentStatus === "failed") {
    return { label: "Failed", className: "bg-red-50 text-red-600 ring-red-200" };
  }
  if (paymentStatus === "refunded") {
    return { label: "Refunded", className: "bg-gray-50 text-gray-700 ring-gray-200" };
  }
  return { label: "Unpaid", className: "bg-amber-50 text-amber-700 ring-amber-200" };
}

function OrderCard({ order, index, onTrack, onBill }) {
  const status = statusMeta(order.status);
  const StatusIcon = status.Icon;
  const payment = paymentMeta(order.paymentStatus);
  const stepIndex = getTrackStepIndex(order.status);
  const isLive = isCurrentOrder(order.status);

  const items = Array.isArray(order.items) ? order.items : [];
  const itemSummary = items
    .slice(0, 2)
    .map((it) => `${it.name}${it.quantity > 1 ? ` ×${it.quantity}` : ""}`)
    .join(", ");
  const remainingCount = Math.max(0, items.length - 2);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.26, delay: index * 0.04 }}
      className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
    >
      <div className={`h-1 w-full bg-gradient-to-r ${status.accent}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
              Order
            </p>
            <h3 className="truncate text-base font-black text-gray-900">
              #{order.orderNumber || "—"}
            </h3>
            <p className="mt-0.5 text-[11px] font-semibold text-gray-500">
              Table {order?.table?.tableNumber || "—"} ·{" "}
              {formatRelativeTime(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ring-1 ${status.chipClass}`}
            >
              <StatusIcon size={11} strokeWidth={2.5} />
              {status.label}
            </span>
            {order.paymentStatus && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ring-1 ${payment.className}`}
              >
                <CreditCard size={10} strokeWidth={2.5} />
                {payment.label}
              </span>
            )}
          </div>
        </div>

        {/* Mini progress timeline — only shown for non-cancelled orders */}
        {order.status !== "cancelled" && (
          <ProgressTimeline currentIndex={stepIndex} live={isLive} />
        )}

        {/* Items */}
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-gray-50/80 px-3 py-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white text-primary-700 ring-1 ring-primary-100">
            <ShoppingBag size={13} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              {items.length} item{items.length === 1 ? "" : "s"}
            </p>
            <p className="truncate text-xs font-semibold text-gray-700">
              {itemSummary || "No items"}
              {remainingCount > 0 && (
                <span className="ml-1 text-primary-600">
                  +{remainingCount} more
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              Total
            </p>
            <p className="text-sm font-black text-primary-700">
              Rs. {Number(order.grandTotal || 0).toFixed(0)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          {isLive && order.qrToken && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onTrack}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 px-3 py-3 text-xs font-black text-white shadow-md shadow-primary-900/20 transition active:shadow-sm"
            >
              <MapPin size={13} />
              Track live
            </motion.button>
          )}
          {(order.status === "served" || order.status === "completed") &&
            order.qrToken && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onBill}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-3 text-xs font-black text-gray-800 transition active:bg-gray-50"
              >
                <Receipt size={13} />
                View bill
              </motion.button>
            )}
          {order.status === "cancelled" && (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50/70 px-3 py-3 text-xs font-black text-red-700">
              <XCircle size={13} />
              Order cancelled
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ProgressTimeline({ currentIndex, live }) {
  return (
    <div className="mt-4">
      <div className="relative flex items-center justify-between">
        {/* Background rail */}
        <span className="absolute left-2 right-2 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-gray-100" />
        {/* Filled rail */}
        <motion.span
          aria-hidden
          initial={false}
          animate={{
            width:
              currentIndex <= 0
                ? "0%"
                : `${(currentIndex / (TRACK_STEPS.length - 1)) * 100}%`,
          }}
          transition={{ type: "spring", stiffness: 240, damping: 30 }}
          className="absolute left-2 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-gradient-to-r from-primary-500 to-primary-700"
          style={{ maxWidth: "calc(100% - 1rem)" }}
        />

        {TRACK_STEPS.map((step, idx) => {
          const reached = idx <= currentIndex;
          const isCurrent = idx === currentIndex && live;
          const StepIcon = step.Icon;
          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-1 flex-col items-center"
            >
              <span
                className={`relative flex h-6 w-6 items-center justify-center rounded-full text-white transition-all ${
                  reached
                    ? "bg-gradient-to-br from-primary-600 to-primary-700 shadow-[0_4px_10px_-2px_rgba(122,34,0,0.45)]"
                    : "bg-white ring-1 ring-gray-200 text-gray-300"
                }`}
              >
                {isCurrent && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400/60" />
                )}
                <StepIcon size={11} strokeWidth={2.5} className="relative" />
              </span>
              <span
                className={`mt-1 text-[8.5px] font-black uppercase tracking-wider ${
                  reached ? "text-primary-700" : "text-gray-300"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Skeletons + Empty State
   ────────────────────────────────────────────────────────────────────── */

function SkeletonCardList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-3xl border border-gray-100 bg-white"
        >
          <div className="h-1 w-full bg-gradient-to-r from-gray-100 to-gray-200" />
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="h-2 w-12 animate-pulse rounded-full bg-gray-100" />
                <div className="h-3 w-24 animate-pulse rounded-full bg-gray-200" />
                <div className="h-2 w-32 animate-pulse rounded-full bg-gray-100" />
              </div>
              <div className="space-y-1">
                <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" />
                <div className="h-3 w-12 animate-pulse rounded-full bg-gray-100" />
              </div>
            </div>
            <div className="h-1 w-full animate-pulse rounded-full bg-gray-100" />
            <div className="h-12 w-full animate-pulse rounded-2xl bg-gray-50" />
            <div className="h-10 w-full animate-pulse rounded-2xl bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ tab, onBrowse }) {
  const isCurrent = tab === "current";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-dashed border-primary-200/70 bg-gradient-to-br from-white via-surface-50/50 to-primary-50/40 px-6 py-12 text-center"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-attention-300/20 blur-2xl"
      />
      <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary-700 shadow-md ring-1 ring-primary-100">
        {isCurrent ? <ChefHat size={24} /> : <Receipt size={24} />}
      </div>
      <p className="relative mt-4 text-sm font-black text-gray-900">
        {isCurrent ? "No active orders yet" : "No past orders"}
      </p>
      <p className="relative mx-auto mt-1 max-w-[18rem] text-xs font-semibold text-gray-500">
        {isCurrent
          ? "When you send an order to the kitchen, you’ll see live status here."
          : "Your completed orders and bills will appear here once you finish dining."}
      </p>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onBrowse}
        className="relative mx-auto mt-5 inline-flex items-center gap-1.5 rounded-2xl bg-primary-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-primary-900/20 transition active:bg-primary-700"
      >
        Browse menu
      </motion.button>
    </motion.div>
  );
}

export default MyOrders;
