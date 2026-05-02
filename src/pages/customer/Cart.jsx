import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Landmark,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { ToastContainer } from "../../components/common/ToastContainer";

const Cart = () => {
  const navigate = useNavigate();
  const { slug, token } = useParams();
  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const { toasts, removeToast, success, error, warning } = useToast();

  useEffect(() => {
    const item = localStorage.getItem("cart");
    console.log("Cart item from localStorage:", item);
    if (item) {
      try {
        const parsedItems = JSON.parse(item);
        setCartItems(parsedItems.items || []);
      } catch (error) {
        console.error("Error parsing cart items from localStorage:", error);
      }
    }
  }, []);

  useEffect(() => {
    const existing = JSON.parse(localStorage.getItem("cart")) || {};

    const updatedCart = {
      ...existing,
      items: cartItems,
      total: cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0,
      ),
    };

    localStorage.setItem("cart", JSON.stringify(updatedCart));
  }, [cartItems]);

  // Increase quantity
  const increaseQty = (id) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item._id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  // Decrease quantity
  const decreaseQty = (id) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item._id === id) {
          if (item.quantity > 1) {
            return { ...item, quantity: item.quantity - 1 };
          }
          return null;
        }
        return item;
      }).filter(item => item !== null)
    );
  };

  // Remove item from cart
  const removeItem = (id) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== id));
    success('Item removed from cart');
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("cart");
    success('Cart cleared successfully');
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const serviceCharge = Math.round(subtotal * 0.05);
  const total = subtotal + serviceCharge;

  const handleProceedToCheckout = async () => {
    if (cartItems.length === 0) {
      warning("Your cart is empty.");
      return;
    }

    try {
      setIsPlacingOrder(true);

      const user = JSON.parse(localStorage.getItem("user")) || {};
      const payload = {
        qrToken: token,
        paymentMethod,
        customerName: user.name || "Guest",
        customerPhone: user.phone || "",
        customerEmail: user.email || "",
        items: cartItems.map((item) => ({
          menuItemId: item._id,
          quantity: item.quantity,
          note: item.note || "",
        })),
      };

      const res = await api.post("/customer/checkout", payload);
      const order = res?.data?.data;

      localStorage.removeItem("cart");
      setCartItems([]);

      if (paymentMethod === "cash") {
        success(
          `Order ${order?.orderNumber || ""} placed. Please pay at counter.`,
        );
      } else {
        success(
          `Payment successful. Order ${order?.orderNumber || ""} confirmed.`,
        );
      }

      setTimeout(() => {
        navigate(`/orders/${slug}/${token}`);
      }, 2000);
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to place order. Try again.";
      error(message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-40">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button
          className="p-2 bg-gray-50 rounded-xl hover:bg-red-300 transition-colors"
          onClick={() => navigate(-1) || navigate("/")}
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Your Cart</h1>
        <button 
          className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
          onClick={clearCart}
        >
          <Trash2 size={20} />
        </button>
      </header>

      {/* Cart Items */}
      <div className="px-6 py-4 space-y-6">
        {cartItems.map((item) => (
          <div key={item._id} className="flex items-center gap-4">
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
          </div>
        ))}
      </div>

      {/* Bill Details */}
      <div className="px-6 mt-8 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Subtotal</span>
          <span className="text-gray-800 font-medium">Rs. {subtotal}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Service Charge (5%)</span>
          <span className="text-gray-800 font-medium">Rs. {serviceCharge}</span>
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
      <div className="px-6 mt-8">
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
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-50 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <button
          onClick={handleProceedToCheckout}
          disabled={isPlacingOrder || cartItems.length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 py-4 rounded-2xl text-white font-bold text-lg shadow-xl shadow-orange-200 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPlacingOrder ? "Processing..." : "Proceed to Checkout"}
        </button>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Cart;
