import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, ReceiptText, UtensilsCrossed } from "lucide-react";

/**
 * Floating actions on order tracking — sits above bottom nav / safe area.
 */
export default function OrderTrackingFab({
  qrToken,
  showBill,
  menuHref,
  onScrollToTimeline,
}) {
  return (
    <div className="pointer-events-none fixed bottom-28 right-4 z-[100] flex flex-col items-end gap-2 sm:bottom-32">
      <AnimatePresence>
        {showBill && qrToken && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          >
            <Link
              to={`/order/bill/${qrToken}`}
              className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/30 bg-gradient-to-r from-primary-700 to-primary-600 px-4 py-3 text-sm font-black text-white shadow-xl shadow-primary-900/35 ring-1 ring-primary-900/20 transition active:scale-95"
            >
              <ReceiptText size={18} />
              View bill
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {menuHref && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 28, delay: 0.05 }}
        >
          <Link
            to={menuHref}
            className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/95 px-4 py-3 text-sm font-black text-gray-900 shadow-lg backdrop-blur-xl transition active:scale-95"
          >
            <UtensilsCrossed size={18} className="text-primary-600" />
            Add items
          </Link>
        </motion.div>
      )}

      {typeof onScrollToTimeline === "function" && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={onScrollToTimeline}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-primary-700 shadow-lg backdrop-blur-xl"
          aria-label="Scroll to timeline"
        >
          <MapPin size={20} />
        </motion.button>
      )}
    </div>
  );
}
