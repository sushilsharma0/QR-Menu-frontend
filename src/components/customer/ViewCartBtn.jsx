import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronUp } from "lucide-react";
import { useCustomerCart } from "../../context/CustomerCartContext";

/**
 * Sticky floating cart bar. Lives just above the bottom navigation and turns
 * into a tappable "preview cart" button. Clicking it opens the CartDrawer so
 * the customer never leaves the menu while reviewing.
 *
 * The component now reads cart state from CustomerCartContext (no more
 * 1500ms polling). It also briefly pulses when a new item is added so the
 * customer gets an obvious confirmation that their tap worked.
 */
export default function ViewCartBtn({ offset = "5.25rem", hidden = false }) {
  const { totals, openDrawer, lastAddedAt } = useCustomerCart();
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!lastAddedAt) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 700);
    return () => clearTimeout(t);
  }, [lastAddedAt]);

  return (
    <AnimatePresence>
      {totals.count > 0 && !hidden && (
        <motion.div
          key="floating-cart-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="pointer-events-none fixed inset-x-0 z-[95] flex justify-center px-4"
          // Add the device safe-area inset so the pill always clears the
          // bottom navigation on iOS (home-indicator) and Android gesture
          // bars — previously the hard-coded 5.25rem overlapped the nav
          // on iPhones, which is what the customer perceived as a "messy"
          // / overlapping cart UI.
          style={{ bottom: `calc(${offset} + env(safe-area-inset-bottom, 0px))` }}
        >
          <motion.button
            type="button"
            onClick={openDrawer}
            animate={pulse ? { scale: [1, 1.04, 1] } : { scale: 1 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            whileTap={{ scale: 0.96 }}
            className="pointer-events-auto relative flex w-full max-w-md items-center justify-between gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 px-5 py-3.5 text-left shadow-[0_18px_40px_-12px_rgba(122,34,0,0.55)] ring-1 ring-primary-900/10 transition-all"
            aria-label="View cart"
          >
            <motion.span
              aria-hidden
              animate={pulse ? { opacity: [0, 0.35, 0] } : { opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="absolute inset-0 bg-white"
            />

            <div className="relative flex items-center gap-3">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <ShoppingBag size={18} className="text-white" />
                <motion.span
                  key={totals.count}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-attention-300 px-1 text-[10px] font-black text-primary-900 ring-2 ring-primary-700"
                >
                  {totals.count}
                </motion.span>
              </span>

              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/75">
                  {totals.count} item{totals.count > 1 ? "s" : ""} · tap to review
                </span>
                <span className="text-base font-black text-white">
                  Rs. {totals.subtotal}
                </span>
              </div>
            </div>

            <div className="relative flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-black text-white">
              View cart
              <ChevronUp size={14} strokeWidth={3} />
            </div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
