import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Landmark, ShieldCheck } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { ToastContainer } from "../common/ToastContainer";
import { requestCreditCheckoutOtp, submitPostServeOrderPayment } from "../../services/customer";

export default function CustomerPostServePayment({
  restaurantSlug,
  tableQrToken,
  trackToken,
  guestId,
  grandTotal,
  customerEmail: initialEmail,
  guestPaymentPreferenceAt,
  paymentMethod: orderPaymentMethod,
  guestPaymentPreferenceCash = 0,
  guestPaymentPreferenceOnline = 0,
  onSuccess,
}) {
  const { success, error, warning, toasts, removeToast } = useToast();
  const [checkoutTiming, setCheckoutTiming] = useState("pay_now");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [cashSplit, setCashSplit] = useState("");
  const [onlineSplit, setOnlineSplit] = useState("");
  const [creditEmail, setCreditEmail] = useState(initialEmail || "");
  const [creditOtp, setCreditOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const total = Math.max(0, Number(grandTotal || 0));
  const preferenceSent = Boolean(guestPaymentPreferenceAt);

  const sendCreditOtp = async () => {
    const em = String(creditEmail || initialEmail || "").trim();
    if (!em) {
      warning("Enter your house-account email first.");
      return;
    }
    if (!tableQrToken || !guestId) {
      warning("Session missing — reopen from your table QR.");
      return;
    }
    try {
      setOtpSending(true);
      await requestCreditCheckoutOtp({ qrToken: tableQrToken, guestId, email: em });
      success("Check your email for a 6-digit code.");
    } catch (err) {
      error(err?.response?.data?.message || "Could not send code — is your account approved?");
    } finally {
      setOtpSending(false);
    }
  };

  const submit = async () => {
    if (!guestId || !trackToken) {
      warning("Missing guest session.");
      return;
    }
    if (checkoutTiming === "credit") {
      const ce = String(creditEmail || initialEmail || "").trim();
      if (!ce) {
        warning("Enter the email on your approved house account.");
        return;
      }
      if (!String(creditOtp).trim()) {
        warning("Enter the verification code sent to your email.");
        return;
      }
    }
    if (checkoutTiming === "pay_now" && paymentMode === "both") {
      const c = Number(cashSplit) || 0;
      const o = Number(onlineSplit) || 0;
      if (Math.abs(c + o - total) > 0.02) {
        warning("Cash + online must equal your order total.");
        return;
      }
    }
    try {
      setSubmitting(true);
      await submitPostServeOrderPayment({
        qrToken: trackToken,
        guestId,
        checkoutTiming,
        paymentMode: checkoutTiming === "pay_now" ? paymentMode : undefined,
        cashAmount: paymentMode === "both" ? Number(cashSplit) || 0 : 0,
        onlineAmount: paymentMode === "both" ? Number(onlineSplit) || 0 : 0,
        creditEmail: checkoutTiming === "credit" ? String(creditEmail || initialEmail).trim() : "",
        creditOtp: checkoutTiming === "credit" ? String(creditOtp).trim() : "",
        customerEmail: String(initialEmail || "").trim(),
      });
      if (checkoutTiming === "credit") {
        success("House account recorded — thank you!");
      } else {
        success("Choice sent — staff will confirm when payment is received.");
      }
      onSuccess?.();
    } catch (err) {
      error(err?.response?.data?.message || "Could not save.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!restaurantSlug || !tableQrToken) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Reopen this page from your table QR to pay here.
      </div>
    );
  }

  return (
    <section className="mt-5 space-y-4 rounded-[2rem] border border-primary-200 bg-white p-5 shadow-sm dark:border-primary-900/40 dark:bg-gray-900">
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-primary-700 dark:text-primary-400">Settle your bill</p>
        <p className="mt-1 text-sm font-semibold text-gray-600 dark:text-gray-400">
          Tell us how you plan to pay. A team member will record payment when they collect cash or confirm your online
          payment — you are not charged from this screen alone.
        </p>
      </div>

      {preferenceSent && checkoutTiming === "pay_now" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm font-semibold text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
          <p className="font-black">Waiting for staff</p>
          <p className="mt-2 text-xs leading-relaxed opacity-90">
            We shared your choice
            {orderPaymentMethod === "mixed"
              ? `: cash ${Number(guestPaymentPreferenceCash || 0).toFixed(2)} + online ${Number(guestPaymentPreferenceOnline || 0).toFixed(2)}`
              : orderPaymentMethod
                ? ` (${orderPaymentMethod})`
                : ""}
            . Payment status stays pending until the restaurant marks it paid.
          </p>
          <p className="mt-2 text-xs font-bold text-emerald-800 dark:text-emerald-200">You can update your choice below if you change your mind.</p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-950/50">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">How do you want to pay?</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setCheckoutTiming("pay_now")}
            className={`rounded-2xl border-2 py-3 text-xs font-black transition-all ${
              checkoutTiming === "pay_now"
                ? "border-primary-600 bg-primary-50 text-primary-800 dark:bg-primary-950/40 dark:text-primary-100"
                : "border-gray-100 text-gray-600 dark:border-gray-700 dark:text-gray-300"
            }`}
          >
            Cash / online
          </button>
          <button
            type="button"
            onClick={() => setCheckoutTiming("credit")}
            className={`rounded-2xl border-2 py-3 text-xs font-black transition-all ${
              checkoutTiming === "credit"
                ? "border-primary-600 bg-primary-50 text-primary-800 dark:bg-primary-950/40 dark:text-primary-100"
                : "border-gray-100 text-gray-600 dark:border-gray-700 dark:text-gray-300"
            }`}
          >
            House credit
          </button>
        </div>
        {checkoutTiming === "credit" && (
          <p className="mt-3 text-[11px] font-semibold leading-relaxed text-gray-500 dark:text-gray-400">
            Approved house account only.{" "}
            <Link className="font-bold text-primary-600 underline" to={`/credit-apply/${restaurantSlug}/${tableQrToken}`}>
              Apply for credit
            </Link>
          </p>
        )}
      </div>

      {checkoutTiming === "pay_now" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Payment type</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "cash", icon: Landmark, label: "Cash" },
              { id: "online", icon: CreditCard, label: "Online" },
              { id: "both", icon: ShieldCheck, label: "Split" },
            ].map((opt) => {
              const Icon = opt.icon;
              const active = paymentMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPaymentMode(opt.id)}
                  className={`flex flex-col items-center rounded-2xl border-2 py-3 transition-all ${
                    active ? "border-primary-600 bg-primary-50 dark:bg-primary-950/40" : "border-gray-100 dark:border-gray-700"
                  }`}
                >
                  <Icon size={22} className={active ? "text-primary-600" : "text-gray-400"} />
                  <span className="mt-1 text-[10px] font-bold text-gray-700 dark:text-gray-200">{opt.label}</span>
                </button>
              );
            })}
          </div>
          {paymentMode === "both" && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                Cash (Rs.)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashSplit}
                  onChange={(e) => setCashSplit(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </label>
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                Online (Rs.)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={onlineSplit}
                  onChange={(e) => setOnlineSplit(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </label>
              <p className="col-span-2 text-[10px] font-semibold text-gray-400">Must add up to Rs. {total}</p>
            </div>
          )}
        </div>
      )}

      {checkoutTiming === "credit" && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200">Verify house account</h3>
          <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300">
            Account email
            <input
              type="email"
              value={creditEmail}
              onChange={(e) => setCreditEmail(e.target.value)}
              placeholder="same email restaurant approved"
              className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm dark:border-amber-800 dark:bg-gray-900 dark:text-white"
            />
          </label>
          <button
            type="button"
            disabled={otpSending}
            onClick={sendCreditOtp}
            className="mt-3 w-full rounded-xl bg-amber-600 py-2.5 text-xs font-black text-white disabled:opacity-50"
          >
            {otpSending ? "Sending…" : "Email me verification code"}
          </button>
          <label className="mt-3 block text-[11px] font-bold text-gray-600 dark:text-gray-300">
            6-digit code
            <input
              value={creditOtp}
              onChange={(e) => setCreditOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm tracking-[0.4em] dark:border-amber-800 dark:bg-gray-900 dark:text-white"
            />
          </label>
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/80">
        <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Total</span>
        <span className="text-lg font-black text-orange-500">Rs. {total}</span>
      </div>

      <button
        type="button"
        disabled={submitting}
        onClick={submit}
        className="w-full rounded-2xl bg-primary-600 py-4 text-sm font-black text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
      >
        {submitting ? "Sending…" : checkoutTiming === "credit" ? "Verify & use house credit" : "Send choice to restaurant"}
      </button>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </section>
  );
}
