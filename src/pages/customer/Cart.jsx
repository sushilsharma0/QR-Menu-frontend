import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Landmark,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);

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
  };

  // Clear entire cart
  const clearCart = () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      setCartItems([]);
      localStorage.removeItem("cart");
    }
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const serviceCharge = Math.round(subtotal * 0.05);
  const total = subtotal + serviceCharge;

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
          <label className="relative border-2 border-orange-500 bg-orange-50 rounded-2xl p-4 flex flex-col items-center cursor-pointer transition-all">
            <Landmark size={24} className="text-orange-500 mb-2" />
            <span className="text-xs font-bold text-orange-600">
              Pay at Counter
            </span>
            <input
              type="radio"
              name="payment"
              className="hidden"
              defaultChecked
            />
            <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </label>

          <label className="relative border-2 border-gray-100 rounded-2xl p-4 flex flex-col items-center cursor-pointer hover:border-gray-200 transition-all">
            <CreditCard size={24} className="text-gray-400 mb-2" />
            <span className="text-xs font-bold text-gray-500">
              Digital Payment
            </span>
            <input type="radio" name="payment" className="hidden" />
          </label>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-50 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <button className="w-full bg-orange-500 hover:bg-orange-600 py-4 rounded-2xl text-white font-bold text-lg shadow-xl shadow-orange-200 transition-all active:scale-[0.98]">
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;
