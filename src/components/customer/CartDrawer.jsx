import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
  ArrowRight,
  ChefHat,
  PackageOpen,
} from "lucide-react";
import { useCustomerCart } from "../../context/CustomerCartContext";

/**
 * Bottom-sheet cart drawer that opens *over* the menu so customers can review,
 * tweak quantities and continue browsing without losing context. The drawer is
 * fully controlled by CustomerCartContext so any Add-to-Cart anywhere in the
 * customer panel can pop it open with a single call to `openDrawer()`.
 */
export default function CartDrawer() {
  const {
    items,
    totals,
    isDrawerOpen,
    closeDrawer,
    increment,
    decrement,
    removeLine,
    clear,
  } = useCustomerCart();
  const navigate = useNavigate();
  const { slug, token } = useParams();

  const goToCheckout = () => {
    closeDrawer();
    if (slug && token) navigate(`/cart/${slug}/${token}`);
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <motion.div
          key="cart-drawer-root"
          className="fixed inset-0 z-[120] flex items-end justify-center"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.button
            type="button"
            onClick={closeDrawer}
            aria-label="Close cart"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 },
            }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            variants={{
              hidden: { y: "100%", opacity: 0.4 },
              visible: { y: 0, opacity: 1 },
            }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-t-[2rem] bg-white shadow-[0_-24px_60px_-20px_rgba(15,23,42,0.45)]"
          >
            {/* Drag handle */}
            <div className="flex w-full justify-center pt-3">
              <span className="h-1.5 w-12 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                  <ShoppingBag size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-900">Your cart</p>
                  <p className="text-[11px] font-semibold text-gray-500">
                    {totals.count > 0
                      ? `${totals.count} item${totals.count > 1 ? "s" : ""} · Rs. ${totals.subtotal}`
                      : "Cart is empty"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-xl bg-gray-100 p-2 text-gray-600 transition active:scale-90"
                aria-label="Close cart"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[58vh] overflow-y-auto overscroll-contain px-5 pb-3">
              {items.length === 0 ? (
                <EmptyState onClose={closeDrawer} />
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence initial={false} mode="popLayout">
                    {items.map((item) => (
                      <motion.li
                        layout
                        key={item.lineId || item.menuItemId}
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 40, scale: 0.92 }}
                        transition={{ type: "spring", stiffness: 320, damping: 30 }}
                        className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
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
                          <p className="mt-0.5 text-xs font-semibold text-primary-700">
                            Rs. {item.price}
                          </p>
                          {(item.selectedVariations || []).length > 0 && (
                            <p className="mt-0.5 truncate text-[10px] font-semibold text-gray-500">
                              {(item.selectedVariations || [])
                                .map((v) => `${v.groupName}: ${v.optionName}${Number(v.quantity || 1) > 1 ? ` x${v.quantity}` : ""}`)
                                .join(" | ")}
                            </p>
                          )}
                          {(item.customizations || []).length > 0 && (
                            <p className="mt-0.5 truncate text-[10px] font-semibold text-gray-400">
                              {(item.customizations || [])
                                .map((c) => `${c.name || c.group}: ${c.value}`)
                                .join(" · ")}
                            </p>
                          )}
                          {item.cookingInstructions ? (
                            <p className="mt-0.5 truncate text-[10px] font-semibold text-amber-700">
                              Note: {item.cookingInstructions}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <QuantityStepper
                            quantity={item.quantity}
                            onMinus={() => decrement(item.menuItemId, item.lineId)}
                            onPlus={() => increment(item.menuItemId, item.lineId)}
                          />
                          <button
                            type="button"
                            onClick={() => removeLine(item.menuItemId, item.lineId)}
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
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 bg-gradient-to-b from-white to-surface-50/60 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-500">Subtotal</span>
                  <span className="text-base font-black text-gray-900">
                    Rs. {totals.subtotal}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                  <ChefHat size={12} /> Sent to the kitchen — pay after you&apos;re served.
                </p>

                <div className="mt-4 grid grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={clear}
                    className="col-span-2 rounded-2xl border border-gray-200 bg-white py-3 text-xs font-black text-gray-700 transition active:scale-95"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={goToCheckout}
                    className="col-span-3 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 py-3 text-sm font-black text-white shadow-lg shadow-primary-900/25 transition active:scale-95"
                  >
                    Checkout
                    <ArrowRight size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={closeDrawer}
                  className="mt-2 w-full rounded-2xl py-2 text-[11px] font-bold text-gray-500"
                >
                  Continue browsing
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function QuantityStepper({ quantity, onMinus, onPlus }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-primary-100 bg-primary-50/70 px-1.5 py-1">
      <button
        type="button"
        onClick={onMinus}
        aria-label="Decrease"
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-primary-700 shadow-sm transition active:scale-90"
      >
        <Minus size={14} strokeWidth={3} />
      </button>
      <motion.span
        key={quantity}
        initial={{ scale: 0.85, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 22 }}
        className="w-5 text-center text-sm font-black tabular-nums text-primary-800"
      >
        {quantity}
      </motion.span>
      <button
        type="button"
        onClick={onPlus}
        aria-label="Increase"
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm transition active:scale-90"
      >
        <Plus size={14} strokeWidth={3} />
      </button>
    </div>
  );
}

function EmptyState({ onClose }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
        <ShoppingBag size={26} />
      </div>
      <p className="mt-4 text-sm font-black text-gray-900">Cart is empty</p>
      <p className="mx-auto mt-1 max-w-[16rem] text-xs font-semibold text-gray-400">
        Tap the green + on any item to start building your order.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-5 rounded-2xl bg-primary-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-primary-900/20 transition active:scale-95"
      >
        Browse menu
      </button>
    </div>
  );
}
