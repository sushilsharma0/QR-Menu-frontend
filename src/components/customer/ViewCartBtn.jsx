import { ShoppingBag } from "lucide-react";
import React from "react";
import { Link, useParams } from "react-router-dom";

export default function ViewCartBtn() {
  const { slug, token } = useParams();

  const cart = JSON.parse(localStorage.getItem("cart")) || { items: [] };
  const totalItems = (cart.items || []).reduce(
    (sum, item) => sum + (item.quantity || 0),
    0,
  );

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 px-6">
      <Link
        to={`/cart/${slug}/${token}`}
        className="w-full bg-orange-500 py-4 rounded-2xl flex items-center justify-between px-6 shadow-xl shadow-orange-200 active:scale-95 transition-transform"
      >
        <div className="flex items-center gap-3">
          <ShoppingBag size={20} className="text-white" />
          <span className="text-white font-bold">View Cart</span>
        </div>
        <span className="bg-white text-orange-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
          {totalItems}
        </span>
      </Link>
    </div>
  );
}
