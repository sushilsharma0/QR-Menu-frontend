import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  ChefHat,
  Send,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Check,
  Receipt,
  Sparkles,
  ArrowRight,
  PackageOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../services/api";
import { getParsedAuthUser } from "../../utils/authStorage";
import { useToast } from "../../hooks/useToast";
import { ToastContainer } from "../../components/common/ToastContainer";
import {
  getCustomerIdentity,
  getStoredCustomerProfile,
  rememberCustomerOrderToken,
} from "../../services/customer";
import Navigation from "../../components/customer/Navigation";
import { rememberCustomerPortal } from "../../utils/customerPortalContext";
import { useCustomerCart } from "../../context/CustomerCartContext";

const STEPS = [
  { id: "review", label: "Review" },
  { id: "details", label: "Details" },
  { id: "confirm", label: "Confirm" },
];

function useBottomNavHidden() {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY || document.documentElement.scrollTop;
        if (y < 48) {
          setHidden(false);
        } else if (y > lastScrollY.current + 12) {
          setHidden(true);
        } else if (y < lastScrollY.current - 12) {
          setHidden(false);
        }
        lastScrollY.current = y;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return hidden;
}

const Cart = () => {
  const navigate = useNavigate();
  const { slug, token } = useParams();
  const {
    items,
    totals,
    guestId,
    hydrate,
    increment,
    decrement,
    removeLine,
    clear,
  } = useCustomerCart();

  const [step, setStep] = useState("review");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [successOrder, setSuccessOrder] = useState(null);
  const { toasts, removeToast, success, error, warning } = useToast();
  const bottomNavHidden = useBottomNavHidden();

  useEffect(() => {
    if (slug && token) rememberCustomerPortal(slug, token);
  }, [slug, token]);

  // 1) Hydrate the cart context once on mount. The context already calls
  //    ensureGuestSession internally (dedup'd in services/customer.js), so we
  //    must NOT call it again here — that's what tripped the 429 limiter.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        await hydrate(token);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to hydrate cart", err);
          error("Failed to load cart");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // 2) Once the context exposes a guestId, fetch profile details only for an
  //    authenticated customer ID. Guest checkout fields stay blank.
  useEffect(() => {
    if (!guestId || !token) return;
    let cancelled = false;

    (async () => {
      try {
        const storedProfile = getStoredCustomerProfile();
        let identityProfile = storedProfile;
        try {
          const identity = await getCustomerIdentity({ guestId, qrToken: token });
          identityProfile = identity?.customer || storedProfile;
        } catch {
          identityProfile = storedProfile;
        }
        if (cancelled) return;
        setCustomerDetails({
          name: identityProfile?.name || "",
          phone: identityProfile?.phone || "",
          email: identityProfile?.email || "",
        });
      } catch (err) {
        console.error("Failed to load customer identity", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [guestId, token]);

  const subtotal = totals.subtotal;
  const total = Math.max(0, subtotal - promoDiscount);

  const stepIndex = useMemo(
    () => Math.max(0, STEPS.findIndex((s) => s.id === step)),
    [step],
  );

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      warning("Please enter a promo code.");
      return;
    }
    if (items.length === 0) {
      warning("Your cart is empty.");
      return;
    }

    try {
      setApplyingPromo(true);
      const res = await api.post("/customer/promo/validate", {
        qrToken: token,
        code: promoCode.trim(),
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      });
      const promo = res?.data?.data;
      setAppliedPromo(promo);
      setPromoDiscount(Number(promo?.discountAmount || 0));
      success(`Promo applied: ${promo?.code}`);
    } catch (err) {
      setAppliedPromo(null);
      setPromoDiscount(0);
      error(err?.response?.data?.message || "Invalid promo code");
    } finally {
      setApplyingPromo(false);
    }
  };

  const goNext = () => {
    if (step === "review") {
      if (items.length === 0) {
        warning("Your cart is empty.");
        return;
      }
      setStep("details");
    } else if (step === "details") {
      if (!String(customerDetails.name || "").trim()) {
        warning("Please enter your full name.");
        return;
      }
      setStep("confirm");
    }
  };

  const goBack = () => {
    if (step === "confirm") setStep("details");
    else if (step === "details") setStep("review");
    else navigate(-1);
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      warning("Your cart is empty.");
      return;
    }

    try {
      setIsPlacingOrder(true);

      const dashUser = getParsedAuthUser();
      const finalName = String(customerDetails.name || dashUser?.name || "").trim();
      const finalPhone = String(customerDetails.phone || dashUser?.phone || "").trim();
      const finalEmail = String(customerDetails.email || dashUser?.email || "").trim();
      if (!finalName) {
        warning("Please enter your full name.");
        setStep("details");
        setIsPlacingOrder(false);
        return;
      }
      const payload = {
        qrToken: token,
        guestId,
        deferPayment: true,
        checkoutTiming: "post_serve",
        creditEmail: "",
        creditOtp: "",
        customerName: finalName,
        customerPhone: finalPhone,
        customerEmail: finalEmail,
        promoCode: appliedPromo?.code || "",
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          note: item.note || "",
          cookingInstructions: item.cookingInstructions || "",
          customizations: item.customizations || [],
          addOns: item.addOns || [],
        })),
      };

      const res = await api.post("/customer/checkout", payload);
      const order = res?.data?.data;
      rememberCustomerOrderToken(token, order?.trackToken);

      await clear();
      setAppliedPromo(null);
      setPromoDiscount(0);
      setPromoCode("");
      setSuccessOrder(order || {});

      // Auto-navigate after success animation plays.
      setTimeout(() => {
        navigate(
          order?.trackToken
            ? `/order/track/${order.trackToken}`
            : `/orders/${slug}/${token}`,
        );
      }, 2200);
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to place order. Try again.";
      error(message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const hasItems = items.length > 0;
  const showStickyCta = hasItems;
  const bottomPaddingClass = showStickyCta
    ? bottomNavHidden
      ? "pb-28"
      : "pb-48"
    : "pb-28";

  return (
    <div
      className={`min-h-screen bg-surface-50/60 text-gray-950 transition-[padding-bottom] duration-300 ${bottomPaddingClass}`}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white px-5 pb-4 pt-12 shadow-[0_8px_24px_-22px_rgba(15,23,42,0.45)]">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition active:bg-gray-200"
          onClick={goBack}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-base font-black tracking-tight">Checkout</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
            Step {stepIndex + 1} of {STEPS.length} · {STEPS[stepIndex].label}
          </p>
        </div>
        {step === "review" ? (
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 transition active:bg-red-100"
            onClick={() => items.length > 0 && clear()}
            aria-label="Clear cart"
          >
            <Trash2 size={18} />
          </button>
        ) : (
          <span className="h-10 w-10" />
        )}
      </header>

      {/* Step indicator */}
      <div className="mx-auto mt-5 max-w-md px-5">
        <div className="flex items-center justify-between">
          {STEPS.map((s, idx) => {
            const completed = idx < stepIndex;
            const active = idx === stepIndex;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-1 flex-col items-center">
                  <motion.div
                    animate={{
                      scale: active ? 1.05 : 1,
                      backgroundColor: completed || active ? "#7a2200" : "#f1f0da",
                      color: completed || active ? "#ffffff" : "#5c4d1d",
                    }}
                    transition={{ type: "spring", stiffness: 320, damping: 24 }}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black shadow-sm"
                  >
                    {completed ? <Check size={16} strokeWidth={3} /> : idx + 1}
                  </motion.div>
                  <span
                    className={`mt-1.5 text-[10px] font-black uppercase tracking-wider ${
                      active ? "text-primary-700" : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="-mt-5 mx-1 h-0.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{
                        scaleX: idx < stepIndex ? 1 : 0,
                        backgroundColor: "#7a2200",
                      }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="h-full origin-left rounded-full"
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="pt-5"
        >
          {step === "review" && (
            <ReviewStep
              items={items}
              onIncrement={increment}
              onDecrement={decrement}
              onRemove={removeLine}
              promoCode={promoCode}
              setPromoCode={setPromoCode}
              onApplyPromo={handleApplyPromo}
              applyingPromo={applyingPromo}
              appliedPromo={appliedPromo}
              promoDiscount={promoDiscount}
              subtotal={subtotal}
              total={total}
              onBrowse={() => navigate(`/menu/${slug}/${token}`)}
            />
          )}

          {step === "details" && (
            <DetailsStep
              customerDetails={customerDetails}
              setCustomerDetails={setCustomerDetails}
              subtotal={subtotal}
              total={total}
              promoDiscount={promoDiscount}
            />
          )}

          {step === "confirm" && (
            <ConfirmStep
              items={items}
              customerDetails={customerDetails}
              subtotal={subtotal}
              total={total}
              promoDiscount={promoDiscount}
              appliedPromo={appliedPromo}
            />
          )}

        </motion.div>
      </AnimatePresence>

      {/* Sticky CTA — only when the cart has items. An empty cart already
          surfaces a "Browse menu" CTA in its empty-state card, so we don't
          want a second, disabled "Continue" button hanging at the bottom. */}
      <AnimatePresence>
        {showStickyCta && (
          <motion.div
            key="cart-sticky-cta"
            initial={{ y: 24, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              bottom: bottomNavHidden
                ? "calc(0.75rem + env(safe-area-inset-bottom, 0px))"
                : "calc(5rem + env(safe-area-inset-bottom, 0px))",
            }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-x-0 z-[85] border-t border-gray-100 bg-white/95 px-4 pb-2.5 pt-2.5 backdrop-blur-xl shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.18)]"
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {totals.count} item{totals.count > 1 ? "s" : ""}
                  {promoDiscount > 0 ? " · promo applied" : ""}
                </p>
                <p className="text-[17px] font-black leading-tight text-gray-900">
                  Rs. {Number(total || 0).toFixed(0)}
                </p>
              </div>

              {step === "confirm" ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-primary-700 px-5 py-2.5 text-sm font-black text-white shadow-md shadow-primary-900/25 transition active:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPlacingOrder ? "Sending…" : "Send to kitchen"}
                  {!isPlacingOrder && <Send size={15} />}
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={goNext}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-primary-700 px-5 py-2.5 text-sm font-black text-white shadow-md shadow-primary-900/25 transition active:bg-primary-800"
                >
                  {step === "review" ? "Continue" : "Review"}
                  <ArrowRight size={15} />
                </motion.button>
              )}
            </div>
            <p className="mt-1.5 flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-700">
              <ShieldCheck size={11} />
              Pay after your food is served
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success overlay */}
      <AnimatePresence>
        {successOrder && (
          <SuccessOverlay order={successOrder} />
        )}
      </AnimatePresence>

      {/* Sending-to-kitchen modal */}
      <AnimatePresence>
        {isPlacingOrder && !successOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 20, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.96 }}
              className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-2xl"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
                <ChefHat size={30} className="animate-pulse" />
              </div>
              <h2 className="mt-4 text-xl font-black text-gray-950">
                Sending to kitchen
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Please wait while your order reaches the restaurant.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navigation />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

function ReviewStep({
  items,
  onIncrement,
  onDecrement,
  onRemove,
  promoCode,
  setPromoCode,
  onApplyPromo,
  applyingPromo,
  appliedPromo,
  promoDiscount,
  subtotal,
  total,
  onBrowse,
}) {
  return (
    <div className="px-5 space-y-4">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-secondary-500 p-5 text-white shadow-xl shadow-primary-900/20">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <ChefHat size={22} />
          </div>
          <div>
            <p className="text-sm font-black">Send order to kitchen</p>
            <p className="text-xs font-semibold text-white/80">
              Pay after your food is served.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-black text-white/80">
          {["1. Review", "2. Details", "3. Send"].map((label) => (
            <span
              key={label}
              className="rounded-xl bg-white/10 px-2 py-2 backdrop-blur"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <PackageOpen size={24} />
          </div>
          <p className="mt-3 text-sm font-black text-gray-900">Cart is empty</p>
          <p className="mt-1 text-xs font-semibold text-gray-400">
            Browse the menu and add a few favourites.
          </p>
          <button
            onClick={onBrowse}
            className="mt-5 rounded-2xl bg-primary-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-primary-900/20 transition active:scale-95"
          >
            Browse menu
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false} mode="popLayout">
            {items.map((item) => (
              <motion.li
                layout
                key={item.lineId || item.menuItemId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                      <PackageOpen size={20} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-gray-900">
                    {item.name}
                  </p>
                  <p className="text-xs font-black text-primary-700">
                    Rs. {item.price}
                  </p>
                  {(item.customizations || []).length > 0 && (
                    <p className="mt-0.5 line-clamp-1 text-[10px] font-semibold text-gray-500">
                      {(item.customizations || [])
                        .map((c) => `${c.name || c.group}: ${c.value}`)
                        .join(" · ")}
                    </p>
                  )}
                  {item.cookingInstructions ? (
                    <p className="mt-0.5 line-clamp-1 text-[10px] font-semibold text-amber-700">
                      Note: {item.cookingInstructions}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5 rounded-xl border border-primary-100 bg-primary-50/70 px-1.5 py-1">
                    <button
                      onClick={() => onDecrement(item.menuItemId, item.lineId)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-primary-700 shadow-sm transition active:scale-90"
                      aria-label="Decrease"
                    >
                      <Minus size={13} strokeWidth={3} />
                    </button>
                    <motion.span
                      key={item.quantity}
                      initial={{ scale: 0.85, opacity: 0.6 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 360, damping: 22 }}
                      className="w-5 text-center text-sm font-black tabular-nums text-primary-800"
                    >
                      {item.quantity}
                    </motion.span>
                    <button
                      onClick={() => onIncrement(item.menuItemId, item.lineId)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm transition active:scale-90"
                      aria-label="Increase"
                    >
                      <Plus size={13} strokeWidth={3} />
                    </button>
                  </div>
                  <button
                    onClick={() => onRemove(item.menuItemId, item.lineId)}
                    className="text-[10px] font-bold text-gray-400 transition hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {/* Bill */}
      {items.length > 0 && (
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Enter promo code"
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
            />
            <button
              onClick={onApplyPromo}
              disabled={applyingPromo}
              className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-black text-white transition active:scale-95 disabled:opacity-60"
            >
              {applyingPromo ? "Applying..." : "Apply"}
            </button>
          </div>
          {appliedPromo && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <Check size={12} strokeWidth={3} />
              Applied {appliedPromo.code}: -Rs. {promoDiscount}
            </div>
          )}
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Subtotal" value={`Rs. ${subtotal}`} />
            {promoDiscount > 0 && (
              <Row
                label="Promo discount"
                value={`- Rs. ${promoDiscount}`}
                accent="text-emerald-600"
              />
            )}
          </div>
          <div className="my-3 border-t border-dashed border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-gray-800">Total</span>
            <span className="text-xl font-black text-primary-700">
              Rs. {total}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailsStep({ customerDetails, setCustomerDetails, subtotal, total, promoDiscount }) {
  return (
    <div className="px-5 space-y-4">
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">
          Customer Details
        </h3>
        <p className="mt-1 text-xs font-semibold text-gray-500">
          We use this only to identify your order at the table.
        </p>
        <div className="mt-4 space-y-3">
          <Field
            icon={User}
            value={customerDetails.name}
            onChange={(v) => setCustomerDetails((p) => ({ ...p, name: v }))}
            placeholder="Full name"
            required
          />
          <Field
            icon={Phone}
            value={customerDetails.phone}
            onChange={(v) => setCustomerDetails((p) => ({ ...p, phone: v }))}
            placeholder="Phone number (optional)"
            type="tel"
          />
          <Field
            icon={Mail}
            value={customerDetails.email}
            onChange={(v) => setCustomerDetails((p) => ({ ...p, email: v }))}
            placeholder="Email (optional)"
            type="email"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-primary-100 bg-primary-50/60 p-4">
        <p className="flex items-start gap-2 text-xs font-bold leading-relaxed text-primary-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
          After your food is served, the app will ask how you want to pay
          (cash, online, split, or house credit).
        </p>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.18em] text-gray-400">
          <Receipt size={12} />
          Bill summary
        </h3>
        <div className="mt-3 space-y-2 text-sm">
          <Row label="Subtotal" value={`Rs. ${subtotal}`} />
          {promoDiscount > 0 && (
            <Row
              label="Promo discount"
              value={`- Rs. ${promoDiscount}`}
              accent="text-emerald-600"
            />
          )}
          <div className="my-2 border-t border-dashed border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-gray-800">Total</span>
            <span className="text-xl font-black text-primary-700">Rs. {total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmStep({ items, customerDetails, subtotal, total, promoDiscount, appliedPromo }) {
  return (
    <div className="px-5 space-y-4">
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">
          Order summary
        </h3>
        <ul className="mt-3 divide-y divide-gray-100">
          {items.map((item) => (
            <li
              key={item.lineId || item.menuItemId}
              className="flex items-start justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-gray-900">
                  {item.name}{" "}
                  <span className="text-xs font-bold text-gray-400">
                    × {item.quantity}
                  </span>
                </p>
                {(item.customizations || []).length > 0 && (
                  <p className="mt-0.5 line-clamp-1 text-[10px] font-semibold text-gray-500">
                    {(item.customizations || [])
                      .map((c) => `${c.name || c.group}: ${c.value}`)
                      .join(" · ")}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-sm font-black text-gray-900">
                Rs. {Number(item.price) * Number(item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">
          Customer
        </h3>
        <div className="mt-3 space-y-1 text-sm font-bold text-gray-800">
          <p>{customerDetails.name}</p>
          {customerDetails.phone && (
            <p className="text-xs font-semibold text-gray-500">{customerDetails.phone}</p>
          )}
          {customerDetails.email && (
            <p className="text-xs font-semibold text-gray-500">{customerDetails.email}</p>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">
          Total
        </h3>
        <div className="mt-3 space-y-2 text-sm">
          <Row label="Subtotal" value={`Rs. ${subtotal}`} />
          {promoDiscount > 0 && (
            <Row
              label={`Promo (${appliedPromo?.code || "applied"})`}
              value={`- Rs. ${promoDiscount}`}
              accent="text-emerald-600"
            />
          )}
          <div className="my-2 border-t border-dashed border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-gray-800">Total</span>
            <span className="text-2xl font-black text-primary-700">Rs. {total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessOverlay({ order }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-gradient-to-br from-primary-900/85 via-primary-800/80 to-secondary-700/80 px-6 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="w-full max-w-sm rounded-[2rem] bg-white p-7 text-center shadow-2xl"
      >
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 18 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30"
        >
          <Check size={40} strokeWidth={3} />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-5 text-2xl font-black text-gray-950"
        >
          Order placed!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="mt-2 text-sm font-semibold text-gray-500"
        >
          Order <span className="font-black text-primary-700">#{order?.orderNumber || "—"}</span> is on its way to the kitchen.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700"
        >
          <Sparkles size={12} />
          Opening live tracking...
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

function Field({ icon: Icon, value, onChange, placeholder, type = "text", required, inputMode }) {
  return (
    <label className="relative block">
      <Icon size={18} className="absolute left-3 top-3.5 text-gray-400" />
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
      />
    </label>
  );
}

function Row({ label, value, accent = "text-gray-900" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-semibold text-gray-500">{label}</span>
      <span className={`font-black ${accent}`}>{value}</span>
    </div>
  );
}

export default Cart;

