import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  ArrowLeft,
  ChefHat,
  Printer,
  ReceiptText,
  ShieldCheck,
  Download,
  ChevronDown,
  ChevronUp,
  QrCode,
  Users,
  CreditCard,
  Banknote,
  Smartphone,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import Feedback from "../../components/customer/homepage/Feedback";
import Navigation from "../../components/customer/Navigation";
import { BillPageSkeleton } from "../../components/customer/order/OrderTrackingSkeleton";
import { rememberCustomerPortal } from "../../utils/customerPortalContext";
import { rememberCustomerOrderToken } from "../../services/customer";

const formatMoney = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const statusClass = (status) => {
  if (status === "paid") return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/60";
  if (status === "failed") return "bg-red-50 text-red-700 ring-1 ring-red-200/60";
  return "bg-amber-50 text-amber-900 ring-1 ring-amber-200/60";
};

const CustomerBill = () => {
  const { qrToken } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [itemsExpanded, setItemsExpanded] = useState(true);
  const [splitOpen, setSplitOpen] = useState(false);
  const printRootRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchBill = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/customer/order/${qrToken}`, { skipErrorToast: true });
        if (!cancelled) setOrder(res?.data?.data || null);
      } catch (err) {
        console.error("Failed to fetch bill", err);
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBill();
    return () => {
      cancelled = true;
    };
  }, [qrToken]);

  useEffect(() => {
    if (order?.restaurantSlug && order?.tableQrToken) {
      rememberCustomerPortal(order.restaurantSlug, order.tableQrToken);
      rememberCustomerOrderToken(order.tableQrToken, qrToken);
    }
  }, [order?.restaurantSlug, order?.tableQrToken, qrToken]);

  useEffect(() => {
    const paid = order?.paymentStatus === "paid";
    const done =
      order?.status === "completed" || (order?.status === "served" && paid);
    if (!qrToken || !paid || !done || !order?.orderId) return;
    const storageKey = `feedback_prompt_order_${order.orderId}`;
    if (localStorage.getItem(storageKey)) return;
    const t = setTimeout(() => {
      setShowFeedback(true);
      localStorage.setItem(storageKey, "true");
    }, 600);
    return () => clearTimeout(t);
  }, [order?.paymentStatus, order?.status, order?.orderId, qrToken]);

  const totals = useMemo(() => {
    const itemSubtotal = (order?.items || []).reduce(
      (sum, item) =>
        sum + Number(item.subtotal || Number(item.price || 0) * Number(item.quantity || 0)),
      0,
    );
    const subtotal = Number(order?.subtotal ?? itemSubtotal);
    const taxAmount = Number(order?.taxAmount || 0);
    const discountAmount = Number(order?.discountAmount || 0);
    const serviceChargeAmount = Number(order?.serviceChargeAmount || 0);
    const grandTotal = Number(
      order?.grandTotal ??
        order?.totalAmount ??
        Math.max(0, subtotal + taxAmount + serviceChargeAmount - discountAmount),
    );
    return { subtotal, taxAmount, serviceChargeAmount, discountAmount, grandTotal };
  }, [order]);

  const printBill = () => {
    window.print();
  };

  const downloadBill = useCallback(() => {
    const node = printRootRef.current;
    if (!node || !order) return;
    const styles = `
      body{font-family:system-ui,-apple-system,sans-serif;padding:24px;color:#111;}
      h1{font-size:1.25rem;margin:0 0 8px;}
      table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px;}
      th,td{border-bottom:1px solid #eee;padding:8px 4px;text-align:left;}
      .tot{margin-top:16px;font-size:13px;}
      .row{display:flex;justify-content:space-between;padding:4px 0;}
    `;
    const rows = (order.items || [])
      .map((item) => {
        const line = Number(item.subtotal || Number(item.price || 0) * Number(item.quantity || 0));
        return `<tr><td>${escapeHtml(item.name)}</td><td>${item.quantity}</td><td>${formatMoney(line)}</td></tr>`;
      })
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Bill #${order.orderNumber}</title><style>${styles}</style></head><body>
      <h1>${escapeHtml(order.restaurant?.name || "Restaurant")}</h1>
      <p>Order #${order.orderNumber} · Table ${escapeHtml(String(order.tableNumber || ""))}</p>
      <p>${new Date(order.orderTime).toLocaleString()}</p>
      <table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="tot">
        <div class="row"><span>Subtotal</span><span>${formatMoney(totals.subtotal)}</span></div>
        <div class="row"><span>Tax</span><span>${formatMoney(totals.taxAmount)}</span></div>
        <div class="row"><span>Service</span><span>${formatMoney(totals.serviceChargeAmount)}</span></div>
        ${totals.discountAmount > 0 ? `<div class="row"><span>Discount</span><span>-${formatMoney(totals.discountAmount)}</span></div>` : ""}
        <div class="row" style="font-weight:800;font-size:16px;margin-top:8px;border-top:1px solid #ddd;padding-top:8px;"><span>Grand total</span><span>${formatMoney(totals.grandTotal)}</span></div>
      </div>
    </body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bill-${order.orderNumber}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [order, totals]);

  if (loading) {
    return <BillPageSkeleton />;
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50/80 px-6 text-center">
        <ReceiptText size={40} className="text-gray-300" />
        <p className="mt-4 text-base font-black text-gray-900">Bill not found</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-6 rounded-2xl bg-primary-600 px-6 py-3 text-sm font-black text-white shadow-lg"
        >
          Go back
        </button>
      </div>
    );
  }

  const paid = order.paymentStatus === "paid";

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 via-white to-surface-50 pb-44 text-gray-950 print:bg-white print:pb-0">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-gray-100 bg-white/95 px-4 pb-3 pt-12 backdrop-blur-xl print:hidden">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-800"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-sm font-black">Your bill</h1>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            #{order.orderNumber}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-800"
            onClick={downloadBill}
            aria-label="Download bill"
          >
            <Download size={18} />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white"
            onClick={printBill}
            aria-label="Print bill"
          >
            <Printer size={18} />
          </motion.button>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 pt-4 print:max-w-none print:px-0 print:pt-0">
        <div id="customer-bill-print-root" ref={printRootRef}>
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-xl shadow-slate-900/8 print:rounded-none print:border-0 print:shadow-none"
          >
            <div className="relative bg-gradient-to-br from-gray-950 via-gray-900 to-primary-900 px-6 py-8 text-white print:bg-white print:text-gray-950">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_55%)] print:hidden" />
              <div className="relative flex items-start gap-4">
                {order.restaurant?.logo ? (
                  <img
                    src={order.restaurant.logo}
                    alt=""
                    className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white/20 print:border print:border-gray-200 print:ring-0"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 print:bg-gray-100">
                    <ChefHat size={30} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-2xl font-black tracking-tight">
                    {order.restaurant?.name || "Restaurant"}
                  </h2>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-[0.28em] text-white/55 print:text-gray-500">
                    Tax invoice / receipt
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${statusClass(order.paymentStatus)} print:ring-0`}>
                      {order.paymentStatus || "pending"}
                    </span>
                    {paid && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-black text-emerald-100 print:text-emerald-800 print:bg-emerald-50">
                        <Check size={12} strokeWidth={3} />
                        Paid
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative mt-6 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                {[
                  { k: "Order", v: `#${order.orderNumber}` },
                  { k: "Table", v: order.tableNumber || "—" },
                  { k: "Date", v: new Date(order.orderTime).toLocaleString() },
                  { k: "Method", v: (order.paymentMethod || "cash").replace(/_/g, " ") },
                ].map((cell) => (
                  <div
                    key={cell.k}
                    className="rounded-2xl bg-white/10 p-3 print:bg-gray-50"
                  >
                    <p className="font-black uppercase text-white/50 print:text-gray-500">
                      {cell.k}
                    </p>
                    <p className="mt-1 font-black capitalize text-white print:text-gray-950">
                      {cell.v}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <span className="text-sm font-black text-gray-900">Itemized bill</span>
                </div>
                <button
                  type="button"
                  onClick={() => setItemsExpanded((e) => !e)}
                  className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-black text-gray-700 print:hidden"
                >
                  {itemsExpanded ? "Collapse" : "Expand"}
                  {itemsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              <AnimatePresence initial={false}>
                {itemsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden rounded-2xl border border-gray-100"
                  >
                    <div className="grid grid-cols-[1fr_44px_88px] bg-gray-50 px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-gray-400 sm:px-4">
                      <span>Item</span>
                      <span className="text-center">Qty</span>
                      <span className="text-right">Amount</span>
                    </div>
                    {(order.items || []).map((item, index) => {
                      const lineTotal = Number(
                        item.subtotal || Number(item.price || 0) * Number(item.quantity || 0),
                      );
                      return (
                        <div
                          key={`${item.name}-${index}`}
                          className="grid grid-cols-[1fr_44px_88px] items-start border-t border-gray-100 px-3 py-3 text-sm sm:px-4"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-black text-gray-900">{item.name}</p>
                            <p className="mt-0.5 text-xs font-semibold text-gray-400">
                              {formatMoney(item.price)} each
                            </p>
                          </div>
                          <p className="text-center font-bold text-gray-700">{item.quantity}</p>
                          <p className="text-right font-black text-gray-900">
                            {formatMoney(lineTotal)}
                          </p>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-5 space-y-2 rounded-2xl bg-gray-50 p-4 text-sm">
                <Row label="Subtotal" value={formatMoney(totals.subtotal)} />
                <Row label="Tax / VAT" value={formatMoney(totals.taxAmount)} />
                <Row label="Service charge" value={formatMoney(totals.serviceChargeAmount)} />
                {totals.discountAmount > 0 && (
                  <Row
                    label="Discount"
                    value={`− ${formatMoney(totals.discountAmount)}`}
                    accent="text-emerald-700"
                  />
                )}
                <div className="my-2 border-t border-dashed border-gray-200" />
                <div className="flex items-center justify-between text-lg">
                  <span className="font-black text-gray-950">Grand total</span>
                  <span className="font-black text-primary-700">{formatMoney(totals.grandTotal)}</span>
                </div>
              </div>

              {/* Payment methods — UI ready */}
              <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-4 print:hidden">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  Accepted at counter
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { icon: Banknote, label: "Cash" },
                    { icon: CreditCard, label: "Card" },
                    { icon: Smartphone, label: "Online" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1 rounded-xl border border-gray-100 bg-gray-50/80 py-3"
                    >
                      <Icon size={18} className="text-primary-700" />
                      <span className="text-[10px] font-black text-gray-700">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR payment placeholder */}
              <div className="mt-4 rounded-2xl border border-dashed border-primary-200 bg-primary-50/40 p-4 text-center print:hidden">
                <QrCode className="mx-auto text-primary-600" size={28} />
                <p className="mt-2 text-xs font-black text-primary-900">Scan to pay</p>
                <p className="mt-1 text-[11px] font-semibold text-primary-800/80">
                  When your restaurant enables QR checkout, the live payment QR will appear here.
                </p>
              </div>

              {/* Split bill — UI ready */}
              <div className="mt-4 rounded-2xl border border-gray-100 print:hidden">
                <button
                  type="button"
                  onClick={() => setSplitOpen((o) => !o)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="flex items-center gap-2 text-sm font-black text-gray-900">
                    <Users size={18} className="text-secondary-600" />
                    Split bill
                  </span>
                  {splitOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <AnimatePresence initial={false}>
                  {splitOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-gray-100"
                    >
                      <div className="grid gap-2 p-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                          <p className="text-[10px] font-black uppercase text-gray-400">Party A</p>
                          <p className="mt-1 text-lg font-black text-gray-900">
                            {formatMoney(totals.grandTotal / 2)}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold text-gray-500">50% share (preview)</p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                          <p className="text-[10px] font-black uppercase text-gray-400">Party B</p>
                          <p className="mt-1 text-lg font-black text-gray-900">
                            {formatMoney(totals.grandTotal / 2)}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold text-gray-500">50% share (preview)</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-6 rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-5 text-center">
                <ReceiptText size={24} className="mx-auto text-gray-400" />
                <p className="mt-2 text-sm font-black text-gray-900">Thank you for dining with us</p>
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  Show this bill at the counter if payment is still pending.
                </p>
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      {/* Sticky total — mobile */}
      <div className="fixed inset-x-0 bottom-[5.25rem] z-[92] border-t border-gray-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl print:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400">Amount due</p>
            <p className="text-xl font-black text-primary-700">{formatMoney(totals.grandTotal)}</p>
          </div>
          <div className="flex gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={downloadBill}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-black text-gray-800"
            >
              Download
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={printBill}
              className="rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-black text-white shadow-lg"
            >
              Print
            </motion.button>
          </div>
        </div>
      </div>

      <div className="print:hidden">
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
    </div>
  );
};

function Row({ label, value, accent = "text-gray-900" }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="font-semibold text-gray-500">{label}</span>
      <span className={`font-black ${accent}`}>{value}</span>
    </div>
  );
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default CustomerBill;
