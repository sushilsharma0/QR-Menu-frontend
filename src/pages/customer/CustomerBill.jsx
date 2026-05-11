import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChefHat, Printer, ReceiptText, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import Feedback from "../../components/customer/homepage/Feedback";
import Navigation from "../../components/customer/Navigation";
import { rememberCustomerPortal } from "../../utils/customerPortalContext";

const formatMoney = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const statusClass = (status) => {
  if (status === "paid") return "bg-emerald-50 text-emerald-700";
  if (status === "failed") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
};

const CustomerBill = () => {
  const { qrToken } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/customer/order/${qrToken}`, { skipErrorToast: true });
        setOrder(res?.data?.data || null);
      } catch (err) {
        console.error("Failed to fetch bill", err);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
    const intervalId = setInterval(fetchBill, 12000);
    return () => clearInterval(intervalId);
  }, [qrToken]);

  useEffect(() => {
    if (order?.restaurantSlug && order?.tableQrToken) {
      rememberCustomerPortal(order.restaurantSlug, order.tableQrToken);
    }
  }, [order?.restaurantSlug, order?.tableQrToken]);

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
      (sum, item) => sum + Number(item.subtotal || Number(item.price || 0) * Number(item.quantity || 0)),
      0,
    );
    const subtotal = Number(order?.subtotal ?? itemSubtotal);
    const taxAmount = Number(order?.taxAmount || 0);
    const discountAmount = Number(order?.discountAmount || 0);
    const grandTotal = Number(order?.grandTotal ?? order?.totalAmount ?? Math.max(0, subtotal + taxAmount - discountAmount));
    return { subtotal, taxAmount, discountAmount, grandTotal };
  }, [order]);

  const printBill = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf7] text-sm font-semibold text-gray-500">
        Preparing your bill...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafaf7] px-6 text-center">
        <ReceiptText size={34} className="text-gray-300" />
        <p className="mt-3 text-sm font-bold text-gray-700">Bill not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 rounded-xl bg-gray-950 px-4 py-2 text-sm font-bold text-white">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-28 text-gray-950 print:bg-white print:pb-0">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-5 pb-5 pt-12 backdrop-blur print:hidden">
        <button className="rounded-xl bg-gray-50 p-2 hover:bg-gray-100" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black">Your Bill</h1>
          <p className="text-[11px] font-semibold text-gray-400">Order #{order.orderNumber}</p>
        </div>
        <button className="rounded-xl bg-primary-600 p-2 text-white hover:bg-primary-700" onClick={printBill}>
          <Printer size={20} />
        </button>
      </header>

      <main className="mx-auto max-w-xl px-5 pt-5 print:max-w-none print:px-0 print:pt-0">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-xl shadow-slate-950/5 print:rounded-none print:border-0 print:shadow-none"
        >
          <div className="bg-gray-950 px-6 py-7 text-white print:bg-white print:text-gray-950">
            <div className="flex items-center gap-4">
              {order.restaurant?.logo ? (
                <img src={order.restaurant.logo} alt={order.restaurant.name} className="h-16 w-16 rounded-2xl object-cover print:border print:border-gray-200" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-surface-100 print:bg-gray-100 print:text-gray-900">
                  <ChefHat size={30} />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-black">{order.restaurant?.name || "Restaurant"}</h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 print:text-gray-500">Tax Invoice / Receipt</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl bg-white/10 p-3 print:bg-gray-50">
                <p className="font-bold uppercase text-slate-400 print:text-gray-500">Order</p>
                <p className="mt-1 font-black">#{order.orderNumber}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 print:bg-gray-50">
                <p className="font-bold uppercase text-slate-400 print:text-gray-500">Table</p>
                <p className="mt-1 font-black">{order.tableNumber || "N/A"}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 print:bg-gray-50">
                <p className="font-bold uppercase text-slate-400 print:text-gray-500">Date</p>
                <p className="mt-1 font-black">{new Date(order.orderTime).toLocaleString()}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 print:bg-gray-50">
                <p className="font-bold uppercase text-slate-400 print:text-gray-500">Payment</p>
                <p className="mt-1 font-black capitalize">{order.paymentMethod || "cash"}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <span className="text-sm font-black text-gray-900">Served order bill</span>
              </div>
              <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase ${statusClass(order.paymentStatus)}`}>
                {order.paymentStatus || "pending"}
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <div className="grid grid-cols-[1fr_52px_82px] bg-gray-50 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-gray-400">
                <span>Item</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Amount</span>
              </div>
              {(order.items || []).map((item, index) => {
                const lineTotal = Number(item.subtotal || Number(item.price || 0) * Number(item.quantity || 0));
                return (
                  <div key={`${item.name}-${index}`} className="grid grid-cols-[1fr_52px_82px] items-start border-t border-gray-100 px-4 py-3 text-sm">
                    <div>
                      <p className="font-black text-gray-900">{item.name}</p>
                      <p className="mt-1 text-xs font-semibold text-gray-400">{formatMoney(item.price)} each</p>
                    </div>
                    <p className="text-center font-bold text-gray-700">{item.quantity}</p>
                    <p className="text-right font-black text-gray-900">{formatMoney(lineTotal)}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm">
              <div className="flex justify-between py-1">
                <span className="font-semibold text-gray-500">Subtotal</span>
                <span className="font-bold text-gray-900">{formatMoney(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-gray-500">Tax</span>
                <span className="font-bold text-gray-900">{formatMoney(totals.taxAmount)}</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between py-1">
                  <span className="font-semibold text-gray-500">Discount</span>
                  <span className="font-bold text-emerald-600">- {formatMoney(totals.discountAmount)}</span>
                </div>
              )}
              <div className="mt-3 flex justify-between border-t border-gray-200 pt-4 text-lg">
                <span className="font-black text-gray-950">Grand Total</span>
                <span className="font-black text-orange-500">{formatMoney(totals.grandTotal)}</span>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-gray-200 p-4 text-center">
              <ReceiptText size={22} className="mx-auto text-gray-400" />
              <p className="mt-2 text-sm font-black text-gray-900">Thank you for dining with us</p>
              <p className="mt-1 text-xs font-semibold text-gray-400">Please show this bill at the counter if payment is pending.</p>
            </div>
          </div>
        </motion.section>
      </main>
      <div className="print:hidden">
        <Feedback isOpen={showFeedback} onClose={() => setShowFeedback(false)} qrToken={qrToken} />
        <Navigation restaurantSlug={order?.restaurantSlug} tableQrToken={order?.tableQrToken} />
      </div>
    </div>
  );
};

export default CustomerBill;
