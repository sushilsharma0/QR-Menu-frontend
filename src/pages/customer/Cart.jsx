import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Landmark,
  ChefHat,
  Send,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { getParsedAuthUser } from "../../utils/authStorage";
import { useToast } from "../../hooks/useToast";
import { ToastContainer } from "../../components/common/ToastContainer";
import {
  clearGuestCart,
  ensureGuestSession,
  getGuestCart,
  removeGuestCartItem,
  updateGuestCartItem,
} from "../../services/customer";

const Cart = () => {
  const navigate = useNavigate();
  const { slug, token } = useParams();
  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [guestId, setGuestId] = useState("");
  const { toasts, removeToast, success, error, warning } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        const session = await ensureGuestSession(token);
        setGuestId(session.guestId);
        const cart = await getGuestCart({ guestId: session.guestId, qrToken: token });
        const normalized = (cart.items || []).map((item) => ({
          _id: item.menuItem?._id || item.menuItem,
          name: item.menuItem?.name || "Item",
          image: item.menuItem?.image || "",
          price: item.price,
          quantity: item.quantity,
          note: item.notes || "",
        }));
        setCartItems(normalized);
      } catch (err) {
        console.error("Failed to load guest cart", err);
        error("Failed to load cart");
      }
    };
    init();
  }, [token]);

  // Increase quantity
  const increaseQty = async (id) => {
    const current = cartItems.find((item) => item._id === id);
    if (!current || !guestId) return;
    try {
      const cart = await updateGuestCartItem({
        guestId,
        qrToken: token,
        menuItemId: id,
        quantity: current.quantity + 1,
      });
      setCartItems(
        (cart.items || []).map((item) => ({
          _id: item.menuItem?._id || item.menuItem,
          name: item.menuItem?.name || "Item",
          image: item.menuItem?.image || "",
          price: item.price,
          quantity: item.quantity,
          note: item.notes || "",
        }))
      );
    } catch (err) {
      error("Failed to update item quantity");
    }
  };

  // Decrease quantity
  const decreaseQty = async (id) => {
    const current = cartItems.find((item) => item._id === id);
    if (!current || !guestId) return;
    try {
      const cart = await updateGuestCartItem({
        guestId,
        qrToken: token,
        menuItemId: id,
        quantity: current.quantity - 1,
      });
      setCartItems(
        (cart.items || []).map((item) => ({
          _id: item.menuItem?._id || item.menuItem,
          name: item.menuItem?.name || "Item",
          image: item.menuItem?.image || "",
          price: item.price,
          quantity: item.quantity,
          note: item.notes || "",
        }))
      );
    } catch (err) {
      error("Failed to update item quantity");
    }
  };

  // Remove item from cart
  const removeItem = async (id) => {
    if (!guestId) return;
    try {
      const cart = await removeGuestCartItem({ guestId, qrToken: token, menuItemId: id });
      setCartItems(
        (cart.items || []).map((item) => ({
          _id: item.menuItem?._id || item.menuItem,
          name: item.menuItem?.name || "Item",
          image: item.menuItem?.image || "",
          price: item.price,
          quantity: item.quantity,
          note: item.notes || "",
        }))
      );
      success('Item removed from cart');
    } catch (err) {
      error('Failed to remove cart item');
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!guestId) return;
    try {
      await clearGuestCart({ guestId, qrToken: token });
      setCartItems([]);
      success('Cart cleared successfully');
    } catch (err) {
      error('Failed to clear cart');
    }
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const total = Math.max(0, subtotal - promoDiscount);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      warning("Please enter a promo code.");
      return;
    }
    if (cartItems.length === 0) {
      warning("Your cart is empty.");
      return;
    }

    try {
      setApplyingPromo(true);
      const res = await api.post("/customer/promo/validate", {
        qrToken: token,
        code: promoCode.trim(),
        items: cartItems.map((item) => ({
          menuItemId: item._id,
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

  const handleProceedToCheckout = async () => {
    if (cartItems.length === 0) {
      warning("Your cart is empty.");
      return;
    }

    try {
      setIsPlacingOrder(true);

      const dashUser = getParsedAuthUser();
      const payload = {
        qrToken: token,
        guestId,
        paymentMethod,
        customerName: dashUser?.name || "Guest",
        customerPhone: dashUser?.phone || "",
        customerEmail: dashUser?.email || "",
        promoCode: appliedPromo?.code || "",
        items: cartItems.map((item) => ({
          menuItemId: item._id,
          quantity: item.quantity,
          note: item.note || "",
        })),
      };

      const res = await api.post("/customer/checkout", payload);
      const order = res?.data?.data;

      await clearGuestCart({ guestId, qrToken: token });
      setCartItems([]);
      setAppliedPromo(null);
      setPromoDiscount(0);
      setPromoCode("");

      success(`Order ${order?.orderNumber || ""} sent to kitchen.`);

      setTimeout(() => {
        navigate(order?.trackToken ? `/order/track/${order.trackToken}` : `/orders/${slug}/${token}`);
      }, 900);
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to place order. Try again.";
      error(message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-44 text-gray-950">
      {/* Header */}
      <header className="px-5 pt-12 pb-5 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-gray-100">
        <button
          className="p-2 bg-gray-50 rounded-xl hover:bg-red-300 transition-colors"
          onClick={() => navigate(-1) || navigate("/")}
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black text-gray-900">Review Order</h1>
          <p className="text-[11px] font-semibold text-gray-400">Confirm before kitchen receives it</p>
        </div>
        <button 
          className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
          onClick={clearCart}
        >
          <Trash2 size={20} />
        </button>
      </header>

      {/* Cart Items */}
      <div className="px-5 pt-5">
        <div className="rounded-3xl bg-primary-900 p-5 text-white shadow-xl shadow-primary-900/10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 text-primary-800">
              <ChefHat size={24} />
            </div>
            <div>
              <p className="text-sm font-black">Send order to kitchen</p>
              <p className="text-xs font-semibold text-slate-300">Kitchen, cashier, and waiter dashboards update instantly.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-slate-300">
            <span className="rounded-xl bg-white/10 px-2 py-2">1. Review</span>
            <span className="rounded-xl bg-white/10 px-2 py-2">2. Send</span>
            <span className="rounded-xl bg-white/10 px-2 py-2">3. Track</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-4">
        {cartItems.map((item) => (
          <motion.div layout key={item._id} className="flex items-center gap-4 rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
            <img
              src={item.image}
              alt={item.name}
              className="w-20 h-20 object-cover rounded-2xl"
            />

            <div className="flex-1">
              <h3 className="font-bold text-gray-800 text-sm">{item.name}</h3>
              <p className="text-orange-500 font-bold text-sm mt-1">
                Rs. {item.price}
              </p>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button
                onClick={() => decreaseQty(item._id)}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-400 active:scale-90"
              >
                <Minus size={14} />
              </button>
              <span className="text-sm font-bold w-4 text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => increaseQty(item._id)}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-700 active:scale-90"
              >
                <Plus size={14} />
              </button>
            </div>
            
            <button
              onClick={() => removeItem(item._id)}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Bill Details */}
      <div className="mx-5 mt-3 space-y-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Enter promo code"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
          <button
            onClick={handleApplyPromo}
            disabled={applyingPromo}
            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm disabled:opacity-60"
          >
            {applyingPromo ? "Applying..." : "Apply"}
          </button>
        </div>
        {appliedPromo && (
          <div className="text-xs text-green-600 font-medium">
            Applied {appliedPromo.code}: -Rs. {promoDiscount}
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Subtotal</span>
          <span className="text-gray-800 font-medium">Rs. {subtotal}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Promo Discount</span>
          <span className="text-green-600 font-medium">- Rs. {promoDiscount}</span>
        </div>
        <div className="h-px bg-dashed border-t border-dashed border-gray-200 my-2"></div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-800">Total</span>
          <span className="text-xl font-black text-orange-500">
            Rs. {total}
          </span>
        </div>
      </div>

      {/* Payment Selection */}
      <div className="mx-5 mt-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
          Select Payment
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <label
            className={`relative border-2 rounded-2xl p-4 flex flex-col items-center cursor-pointer transition-all ${
              paymentMethod === "cash"
                ? "border-orange-500 bg-orange-50"
                : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <Landmark
              size={24}
              className={`${paymentMethod === "cash" ? "text-orange-500" : "text-gray-400"} mb-2`}
            />
            <span
              className={`text-xs font-bold ${paymentMethod === "cash" ? "text-orange-600" : "text-gray-500"}`}
            >
              Pay at Counter
            </span>
            <input
              type="radio"
              name="payment"
              className="hidden"
              checked={paymentMethod === "cash"}
              onChange={() => setPaymentMethod("cash")}
            />
            {paymentMethod === "cash" && (
              <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            )}
          </label>

          <label
            className={`relative border-2 rounded-2xl p-4 flex flex-col items-center cursor-pointer transition-all ${
              paymentMethod === "upi"
                ? "border-orange-500 bg-orange-50"
                : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <CreditCard size={24} className="text-gray-400 mb-2" />
            <span className="text-xs font-bold text-gray-500">
              Digital Payment
            </span>
            <input
              type="radio"
              name="payment"
              className="hidden"
              checked={paymentMethod === "upi"}
              onChange={() => setPaymentMethod("upi")}
            />
            {paymentMethod === "upi" && (
              <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/95 border-t border-gray-100 shadow-[0_-10px_24px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mb-3 flex items-center justify-center gap-2 text-[11px] font-bold text-gray-500">
          <ShieldCheck size={14} className="text-emerald-600" />
          You can track every kitchen status after sending.
        </div>
        <button
          onClick={handleProceedToCheckout}
          disabled={isPlacingOrder || cartItems.length === 0}
          className="w-full bg-primary-600 hover:bg-primary-700 py-4 rounded-2xl text-white font-black text-base shadow-xl shadow-primary-900/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPlacingOrder ? "Sending to kitchen..." : <>Send Order to Kitchen <Send size={18} /></>}
        </button>
      </div>

      <AnimatePresence>
        {isPlacingOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-6 backdrop-blur-sm"
          >
            <motion.div initial={{ y: 20, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.96 }} className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
                <ChefHat size={30} className="animate-pulse" />
              </div>
              <h2 className="mt-4 text-xl font-black text-gray-950">Sending to kitchen</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">Please wait while your order reaches the restaurant dashboard.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Cart;
